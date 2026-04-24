// Simple in-memory rate limiting (per-isolate, resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

const insightCache = {
  zh: null,
  en: null,
};

const CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const CACHE_THRESHOLD = {
  pricePct: 0.003,
  change24hPct: 0.3,
  probabilityPct: 2,
  emaDistancePct: 0.5,
  maxDrawdownPct: 0.6,
  volumeRatio: 0.08,
  gain7dPct: 0.6,
  gain30dPct: 1.2,
  consecutiveDays: 1,
};

function buildSnapshot(analysis, stats) {
  return {
    stage: analysis?.stage,
    price: Number(stats?.currentPrice) || 0,
    change24h: Number(stats?.change24hPercent) || 0,
    probability: Number(analysis?.probability) || 0,
    emaDistance: Number(analysis?.metrics?.emaDistance) || 0,
    maxDrawdown: Number(analysis?.metrics?.maxDrawdown) || 0,
    volumeRatio: Number(analysis?.metrics?.volumeRatio) || 0,
    gain7d: Number(analysis?.metrics?.gain7d) || 0,
    gain30d: Number(analysis?.metrics?.gain30d) || 0,
    consecutiveDays: Number(analysis?.criteria?.consecutiveDays) || 0,
  };
}

function isSmallFluctuation(prev, curr) {
  if (!prev || !curr) return false;
  if (prev.stage !== curr.stage) return false;
  if (prev.price <= 0 || curr.price <= 0) return false;

  const pricePct = Math.abs((curr.price - prev.price) / prev.price);
  return (
    pricePct <= CACHE_THRESHOLD.pricePct &&
    Math.abs(curr.change24h - prev.change24h) <= CACHE_THRESHOLD.change24hPct &&
    Math.abs(curr.probability - prev.probability) <= CACHE_THRESHOLD.probabilityPct &&
    Math.abs(curr.emaDistance - prev.emaDistance) <= CACHE_THRESHOLD.emaDistancePct &&
    Math.abs(curr.maxDrawdown - prev.maxDrawdown) <= CACHE_THRESHOLD.maxDrawdownPct &&
    Math.abs(curr.volumeRatio - prev.volumeRatio) <= CACHE_THRESHOLD.volumeRatio &&
    Math.abs(curr.gain7d - prev.gain7d) <= CACHE_THRESHOLD.gain7dPct &&
    Math.abs(curr.gain30d - prev.gain30d) <= CACHE_THRESHOLD.gain30dPct &&
    Math.abs(curr.consecutiveDays - prev.consecutiveDays) <= CACHE_THRESHOLD.consecutiveDays
  );
}

