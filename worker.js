// Worker entry point — handles /api/insight, static assets served by [assets]

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleInsight(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
  if (isRateLimited(clientIP)) {
    return json({ insight: '请求过于频繁，请稍后再试。' }, 429);
  }

  try {
    const body = await request.json();
    const { analysis, stats, lang = 'zh' } = body;

    if (!stats?.currentPrice || !analysis?.stage) {
      return json({ insight: lang === 'en' ? 'Invalid request data.' : '请求数据无效。' }, 400);
    }

    if (!env?.API_KEY) {
      return json({ insight: lang === 'en' ? 'API key not configured.' : 'API密钥未配置，请检查环境变量。' }, 500);
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
      return json({ insight: cacheEntry.insight });
    }

    const stageNames = lang === 'en'
      ? { observation: 'Observation (0-30d)', confirmation: 'Confirmation (30-70d)', warning: 'Warning (70-100d)', rest: 'Rest Period' }
      : { observation: '观察期 (0-30天)', confirmation: '确认期 (30-70天)', warning: '预警期 (70-100天)', rest: '休息期' };
    const stageName = stageNames[analysis.stage] || stageNames.rest;

    const systemPrompt = lang === 'en'
      ? `You are a senior Bitcoin cycle analyst specializing in the "100-Day Bull Run Theory" (百日冲顶理论).

Core Theory Framework:
1. Historical Pattern: BTC unilateral rallies from cycle bottom to local top typically last 60-100 days. This is derived from multiple cycles (2017, 2019, 2021, 2024) where parabolic advances showed similar temporal structures.
2. Four Stages:
   - Observation (0-30d): Price reclaims EMA15, volume gradually increases. Bayesian prior: low probability (~20-40%). Key signal: 5+ consecutive days above EMA15 with rising volume.
   - Confirmation (30-70d): Sustained breakout, single-sided rise confirmed (max drawdown <15%), volume expansion >1.2x average. Bayesian update: probability rises to 50-75%.
   - Warning (70-100d): Momentum divergence appears, volume may peak then decline, extreme greed sentiment. Probability peaks >75% then starts declining as cycle exhaustion approaches.
   - Rest: Cycle completed or invalidated. Waiting for next setup.
3. Invalidation Criteria: Any drawdown >20% from local high, or EMA15 broken for 3+ consecutive days with volume, resets the cycle.
4. Bayesian Approach: Don't count days mechanically. Weight evidence: EMA position, volume trend, drawdown depth, momentum indicators. Update probability dynamically based on new data confirming or contradicting the thesis.

Your analysis style: institutional-grade, evidence-based, acknowledge uncertainty. Never give absolute predictions.`
      : `你是一位资深比特币周期分析师，专精"百日冲顶理论"。

核心理论框架：
1. 历史规律：BTC从周期底部到局部顶部的单边上涨通常持续60-100天。此规律来源于多轮周期（2017、2019、2021、2024），抛物线式上涨呈现相似的时间结构。
2. 四阶段模型：
   - 观察期(0-30天)：价格收复EMA15，成交量逐步放大。贝叶斯先验概率低(~20-40%)。关键信号：连续5天以上站稳EMA15且量能递增。
   - 确认期(30-70天)：持续突破，单边上涨确认（最大回撤<15%），成交量放大至均值1.2倍以上。贝叶斯更新：概率升至50-75%。
   - 预警期(70-100天)：动量背离出现，成交量可能见顶后回落，市场极度贪婪。概率峰值>75%后开始下降，周期耗竭临近。
   - 休息期：周期完成或失效，等待下一次建仓机会。
3. 失效标准：任何一次从局部高点回撤>20%，或EMA15连续3天以上放量跌破，则重置周期计数。
4. 贝叶斯方法：不机械数日子，而是加权各类证据（EMA位置、量能趋势、回撤深度、动量指标），根据新数据动态更新概率——是确认还是反驳当前判断。

分析风格：机构级、基于证据、承认不确定性。绝不给出绝对预测。`;

    const userPrompt = lang === 'en'
      ? `Current BTC market snapshot:
- Price: $${price.toLocaleString()} | 24h change: ${change24h.toFixed(2)}%
- Stage: ${stageName} | Bayesian probability: ${probability}% | Cycle day: ${daysInCycle}
- EMA15: ${analysis.criteria?.emaBreakout ? 'Above' : 'Below'} (distance: ${emaDistance}%)
- Single-sided rise: ${analysis.criteria?.singleSidedRise ? 'Confirmed' : 'Not confirmed'} (max drawdown from high: ${maxDrawdown}%)
- Volume: ${analysis.criteria?.volumeExpansion ? 'Expanding' : 'Contracting/Flat'} (ratio vs 20d avg: ${volumeRatio}x)
- Consecutive days above EMA15: ${consecutiveDays}
- 7d gain: ${gain7d}% | 30d gain: ${gain30d}%

Analyze this data through the 100-Day Theory lens:
1. Stage Assessment: Does the data support the current stage classification? What evidence confirms or contradicts it?
2. Probability Reasoning: Is the ${probability}% Bayesian estimate appropriate? What factors would move it higher or lower?
3. Key Risk: What is the single biggest threat to this cycle continuing? At what price level does the thesis invalidate?
4. Actionable Insight: One specific, position-sizing-aware recommendation.

Keep response to 4-5 sentences, dense with reasoning.`
      : `当前BTC市场快照：
- 价格: $${price.toLocaleString()} | 24h涨跌: ${change24h.toFixed(2)}%
- 阶段: ${stageName} | 贝叶斯概率: ${probability}% | 周期第${daysInCycle}天
- EMA15: ${analysis.criteria?.emaBreakout ? '已突破' : '未突破'} (偏离度: ${emaDistance}%)
- 单边上涨: ${analysis.criteria?.singleSidedRise ? '已确认' : '未确认'} (距高点最大回撤: ${maxDrawdown}%)
- 成交量: ${analysis.criteria?.volumeExpansion ? '放量' : '缩量/持平'} (相对20日均量: ${volumeRatio}倍)
- 连续站上EMA15天数: ${consecutiveDays}
- 7日涨幅: ${gain7d}% | 30日涨幅: ${gain30d}%

请从百日冲顶理论视角分析：
1. 阶段判断：当前数据是否支持所处阶段的分类？哪些证据在确认、哪些在反驳？
2. 概率推理：${probability}%的贝叶斯估计是否合理？什么因素会让它上升或下降？
3. 核心风险：当前周期延续的最大威胁是什么？价格跌破什么位置会使理论失效？
4. 操作建议：一条具体的、考虑仓位管理的建议。

控制在4-5句话，每句都有推理依据。`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error(`DeepSeek API error: ${resp.status} ${errText}`);
      return json({ insight: lang === 'en' ? 'AI service returned an error. Please try again.' : 'AI 服务返回错误，请稍后重试。' }, 502);
    }

    const data = await resp.json();
    const insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return json({ insight: lang === 'en' ? 'AI returned an empty response.' : 'AI 返回了空内容，请重试。' }, 502);
    }

    insightCache[cacheKey] = {
      insight,
      snapshot,
      updatedAt: Date.now(),
    };

    return json({ insight });
  } catch (error) {
    console.error('Insight API error:', error?.message || error);
    const isAbort = error?.name === 'AbortError';
    return json({
      insight: isAbort ? '请求超时，AI 服务响应过慢，请稍后重试。' : 'AI 分析服务暂时不可用，请稍后重试。',
    }, isAbort ? 504 : 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/insight') {
      return handleInsight(request, env);
    }

    // All other requests → static assets (handled by [assets] binding)
    return env.ASSETS.fetch(request);
  },
};
