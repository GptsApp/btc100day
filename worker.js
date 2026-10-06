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
  evidenceScorePct: 2,
  emaDistancePct: 0.5,
  maxDrawdownPct: 0.6,
  maxGain30dPct: 1.2,
  volumeRatio: 0.08,
  change7dPct: 0.6,
  change30dPct: 1.2,
  consecutiveDays: 1,
};

const VALID_STAGES = new Set(['observation', 'confirmation', 'warning', 'rest']);

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildSnapshot(analysis, stats) {
  return {
    stage: analysis?.stage,
    price: toFiniteNumber(stats?.currentPrice),
    change24h: toFiniteNumber(stats?.change24hPercent),
    evidenceScore: toFiniteNumber(analysis?.probability),
    emaDistance: toFiniteNumber(analysis?.metrics?.emaDistance),
    maxDrawdown: toFiniteNumber(analysis?.metrics?.maxDrawdown),
    maxGain30d: toFiniteNumber(analysis?.metrics?.maxGain30d),
    volumeRatio: toFiniteNumber(analysis?.metrics?.volumeRatio),
    change7d: toFiniteNumber(analysis?.metrics?.change7d),
    change30d: toFiniteNumber(analysis?.metrics?.change30d),
    consecutiveDays: toFiniteNumber(analysis?.criteria?.consecutiveDays),
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
    Math.abs(curr.evidenceScore - prev.evidenceScore) <= CACHE_THRESHOLD.evidenceScorePct &&
    Math.abs(curr.emaDistance - prev.emaDistance) <= CACHE_THRESHOLD.emaDistancePct &&
    Math.abs(curr.maxDrawdown - prev.maxDrawdown) <= CACHE_THRESHOLD.maxDrawdownPct &&
    Math.abs(curr.maxGain30d - prev.maxGain30d) <= CACHE_THRESHOLD.maxGain30dPct &&
    Math.abs(curr.volumeRatio - prev.volumeRatio) <= CACHE_THRESHOLD.volumeRatio &&
    Math.abs(curr.change7d - prev.change7d) <= CACHE_THRESHOLD.change7dPct &&
    Math.abs(curr.change30d - prev.change30d) <= CACHE_THRESHOLD.change30dPct &&
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

function providerFailure(status, lang) {
  if (status === 401 || status === 403) {
    return {
      error: 'AI_PROVIDER_AUTH',
      insight: lang === 'en'
        ? 'AI credentials are invalid or unauthorized. Please check the provider key.'
        : 'AI 服务密钥无效或无权限，请检查 DeepSeek API 密钥。',
    };
  }

  if (status === 402) {
    return {
      error: 'AI_PROVIDER_QUOTA',
      insight: lang === 'en'
        ? 'AI provider balance or quota is insufficient. Please check the provider account.'
        : 'AI 服务当前余额或额度不足，请检查 DeepSeek 账户后重试。',
    };
  }

  if (status === 429) {
    return {
      error: 'AI_PROVIDER_RATE_LIMIT',
      insight: lang === 'en'
        ? 'AI provider rate limit reached. Please try again later.'
        : 'AI 服务触发频率限制，请稍后重试。',
    };
  }

  return {
    error: 'AI_PROVIDER_ERROR',
    insight: lang === 'en' ? 'AI service returned an error. Please try again.' : 'AI 服务返回错误，请稍后重试。',
  };
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
    const { analysis, stats, lang: requestedLang = 'zh' } = body || {};
    const lang = requestedLang === 'en' ? 'en' : 'zh';

    if (
      toFiniteNumber(stats?.currentPrice) <= 0 ||
      !VALID_STAGES.has(analysis?.stage)
    ) {
      return json({ error: 'INVALID_REQUEST', insight: lang === 'en' ? 'Invalid request data.' : '请求数据无效。' }, 400);
    }

    if (!env?.API_KEY) {
      return json({ error: 'AI_NOT_CONFIGURED', insight: lang === 'en' ? 'API key not configured.' : 'API密钥未配置，请检查环境变量。' }, 500);
    }

    const price = toFiniteNumber(stats.currentPrice);
    const change24h = toFiniteNumber(stats.change24hPercent);
    const emaDistance = toFiniteNumber(analysis.metrics?.emaDistance);
    const maxDrawdown = toFiniteNumber(analysis.metrics?.maxDrawdown);
    const maxGain30d = toFiniteNumber(analysis.metrics?.maxGain30d);
    const volumeRatio = toFiniteNumber(analysis.metrics?.volumeRatio, 1);
    const consecutiveDays = toFiniteNumber(analysis.criteria?.consecutiveDays);
    const change7d = toFiniteNumber(analysis.metrics?.change7d);
    const change30d = toFiniteNumber(analysis.metrics?.change30d);
    const evidenceScore = toFiniteNumber(analysis.probability);
    const daysInCycle = toFiniteNumber(analysis.daysInCycle);
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
   - Observation (0-30d): Price reclaims EMA15, volume gradually increases. The local evidence score is still weak. Key signal: 5+ consecutive days above EMA15 with rising volume.
   - Confirmation (30-70d): Sustained breakout, single-sided rise confirmed (max drawdown <15%), volume expansion >1.2x average. Confidence should rise only when multiple independent signals agree.
   - Warning (70-100d): Momentum divergence appears, volume may peak then decline, extreme greed sentiment. Cycle exhaustion risk rises; the score is not a probability of a future top.
   - Rest: Cycle completed or invalidated. Waiting for next setup.
3. Invalidation Criteria: Any drawdown >20% from local high, or EMA15 broken for 3+ consecutive days with volume, resets the cycle.
4. Evidence Approach: Don't count days mechanically. Weight evidence: EMA position, volume trend, drawdown depth, momentum indicators. Treat the supplied score as a heuristic ranking aid, not a calibrated probability or a prediction.

Your analysis style: institutional-grade, evidence-based, acknowledge uncertainty. Never give absolute predictions. Do not invent prices or indicators that are not in the snapshot; if evidence is insufficient, say WAIT.`
      : `你是一位资深比特币周期分析师，专精"百日冲顶理论"。

核心理论框架：
1. 历史规律：BTC从周期底部到局部顶部的单边上涨通常持续60-100天。此规律来源于多轮周期（2017、2019、2021、2024），抛物线式上涨呈现相似的时间结构。
2. 四阶段模型：
   - 观察期(0-30天)：价格收复EMA15，成交量逐步放大。此时证据分数仍偏弱。关键信号：连续5天以上站稳EMA15且量能递增。
   - 确认期(30-70天)：持续突破，单边上涨确认（最大回撤<15%），成交量放大至均值1.2倍以上。只有多类独立信号一致时，可信度才应上升。
   - 预警期(70-100天)：动量背离出现，成交量可能见顶后回落，市场极度贪婪。周期耗竭风险上升；证据分数不是未来见顶概率。
   - 休息期：周期完成或失效，等待下一次建仓机会。
3. 失效标准：任何一次从局部高点回撤>20%，或EMA15连续3天以上放量跌破，则重置周期计数。
4. 证据方法：不机械数日子，而是加权各类证据（EMA位置、量能趋势、回撤深度、动量指标），根据新数据判断是在确认还是反驳当前假设。把输入分数当作启发式排序辅助，不要当成校准概率或预测。

分析风格：机构级、基于证据、承认不确定性。绝不给出绝对预测。不要编造快照中没有的价格或指标；证据不足时明确说等待。`;

    const userPrompt = lang === 'en'
      ? `Current BTC market snapshot:
- Price: $${price.toLocaleString()} | 24h change: ${change24h.toFixed(2)}%
- Stage: ${stageName} | heuristic evidence score: ${evidenceScore}% | Cycle day: ${daysInCycle}
- EMA15: ${analysis.criteria?.emaBreakout ? 'Above' : 'Below'} (distance: ${emaDistance}%)
- Single-sided rise: ${analysis.criteria?.singleSidedRise ? 'Confirmed' : 'Not confirmed'} (max drawdown from high: ${maxDrawdown}%)
- Volume: ${analysis.criteria?.volumeExpansion ? 'Expanding' : 'Contracting/Flat'} (ratio vs 20d avg: ${volumeRatio}x)
- Consecutive days above EMA15: ${consecutiveDays}
- 7d close-to-close change: ${change7d}% | 30d close-to-close change: ${change30d}% | max low-to-high move in 30d: ${maxGain30d}%

Analyze this data through the 100-Day Theory lens:
1. Stage Assessment: Does the data support the current stage classification? What evidence confirms or contradicts it?
2. Evidence Reasoning: Does the ${evidenceScore}% heuristic score match the evidence? What factors would move confidence higher or lower?
3. Key Risk: What is the single biggest threat to this cycle continuing? At what price level does the thesis invalidate?
4. Actionable Insight: One specific, position-sizing-aware next step; WAIT is valid when evidence is insufficient.

Keep response to 4-5 sentences, dense with reasoning.`
      : `当前BTC市场快照：
- 价格: $${price.toLocaleString()} | 24h涨跌: ${change24h.toFixed(2)}%
- 阶段: ${stageName} | 启发式证据分数: ${evidenceScore}% | 周期第${daysInCycle}天
- EMA15: ${analysis.criteria?.emaBreakout ? '已突破' : '未突破'} (偏离度: ${emaDistance}%)
- 单边上涨: ${analysis.criteria?.singleSidedRise ? '已确认' : '未确认'} (距高点最大回撤: ${maxDrawdown}%)
- 成交量: ${analysis.criteria?.volumeExpansion ? '放量' : '缩量/持平'} (相对20日均量: ${volumeRatio}倍)
- 连续站上EMA15天数: ${consecutiveDays}
- 7日收盘到收盘变化: ${change7d}% | 30日收盘到收盘变化: ${change30d}% | 30日最大低点到高点涨幅: ${maxGain30d}%

请从百日冲顶理论视角分析：
1. 阶段判断：当前数据是否支持所处阶段的分类？哪些证据在确认、哪些在反驳？
2. 证据推理：${evidenceScore}%的启发式证据分数是否匹配当前证据？什么因素会让可信度上升或下降？
3. 核心风险：当前周期延续的最大威胁是什么？价格跌破什么位置会使理论失效？
4. 操作建议：一条具体的、考虑仓位管理的下一步；证据不足时可以明确等待。

控制在4-5句话，每句都有推理依据。`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);

    let resp;
    try {
      resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          thinking: { type: 'disabled' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 800,
          temperature: 0.2,
        }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const providerErrorType = data?.error?.type || data?.error?.code || 'unknown';
      console.error(JSON.stringify({ event: 'deepseek_api_error', status: resp.status, type: providerErrorType }));
      return json(providerFailure(resp.status, lang), 502);
    }

    const insight = data?.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return json({ error: 'AI_EMPTY_RESPONSE', insight: lang === 'en' ? 'AI returned an empty response.' : 'AI 返回了空内容，请重试。' }, 502);
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
      error: isAbort ? 'AI_TIMEOUT' : 'AI_REQUEST_FAILED',
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
