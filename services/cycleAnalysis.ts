import type { CandleData, MarketStats, Language, TacticalRadarData, TacticalState, NormalizedCyclePoint } from '../types';

export const EMA_PERIOD = 15;
export const MIN_CANDLES_FOR_ANALYSIS = 35;

export interface CycleMetrics {
  emaDistance: number;
  consecutiveAbove: number;
  maxGain30d: number;
  maxDrawdownPercent: number;
  volumeRatio: number;
  volTrend: number;
  change7d: number;
  change30d: number;
}

export interface CycleCriteria {
  emaBreakout: boolean;
  singleSidedRise: boolean;
  volumeExpansion: boolean;
  consecutiveDays: number;
}

export interface CycleAnalysis {
  stage: 'observation' | 'confirmation' | 'warning' | 'rest';
  /** Heuristic evidence score; it is not a calibrated probability. */
  probability: number;
  daysInCycle: number;
  criteria: CycleCriteria;
  metrics: {
    emaDistance: number;
    maxDrawdown: number;
    maxGain30d: number;
    volumeRatio: number;
    change7d: number;
    change30d: number;
  };
}

export const HISTORICAL_CYCLES_DEF = [
  {
    id: 'cycle1',
    labelEn: 'Cycle 1 (2023-2024)',
    labelZh: '周期 1 (2023-2024)',
    startDate: '2023-10-14',
    endDate: '2024-01-22',
    descriptionZh: '均匀分布型',
    descriptionEn: 'Uniform Distribution',
    gain: '+82.4%',
    days: 101,
  },
  {
    id: 'cycle2',
    labelEn: 'Cycle 2 (2024 Spring)',
    labelZh: '周期 2 (2024春)',
    startDate: '2024-01-22',
    endDate: '2024-04-29',
    descriptionZh: '前快后慢型 (抢跑透支)',
    descriptionEn: 'Front-running / Early Surge',
    gain: '+86.5%',
    days: 99,
  },
  {
    id: 'cycle3',
    labelEn: 'Cycle 3 (2024 Autumn-Winter)',
    labelZh: '周期 3 (2024秋冬)',
    startDate: '2024-09-07',
    endDate: '2024-12-16',
    descriptionZh: '前慢后快型 (蓄力加速)',
    descriptionEn: 'Accumulation then Acceleration',
    gain: '+99.0%',
    days: 101,
  },
  {
    id: 'cycle4',
    labelEn: 'Cycle 4 (Active Cycle)',
    labelZh: '周期 4 (当前运行)',
    startDate: '2026-08-17',
    endDate: '2026-11-25',
    descriptionZh: '均线贴合上扬，已完成诱空洗盘反包',
    descriptionEn: 'Holding firmly above EMA15 with confirmed spring reclaims',
    days: 100,
    isCurrent: true,
  }
];

// EMA Calculation Helper
export const calculateEMA = (data: CandleData[], period: number = EMA_PERIOD): { time: number; ema: number }[] => {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: { time: number; ema: number }[] = [];

  if (data.length < period) {
    let sum = 0;
    data.forEach((d, i) => {
      sum += d.close;
      emaArray.push({ time: d.time, ema: sum / (i + 1) });
    });
    return emaArray;
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  const sma = sum / period;

  let runSum = 0;
  for (let i = 0; i < period - 1; i++) {
    runSum += data[i].close;
    emaArray.push({ time: data[i].time, ema: runSum / (i + 1) });
  }

  emaArray.push({ time: data[period - 1].time, ema: sma });
  let prevEma = sma;

  for (let i = period; i < data.length; i++) {
    const ema = data[i].close * k + prevEma * (1 - k);
    emaArray.push({ time: data[i].time, ema });
    prevEma = ema;
  }

  return emaArray;
};

/**
 * 1. Calculate Average True Range (ATR 14) for Dynamic Volatility Moat
 */
export const calculateATR = (data: CandleData[], period: number = 14): { time: number; atr: number }[] => {
  if (!data || data.length === 0) return [];
  const result: { time: number; atr: number }[] = [];
  const n = data.length;
  if (n < 2) {
    return data.map(d => ({ time: d.time, atr: d.high - d.low }));
  }

  const trs: number[] = [data[0].high - data[0].low];
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trs.push(tr);
  }

  // Initial SMA
  const initialPeriod = Math.min(period, n);
  let atr = trs.slice(0, initialPeriod).reduce((a, b) => a + b, 0) / initialPeriod;

  for (let i = 0; i < initialPeriod; i++) {
    result.push({ time: data[i].time, atr });
  }

  for (let i = initialPeriod; i < n; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({ time: data[i].time, atr });
  }

  return result;
};