function shouldUseCache(cacheEntry, snapshot) {
  if (!cacheEntry) return false;
  if (!cacheEntry.insight) return false;
  if (Date.now() - cacheEntry.updatedAt > CACHE_MAX_AGE_MS) return false;
  return isSmallFluctuation(cacheEntry.snapshot, snapshot);
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
  if (isRateLimited(clientIP)) {
    return jsonResponse({ insight: '请求过于频繁，请稍后再试。' }, 429);
  }

  try {
    const body = await request.json();
    const { analysis, stats, lang = 'zh' } = body;

    // Input validation
    if (!stats?.currentPrice || !analysis?.stage) {
      return jsonResponse({ insight: lang === 'en' ? 'Invalid request data.' : '请求数据无效。' }, 400);
    }

    if (!env?.API_KEY) {
      return jsonResponse({
        insight: lang === 'en' ? 'API key not configured.' : 'API密钥未配置，请检查环境变量。'
      }, 500);
    }

    const price = Number(stats.currentPrice) || 0;
    const change24h = Number(stats.change24hPercent) || 0;
    const emaDistance = Number(analysis.metrics?.emaDistance) || 0;
    const maxDrawdown = Number(analysis.metrics?.maxDrawdown) || 0;
    const volumeRatio = Number(analysis.metrics?.volumeRatio) || 1;
    const consecutiveDays = Number(analysis.criteria?.consecutiveDays) || 0;
    const gain7d = Number(analysis.metrics?.gain7d) || 0;
    const gain30d = Number(analysis.metrics?.gain30d) || 0;
    const probability = Number(analysis.probability) || 0;
    const daysInCycle = Number(analysis.daysInCycle) || 0;
    const snapshot = buildSnapshot(analysis, stats);
    const cacheKey = lang === 'en' ? 'en' : 'zh';
    const cacheEntry = insightCache[cacheKey];

    if (shouldUseCache(cacheEntry, snapshot)) {
      return jsonResponse({ insight: cacheEntry.insight });
    }

    const stageNames = lang === 'en'
      ? { observation: 'Observation (0-30d)', confirmation: 'Confirmation (30-70d)', warning: 'Warning (70-100d)', rest: 'Rest Period' }
      : { observation: '观察期 (0-30天)', confirmation: '确认期 (30-70天)', warning: '预警期 (70-100天)', rest: '休息期' };

    const stageName = stageNames[analysis.stage] || stageNames.rest;

    const systemPrompt = lang === 'en'
      ? `You are a senior Bitcoin cycle analyst specializing in the "100-Day Bull Run Theory". This theory posits that unilateral rapid BTC rises typically last ~100 days before peaking, divided into 4 stages: Observation (0-30d), Confirmation (30-70d), Warning (70-100d), and Rest. You use Bayesian probability to assess cycle progression, not mechanical day counting. Be concise, data-driven, and actionable.`
      : `你是一位资深比特币周期分析师，专精"100天牛市理论"。该理论认为BTC单边快速上涨通常持续约100天到达峰值，分为四个阶段：观察期(0-30天)、确认期(30-70天)、预警期(70-100天)、休息期。你用贝叶斯概率动态评估周期进展，不机械数日子。回答要简练、基于数据、给出可执行建议。`;

    const userPrompt = lang === 'en'
      ? `Current BTC market snapshot:
- Price: $${price.toLocaleString()} | 24h: ${change24h.toFixed(2)}%
- Stage: ${stageName} | Probability: ${probability}% | Cycle day: ${daysInCycle}
- EMA15: ${analysis.criteria?.emaBreakout ? 'Above' : 'Below'} (${emaDistance}% away)
- Single-sided rise: ${analysis.criteria?.singleSidedRise ? 'Yes' : 'No'} (max drawdown ${maxDrawdown}%)
- Volume: ${analysis.criteria?.volumeExpansion ? 'Expanding' : 'Flat'} (ratio ${volumeRatio})
- ${consecutiveDays} consecutive days above EMA15
- 7d gain: ${gain7d}% | 30d gain: ${gain30d}%

Give a brief market assessment (3-4 sentences): confirm the stage, highlight the key risk, and suggest one concrete action.`
      : `当前BTC市场快照：
- 价格: $${price.toLocaleString()} | 24h涨跌: ${change24h.toFixed(2)}%
- 阶段: ${stageName} | 概率: ${probability}% | 周期第${daysInCycle}天
- EMA15: ${analysis.criteria?.emaBreakout ? '已突破' : '未突破'} (偏离${emaDistance}%)
- 单边上涨: ${analysis.criteria?.singleSidedRise ? '是' : '否'} (最大回撤${maxDrawdown}%)
- 成交量: ${analysis.criteria?.volumeExpansion ? '放量' : '缩量'} (比率${volumeRatio})
- 连续${consecutiveDays}天站上EMA15
- 7日涨幅: ${gain7d}% | 30日涨幅: ${gain30d}%

请给出简要市场评估（3-4句话）：确认当前阶段判断、指出关键风险、给出一条具体操作建议。`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`DeepSeek API error: ${response.status} ${errText}`);
      return jsonResponse({
        insight: lang === 'en' ? 'AI service returned an error. Please try again.' : 'AI 服务返回错误，请稍后重试。'
      }, 502);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();

    if (!insight) {
      return jsonResponse({
        insight: lang === 'en' ? 'AI returned an empty response.' : 'AI 返回了空内容，请重试。'
      }, 502);
    }

    insightCache[cacheKey] = {
      insight,
      snapshot,
      updatedAt: Date.now(),
    };

    return jsonResponse({ insight });
  } catch (error) {
    console.error('Insight API error:', error?.message || error);
    const isAbort = error?.name === 'AbortError';
    return jsonResponse({
      insight: isAbort
        ? '请求超时，AI 服务响应过慢，请稍后重试。'
        : 'AI 分析服务暂时不可用，请稍后重试。'
    }, isAbort ? 504 : 500);
  }
}