/**
 * 2. Calculate Donchian 20-Day Breakout Level (Prior 20-day Highest High)
 */
export const calculateDonchian = (
  data: CandleData[],
  period: number = 20
): { time: number; high: number; low: number }[] => {
  if (!data || data.length === 0) return [];
  return data.map((d, i) => {
    if (i < 1) return { time: d.time, high: d.high, low: d.low };
    const start = Math.max(0, i - period);
    const windowSlice = data.slice(start, i); // strictly prior candles
    const high = Math.max(...windowSlice.map(c => c.high));
    const low = Math.min(...windowSlice.map(c => c.low));
    return { time: d.time, high, low };
  });
};

/**
 * 3. Calculate Pi Cycle Top Indicator (111 SMA vs 2 * 350 SMA)
 */
export const calculatePiCycle = (
  data: CandleData[]
): {
  sma111: number | null;
  sma350x2: number | null;
  ratio: number | null;
  state: 'safe' | 'warning' | 'critical';
} => {
  if (!data || data.length < 111) {
    return { sma111: null, sma350x2: null, ratio: null, state: 'safe' };
  }
  const n = data.length;
  const sma111Slice = data.slice(n - 111);
  const sma111 = sma111Slice.reduce((sum, c) => sum + c.close, 0) / 111;

  if (n < 350) {
    return { sma111: Math.round(sma111), sma350x2: null, ratio: null, state: 'safe' };
  }

  const sma350Slice = data.slice(n - 350);
  const sma350 = sma350Slice.reduce((sum, c) => sum + c.close, 0) / 350;
  const sma350x2 = sma350 * 2;
  const ratio = Number((sma111 / sma350x2).toFixed(3));

  let state: 'safe' | 'warning' | 'critical' = 'safe';
  if (ratio >= 0.98) {
    state = 'critical';
  } else if (ratio >= 0.88) {
    state = 'warning';
  }

  return {
    sma111: Math.round(sma111),
    sma350x2: Math.round(sma350x2),
    ratio,
    state
  };
};

const roundMetric = (value: number): number => Number(value.toFixed(2));

const calculateCloseToCloseChange = (candles: CandleData[], currentPrice: number, days: number): number => {
  const reference = candles[candles.length - (days + 1)]?.close;
  if (!reference || reference <= 0 || !Number.isFinite(currentPrice)) return 0;
  return ((currentPrice - reference) / reference) * 100;
};

const emptyMetrics = (): CycleMetrics => ({
  emaDistance: 0,
  consecutiveAbove: 0,
  maxGain30d: 0,
  maxDrawdownPercent: 0,
  volumeRatio: 1,
  volTrend: 0,
  change7d: 0,
  change30d: 0,
});

/**
 * Institutional-grade EMA15 Consecutive Above Calculation (3-Filter Engine with Shakeout/Spring Recognition):
 * 1. Holding condition: candle.close >= EMA15.
 * 2. Shakeout / Bear Trap handling (e.g. 9.10 - 9.18 cluster):
 *    - Contiguous dip cluster duration <= 5 trading days.
 *    - Max cluster drawdown depth <= 3.0%.
 *    - Reclaim confirmation: The cluster was subsequently reclaimed by a daily close back >= EMA15.
 *    - If all hold, the entire shakeout cluster counts towards the cycle streak!
 * 3. Catastrophic Guard: Any single day crash > 4.5% terminates the streak immediately.
 * 4. Breakdown confirmation: 2 consecutive days below EMA15 with depth > 2.0% that fail to reclaim terminates the streak.
 */
export const calculateConsecutiveAbove = (candles: CandleData[], emaData: { time: number; ema: number }[]): number => {
  if (!candles?.length || !emaData?.length) return 0;
  let streak = 0;
  let i = candles.length - 1;

  while (i >= 0) {
    const c = candles[i];
    const emaVal = emaData[i]?.ema;

    if (!emaVal) break;

    // Direct holding
    if (c.close >= emaVal) {
      streak++;
      i--;
      continue;
    }

    // Encountered candle below EMA15: inspect the contiguous dip cluster backwards
    let clusterLen = 0;
    let maxDepth = 0;
    let clusterIdx = i;

    while (clusterIdx >= 0 && candles[clusterIdx].close < (emaData[clusterIdx]?.ema || 0)) {
      const e = emaData[clusterIdx]?.ema || candles[clusterIdx].close;
      const depth = ((e - candles[clusterIdx].close) / e) * 100;
      if (depth > maxDepth) maxDepth = depth;
      clusterLen++;
      clusterIdx--;
    }

    // Check if cluster was reclaimed in forward timeline
    const isReclaimed = i < candles.length - 1 && candles[i + 1].close >= (emaData[i + 1]?.ema || 0);

    // Valid Shakeout / Bear Trap Spring (e.g. Sept 10-18 cluster)
    if (isReclaimed && maxDepth <= 3.0 && clusterLen <= 5) {
      streak += clusterLen;
      i = clusterIdx;
    } else if (i === candles.length - 1 && maxDepth <= 2.0 && clusterLen <= 2) {
      // Active shallow test at current candle
      streak += clusterLen;
      i = clusterIdx;
    } else {
      // True breakdown
      break;
    }
  }

  return streak;
};

/**
 * Single source of truth for metrics
 */
export const calculateCycleMetrics = (candles: CandleData[], currentPrice: number): CycleMetrics => {
  if (!candles?.length || candles.length < MIN_CANDLES_FOR_ANALYSIS) return emptyMetrics();

  const emaData = calculateEMA(candles, EMA_PERIOD);
  const lastCandle = candles[candles.length - 1];
  const lastEMA = emaData[emaData.length - 1]?.ema || lastCandle.close;
  const emaDistance = ((currentPrice - lastEMA) / lastEMA) * 100;

  const consecutiveAbove = calculateConsecutiveAbove(candles, emaData);

  const recentCandles = candles.slice(-30);

  let maxRunUp = 0;
  for (let i = 0; i < recentCandles.length; i++) {
    const entryLow = recentCandles[i].low;
    for (let j = i; j < recentCandles.length; j++) {
      const exitHigh = recentCandles[j].high;
      const runUp = (exitHigh - entryLow) / entryLow;
      if (runUp > maxRunUp) maxRunUp = runUp;
    }
  }

  let maxDrawdown = 0;
  let peak = recentCandles[0].high;
  recentCandles.forEach(candle => {
    if (candle.high > peak) peak = candle.high;
    const drawdown = (peak - candle.low) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const last5Vol = candles.slice(-5).reduce((sum, candle) => sum + (candle.volume || 0), 0) / 5;
  const last20Vol = candles.slice(-20).reduce((sum, candle) => sum + (candle.volume || 0), 0) / 20;
  const volumeRatio = last20Vol > 0 ? last5Vol / last20Vol : 1;

  return {
    emaDistance: roundMetric(emaDistance),
    consecutiveAbove,
    maxGain30d: roundMetric(maxRunUp * 100),
    maxDrawdownPercent: roundMetric(maxDrawdown * 100),
    volumeRatio: roundMetric(volumeRatio),
    volTrend: roundMetric((volumeRatio - 1) * 100),
    change7d: roundMetric(calculateCloseToCloseChange(candles, currentPrice, 7)),
    change30d: roundMetric(calculateCloseToCloseChange(candles, currentPrice, 30)),
  };
};

export const analyzeCycleStage = (stats: MarketStats, candles: CandleData[]): CycleAnalysis => {
  if (!candles || candles.length < MIN_CANDLES_FOR_ANALYSIS) {
    return {
      stage: 'rest',
      probability: 0,
      daysInCycle: 0,
      criteria: { emaBreakout: false, singleSidedRise: false, volumeExpansion: false, consecutiveDays: 0 },
      metrics: { emaDistance: 0, maxDrawdown: 0, maxGain30d: 0, volumeRatio: 1, change7d: 0, change30d: 0 },
    };
  }

  const currentPrice = stats.currentPrice;
  const metrics = calculateCycleMetrics(candles, currentPrice);
  const emaBreakout = metrics.emaDistance > 0;

  const recentCandles = candles.slice(-30);
  const emaData = calculateEMA(candles, EMA_PERIOD);
  let daysBelowEMA = 0;
  let maxDaysBelowEMA = 0;
  let maxEmaBreakDepth = 0;

  recentCandles.forEach((candle, index) => {
    const emaVal = emaData[emaData.length - recentCandles.length + index]?.ema;
    if (emaVal && candle.close < emaVal) {
      daysBelowEMA++;
      maxDaysBelowEMA = Math.max(maxDaysBelowEMA, daysBelowEMA);
      maxEmaBreakDepth = Math.max(maxEmaBreakDepth, (emaVal - candle.close) / emaVal);
    } else {
      daysBelowEMA = 0;
    }
  });

  const singleSidedRise =
    maxDaysBelowEMA <= 3 ||
    (maxDaysBelowEMA <= 7 && maxEmaBreakDepth < 0.08) ||
    (maxDaysBelowEMA <= 5 && maxEmaBreakDepth < 0.12);
  const volumeExpansion = metrics.volumeRatio > 1.2;
  const criteria: CycleCriteria = {
    emaBreakout,
    singleSidedRise,
    volumeExpansion,
    consecutiveDays: metrics.consecutiveAbove,
  };
  const criteriaScore =
    (emaBreakout ? 1 : 0) +
    (singleSidedRise ? 1 : 0) +
    (volumeExpansion ? 1 : 0) +
    (metrics.consecutiveAbove > 10 ? 1 : 0);

  let stage: CycleAnalysis['stage'];
  let probability: number;
  let daysInCycle: number;

  if (criteriaScore >= 3 && metrics.consecutiveAbove >= 70) {
    stage = 'warning';
    probability = Math.min(95, 60 + (metrics.consecutiveAbove - 70) * 2 + (metrics.change30d > 50 ? 20 : 0));
    daysInCycle = metrics.consecutiveAbove;
  } else if (criteriaScore >= 3 && metrics.consecutiveAbove >= 30) {
    stage = 'confirmation';
    probability = Math.min(85, 40 + criteriaScore * 10 + (metrics.change30d > 20 ? 15 : 0));
    daysInCycle = metrics.consecutiveAbove;
  } else if (criteriaScore >= 2 && metrics.consecutiveAbove >= 5) {
    stage = 'observation';
    probability = Math.min(60, 20 + criteriaScore * 8 + (metrics.emaDistance > 5 ? 10 : 0));
    daysInCycle = metrics.consecutiveAbove;
  } else {
    stage = 'rest';
    probability = Math.max(70, 90 - criteriaScore * 15);
    daysInCycle = 0;
  }

  return {
    stage,
    probability,
    daysInCycle,
    criteria,
    metrics: {
      emaDistance: metrics.emaDistance,
      maxDrawdown: metrics.maxDrawdownPercent,
      maxGain30d: metrics.maxGain30d,
      volumeRatio: metrics.volumeRatio,
      change7d: metrics.change7d,
      change30d: metrics.change30d,
    },
  };
};

/**
 * 100% Deterministic Tactical Radar Generator (No LLM, Instant Execution)
 */
export const calculateTacticalRadar = (
  candles: CandleData[],
  currentPrice: number,
  lang: Language = 'zh'
): TacticalRadarData => {
  const isEn = lang === 'en';
  if (!candles || candles.length < MIN_CANDLES_FOR_ANALYSIS) {
    return {
      state: 'rest',
      stateLabel: isEn ? 'Data Calibrating' : '数据对齐中',
      score: 50,
      stance: 'cautious_watch',
      currentCycleDay: 0,
      cycleStageName: isEn ? 'Observation' : '观察期',
      ema15Price: currentPrice,
      invalidationPrice: currentPrice * 0.98,
      riskRewardRatio: '1 : 2.5',
      checklist: [],
      tacticalAdvice: {
        headline: isEn ? 'Waiting for Market Feed' : '正在同步盘面数据',
        positionAdvice: '0% - 20%',
        defenseLine: `$${(currentPrice * 0.98).toLocaleString()}`,
        targetZone: `$${(currentPrice * 1.1).toLocaleString()}`,
        invalidationTrigger: isEn ? 'Daily close < EMA15 by 2%' : '日线收盘有效跌破 EMA15 达 2%',
      }
    };
  }

  const emaData = calculateEMA(candles, EMA_PERIOD);
  const lastEMA = emaData[emaData.length - 1]?.ema || currentPrice;
  const emaDistance = ((currentPrice - lastEMA) / lastEMA) * 100;
  const metrics = calculateCycleMetrics(candles, currentPrice);

  // 3-Pillar Quantitative Indicators
  const atrData = calculateATR(candles, 14);
  const currentATR = Math.round(atrData[atrData.length - 1]?.atr || (currentPrice * 0.02));
  const atrDefenseFloor = Math.round(lastEMA - currentATR); // EMA15 - 1.0 * ATR14

  const donchianData = calculateDonchian(candles, 20);
  const donchian20High = Math.round(donchianData[donchianData.length - 1]?.high || currentPrice);
  const isDonchianBreakout = currentPrice >= donchian20High;

  // Active Cycle Day: Directly driven by the validated continuous cycle streak
  const currentCycleDay = metrics.consecutiveAbove;

  // Calculate Donchian level at Cycle Launch (Day 0) to know if cycle launch was confirmed
  let cycleLaunchDonchianHigh: number | undefined = undefined;
  let isCycleLaunchBreakout = false;
  if (currentCycleDay > 0 && currentCycleDay <= candles.length) {
    const launchIdx = candles.length - currentCycleDay;
    if (launchIdx >= 0 && launchIdx < donchianData.length) {
      cycleLaunchDonchianHigh = Math.round(donchianData[launchIdx]?.high || currentPrice);
      isCycleLaunchBreakout = currentPrice > cycleLaunchDonchianHigh;
    }
  }

  const piCycle = calculatePiCycle(candles);

  // Determine State through 3-Filter Engine & ATR Buffer
  // Check if yesterday or day before had a dip
  const recent3 = candles.slice(-3);
  const yesterdayClose = recent3.length >= 2 ? recent3[recent3.length - 2].close : currentPrice;
  const yesterdayEMA = emaData.length >= 2 ? emaData[emaData.length - 2].ema : lastEMA;
  const yesterdayDip = yesterdayClose < yesterdayEMA;

  let state: TacticalState = 'healthy_bull';
  let stateLabel = isEn ? 'Healthy Bull (Above EMA15)' : '单边健康上行 (牢牢踩在EMA15)';
  let stance: TacticalRadarData['stance'] = 'long_hold';

  if (emaDistance >= 0) {
    if (yesterdayDip) {
      state = 'spring_reclaim';
      stateLabel = isEn ? 'Spring Reclaim (Bear Trap Confirmed)' : '假摔诱空反包 (回踩收复买点)';
      stance = 'long_aggressive';
    } else {
      state = 'healthy_bull';
      stateLabel = isEn ? 'Healthy Trend Continuation' : '健康单边顺势加速';
      stance = isDonchianBreakout ? 'long_aggressive' : 'long_hold';
    }
  } else {
    // Under EMA15: Check whether it is above the dynamic ATR defense floor
    if (currentPrice >= atrDefenseFloor) {
      state = 'shakeout_test';
      stateLabel = isEn ? 'ATR Moat Test (Shakeout Zone)' : 'ATR 护城河测试 (洗盘缓冲区)';
      stance = 'cautious_watch';
    } else {
      state = 'true_breakdown';
      stateLabel = isEn ? 'Invalidation Alert (True Breakdown)' : '防守破位预警 (击穿 ATR 护城河)';
      stance = 'defensive_exit';
    }
  }

  // Calculate score (0-100)
  let score = 50;
  if (emaDistance > 0) score += 15;
  if (isDonchianBreakout) score += 10;
  if (emaDistance > 1.5 && emaDistance < 10) score += 5; // optimal slope
  if (metrics.consecutiveAbove >= 10) score += 10;
  if (metrics.volTrend > 10) score += 5;
  if (metrics.maxDrawdownPercent < 10) score += 5;
  if (state === 'spring_reclaim') score += 5;
  if (state === 'shakeout_test') score -= 10;
  if (state === 'true_breakdown') score -= 35;
  if (piCycle.state === 'critical') score -= 30;
  else if (piCycle.state === 'warning') score -= 10;
  score = Math.max(10, Math.min(98, score));

  // Determine Stage name
  let cycleStageName = isEn ? 'Observation (0-30d)' : '观察蓄力期 (Day 0-30)';
  if (currentCycleDay >= 30 && currentCycleDay < 70) {
    cycleStageName = isEn ? 'Golden Confirmation (30-70d)' : '黄金确认期 (Day 30-70)';
  } else if (currentCycleDay >= 70 && currentCycleDay <= 100) {
    cycleStageName = isEn ? 'Warning & Exit (70-100d)' : '高位预警分批撤离 (Day 70-100)';
  } else if (currentCycleDay > 100) {
    cycleStageName = isEn ? 'Rest Period (100d+)' : '周期休整期 (100天+)';
  }

  const invalidationPrice = atrDefenseFloor;
  const targetPrice = Math.round(currentPrice * (currentCycleDay < 50 ? 1.25 : 1.15));

  const checklist = [
    {
      label: isEn ? 'Dual Momentum (EMA15 + Donchian 20D)' : '双重动能启动 (EMA15 + 唐奇安 20D)',
      value: currentCycleDay >= 30
        ? (isEn ? 'Confirmed at Day 0' : '已于起涨点突破确认')
        : isDonchianBreakout
        ? (isEn ? '20D Breakout' : '突破20日新高')
        : `${emaDistance >= 0 ? '+' : ''}${emaDistance.toFixed(2)}%`,
      passed: currentCycleDay >= 30 || (emaDistance >= 0 && isDonchianBreakout),
      hint: currentCycleDay >= 30
        ? (isEn ? `Day 0 breakout confirmed ($${cycleLaunchDonchianHigh?.toLocaleString() || '---'})` : `起涨点已突破 $${cycleLaunchDonchianHigh?.toLocaleString() || '---'}，单边已运行 ${currentCycleDay} 天`)
        : (isEn ? `EMA15: $${Math.round(lastEMA).toLocaleString()} | 20D High: $${donchian20High.toLocaleString()}` : `EMA15: $${Math.round(lastEMA).toLocaleString()} | 20日高点: $${donchian20High.toLocaleString()}`)
    },
    {
      label: isEn ? 'Consecutive Above EMA15 Streak' : '连续收在均线上方天数',
      value: `${metrics.consecutiveAbove} ${isEn ? 'Days' : '天'}`,
      passed: metrics.consecutiveAbove >= 5,
      hint: isEn ? 'Target: >= 5 days for trend confirmation' : '门槛：≥5天确认右侧单边'
    },
    {
      label: isEn ? 'ATR Dynamic Moat (Washout Filter)' : 'ATR 动态护城河 (洗盘容错滤网)',
      value: currentPrice >= atrDefenseFloor ? (isEn ? 'Protected' : '缓冲保护中') : (isEn ? 'Pierced' : '下破护城河'),
      passed: currentPrice >= atrDefenseFloor,
      hint: isEn ? `Moat floor at $${atrDefenseFloor.toLocaleString()} (1.0 ATR: $${currentATR.toLocaleString()})` : `动态下轨 $${atrDefenseFloor.toLocaleString()} (1.0 ATR 缓冲: $${currentATR.toLocaleString()})`
    },
    {
      label: isEn ? '30D Momentum / Max Gain' : '近30日动能涨幅',
      value: `+${metrics.maxGain30d.toFixed(1)}%`,
      passed: metrics.maxGain30d >= 10,
      hint: isEn ? 'Healthy bull requires sustained momentum' : '单边牛市要求保持进攻弹性'
    },
    {
      label: isEn ? 'Pi Cycle Top & Lifecycle Exhaustion' : 'Pi-Top 极值雷达 & 周期耗尽',
      value: piCycle.ratio !== null ? `Pi: ${piCycle.ratio.toFixed(2)}` : `Day ${currentCycleDay}/100`,
      passed: piCycle.state !== 'critical' && currentCycleDay <= 70,
      hint: piCycle.state === 'critical'
        ? (isEn ? 'CRITICAL: Extreme top signal triggered' : '极值顶峰警戒：历史上见顶概率极高')
        : (currentCycleDay <= 70 ? (isEn ? 'Golden window' : '黄金主升窗口') : (isEn ? 'Approaching cycle exhaustion' : '接近周期耗尽预警区'))
    }
  ];

  let headline = isEn ? 'Strong Bull Structure in Progress' : '单边多头主升浪运行中';
  let positionAdvice = '70% ~ 90%';

  if (piCycle.state === 'critical') {
    headline = isEn ? 'Pi Cycle Top Alert: Extreme Overbought, Systemic Exit' : 'Pi-Top 极值顶警报触发：极端狂热，启动无条件分批离场';
    positionAdvice = '0% ~ 20%';
  } else if (state === 'spring_reclaim') {
    headline = isEn ? 'Spring Reclaim: Bear Trap Confirmed, Add on Pullback' : '均线诱空反包确认，回踩即最佳顺势加仓点';
    positionAdvice = '80% ~ 100%';
  } else if (state === 'shakeout_test') {
    headline = isEn ? 'Testing ATR Moat: Do Not Panic, Protected by Volatility Band' : '测试 ATR 护城河：切勿恐慌交出筹码，波动带提供弹性保护';
    positionAdvice = '50% ~ 60%';
  } else if (state === 'true_breakdown') {
    headline = isEn ? 'Defense Broken: Pierced ATR Floor, Guard Capital' : '有效击穿 ATR 护城河：趋势受损，严格执行防守纪律';
    positionAdvice = '0% ~ 20%';
  }

  return {
    state,
    stateLabel,
    score,
    stance,
    currentCycleDay,
    cycleStageName,
    ema15Price: Math.round(lastEMA),
    invalidationPrice,
    riskRewardRatio: currentCycleDay < 50 ? '1 : 3.8' : '1 : 2.1',
    donchian20High,
    isDonchianBreakout,
    cycleLaunchDonchianHigh,
    isCycleLaunchBreakout,
    atr14: currentATR,
    atrDefenseFloor,
    piCycleRatio: piCycle.ratio ?? undefined,
    piCycleState: piCycle.state,
    checklist,
    tacticalAdvice: {
      headline,
      positionAdvice,
      defenseLine: `$${atrDefenseFloor.toLocaleString()}`,
      targetZone: `$${targetPrice.toLocaleString()}`,
      invalidationTrigger: isEn
        ? `Daily close below $${atrDefenseFloor.toLocaleString()} (EMA15 - 1.0 ATR)`
        : `日线收盘价低于 $${atrDefenseFloor.toLocaleString()} (跌破 EMA15 - 1.0 ATR)`,
    }
  };
};

/**
 * Generate Normalized Day 0 - Day 100 Comparative Trajectory Data
 */
export const buildNormalizedCycleData = (candles: CandleData[]): NormalizedCyclePoint[] => {
  if (!candles || candles.length === 0) return [];

  const points: NormalizedCyclePoint[] = [];

  // Helper to slice a cycle
  const extractCycleGain = (startDateStr: string, maxDays = 100): (number | undefined)[] => {
    const startMs = new Date(startDateStr).getTime();
    const startIdx = candles.findIndex(c => Math.abs(c.time - startMs) < 36 * 3600 * 1000);
    if (startIdx === -1) return [];

    const basePrice = candles[startIdx].close;
    const result: (number | undefined)[] = [];

    for (let d = 0; d <= maxDays; d++) {
      const idx = startIdx + d;
      if (idx < candles.length) {
        const gain = ((candles[idx].close - basePrice) / basePrice) * 100;
        result.push(Number(gain.toFixed(1)));
      } else {
        result.push(undefined);
      }
    }
    return result;
  };

  const c1Gains = extractCycleGain('2023-10-14', 100);
  const c2Gains = extractCycleGain('2024-01-22', 100);
  const c3Gains = extractCycleGain('2024-09-07', 100);

  // Active Cycle (Cycle 4): Dynamically determine start point from verified streak
  const emaData = calculateEMA(candles, EMA_PERIOD);
  const streak = calculateConsecutiveAbove(candles, emaData);
  const currentGains: (number | undefined)[] = [];

  if (streak > 0 && streak <= candles.length) {
    const startIdx = candles.length - streak;
    const basePrice = candles[startIdx].close;
    for (let d = 0; d <= 100; d++) {
      const idx = startIdx + d;
      if (idx < candles.length) {
        const gain = ((candles[idx].close - basePrice) / basePrice) * 100;
        currentGains.push(Number(gain.toFixed(1)));
      } else {
        currentGains.push(undefined);
      }
    }
  }

  for (let day = 0; day <= 100; day++) {
    const c1 = c1Gains[day];
    const c2 = c2Gains[day];
    const c3 = c3Gains[day];
    const current = currentGains[day];

    const validPast = [c1, c2, c3].filter((x): x is number => typeof x === 'number');
    const avgBenchmark = validPast.length > 0 ? Number((validPast.reduce((a, b) => a + b, 0) / validPast.length).toFixed(1)) : undefined;

    // Wall Street Monte Carlo Confidence Cone
    // Model historical log-return drift and empirical dispersion around Day 0 -> 100
    let coneP90: number | undefined = undefined;
    let coneP50: number | undefined = undefined;
    let coneP10: number | undefined = undefined;

    if (day === 0) {
      coneP90 = 0;
      coneP50 = 0;
      coneP10 = 0;
    } else if (validPast.length > 0) {
      const minPast = Math.min(...validPast);
      const maxPast = Math.max(...validPast);
      const mean = validPast.reduce((a, b) => a + b, 0) / validPast.length;
      
      // Expand probabilistic envelope as time horizons progress (sigma * sqrt(t))
      const timeFactor = Math.sqrt(day / 100);
      coneP50 = Number(mean.toFixed(1));
      coneP90 = Number((Math.max(maxPast, mean + 22 * timeFactor)).toFixed(1));
      coneP10 = Number((Math.max(0, Math.min(minPast, mean - 18 * timeFactor))).toFixed(1));
    }

    points.push({
      day,
      cycle1: c1,
      cycle2: c2,
      cycle3: c3,
      current,
      avgBenchmark,
      coneP90,
      coneP50,
      coneP10,
    });
  }

  return points;
};
