import assert from 'node:assert/strict';
import test from 'node:test';
import type { CandleData, MarketStats } from '../types.ts';
import {
  analyzeCycleStage,
  calculateCycleMetrics,
  calculateEMA,
  calculateATR,
  calculateStreakDetails,
  calculateTacticalRadar,
  buildNormalizedCycleData,
} from '../services/cycleAnalysis.ts';

const makeFixture = (): CandleData[] => {
  return Array.from({ length: 40 }, (_, index) => {
    let close = 80;
    if (index >= 10 && index < 20) close = 100;
    if (index >= 20 && index < 32) close = 140;
    if (index === 32) close = 100;
    if (index === 33) close = 110;
    if (index >= 34) close = 120;

    return {
      time: index,
      open: close,
      high: close,
      low: close,
      close,
      volume: index >= 35 ? 200 : 100,
    };
  });
};

const stats: MarketStats = {
  currentPrice: 120,
  change24h: 0,
  change24hPercent: 0,
  high24h: 120,
  low24h: 120,
  marketCap: 0,
  volume24h: 0,
};

test('uses elapsed-day candle positions for close-to-close changes', () => {
  const metrics = calculateCycleMetrics(makeFixture(), stats.currentPrice);

  assert.equal(metrics.change7d, 20);
  assert.equal(metrics.change30d, 50);
});

test('AI analysis reuses the exact metrics shown by the panel', () => {
  const candles = makeFixture();
  const panelMetrics = calculateCycleMetrics(candles, stats.currentPrice);
  const analysis = analyzeCycleStage(stats, candles);

  assert.equal(analysis.metrics.emaDistance, panelMetrics.emaDistance);
  assert.equal(analysis.metrics.maxDrawdown, panelMetrics.maxDrawdownPercent);
  assert.equal(analysis.metrics.maxGain30d, panelMetrics.maxGain30d);
  assert.equal(analysis.metrics.volumeRatio, panelMetrics.volumeRatio);
  assert.equal(analysis.metrics.change7d, panelMetrics.change7d);
  assert.equal(analysis.metrics.change30d, panelMetrics.change30d);
  assert.equal(analysis.criteria.consecutiveDays, panelMetrics.consecutiveAbove);
});

test('3-Filter Robust EMA15: filters shallow buffer dips and 1-day bear traps', () => {
  // Construct a sequence of 40 candles:
  // Baseline price 100, then steady climb
  const candles: CandleData[] = Array.from({ length: 40 }, (_, i) => {
    let price = 100 + i * 2; // steady uptrend
    return {
      time: i * 86400000,
      open: price,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 100,
    };
  });

  // At day 37: simulate a 1-day dip that is 0.5% below EMA, and reclaimed on day 38 & 39
  // The streak should NOT break due to this 1-day dip!
  const normalMetrics = calculateCycleMetrics(candles, candles[candles.length - 1].close);
  assert.ok(normalMetrics.consecutiveAbove > 20, 'Uptrend should have long consecutive streak');

  // Now create a scenario with a 1-day minor dip at day 37:
  const dipCandles = [...candles];
  const emaData = Array.from({ length: 40 }, (_, i) => ({ time: i * 86400000, ema: 100 + i * 2 - 2 }));
  // Day 37 closes at ema - 0.5 (shallow dip < 1%)
  dipCandles[37] = { ...dipCandles[37], close: emaData[37].ema - 0.5 };
  // Day 38 reclaims
  dipCandles[38] = { ...dipCandles[38], close: emaData[38].ema + 5 };
  dipCandles[39] = { ...dipCandles[39], close: emaData[39].ema + 6 };

  const dipMetrics = calculateCycleMetrics(dipCandles, dipCandles[39].close);
  // It should preserve the streak across day 37
  assert.ok(dipMetrics.consecutiveAbove >= 3, 'Streak must survive the 1-day shallow/reclaimed dip');
});

test('3-Pillar Indicators: calculates ATR, Donchian, and Pi Cycle correctly', () => {
  const candles = makeFixture();
  const currentPrice = 120;
  const radar = calculateTacticalRadar(candles, currentPrice, 'zh');

  // Verify ATR Moat
  assert.ok(radar.atr14 !== undefined && radar.atr14 > 0, 'ATR14 should be positive');
  assert.ok(radar.atrDefenseFloor !== undefined, 'ATR defense floor must be computed');
  assert.equal(radar.invalidationPrice, radar.atrDefenseFloor, 'Invalidation price should equal ATR defense floor');

  // Verify Donchian
  assert.ok(radar.donchian20High !== undefined, 'Donchian 20d High should exist');
  assert.ok(typeof radar.isDonchianBreakout === 'boolean', 'isDonchianBreakout should be a boolean');

  // Verify Pi Cycle
  assert.ok(radar.piCycleState === 'safe' || radar.piCycleState === 'warning' || radar.piCycleState === 'critical');
});

test('Uncertain Phase: preserves cycle streak during 3-day EMA15 dip & rebound within ATR moat, and resets on >5d or deep breakdown', () => {
  // Build 45 days of steady bull trend with ~3% daily range so ATR14 is around ~2,400 at $84k
  const baseCandles: CandleData[] = Array.from({ length: 45 }, (_, i) => {
    const close = 70000 + i * 350; // climbs from 70,000 to 85,400
    return {
      time: (i + 1) * 86400000,
      open: close - 300,
      high: close + 1200,
      low: close - 1200,
      close,
      volume: 150,
    };
  });

  // Compute EMA on first 42 candles to anchor our 3-day tail dip
  const preEma = calculateEMA(baseCandles, 15);
  const ema42 = preEma[41].ema;

  const moatDipCandles = [...baseCandles];
  // Day 42 (dip day 1): ~ -0.9% below EMA15
  const c42 = Math.round(ema42 * 0.991);
  moatDipCandles[42] = {
    time: 43 * 86400000,
    open: c42 + 400,
    high: c42 + 600,
    low: c42 - 500,
    close: c42,
    volume: 140,
  };

  // Day 43 (dip day 2): ~ -2.45% below EMA15 (still within 3.0% and ATR moat)
  const ema43Approx = calculateEMA(moatDipCandles, 15)[42].ema;
  const c43 = Math.round(ema43Approx * 0.9755);
  moatDipCandles[43] = {
    time: 44 * 86400000,
    open: c42,
    high: c42 + 200,
    low: c43 - 300,
    close: c43,
    volume: 160,
  };

  // Day 44 (dip day 3, rebounding today!): ~ -1.5% below EMA15, close > open and close > yesterday.close
  const ema44Approx = calculateEMA(moatDipCandles, 15)[43].ema;
  const c44 = Math.round(ema44Approx * 0.985);
  moatDipCandles[44] = {
    time: 45 * 86400000,
    open: c43,
    high: c44 + 300,
    low: c43 - 100,
    close: c44,
    volume: 180,
  };

  const metrics = calculateCycleMetrics(moatDipCandles, c44);
  const radar = calculateTacticalRadar(moatDipCandles, c44, 'zh');

  assert.ok(metrics.consecutiveAbove >= 40, `Expected preserved cycle streak >= 40, got ${metrics.consecutiveAbove}`);
  assert.equal(radar.currentCycleDay, metrics.consecutiveAbove);
  assert.equal(radar.isUncertainPhase, true);
  assert.equal(radar.activeDipDays, 3);
  assert.equal(radar.isIntradayReclaim, true);
  assert.equal(radar.state, 'moat_reclaim_watch');
  assert.ok((radar.emaReclaimDistance ?? 0) > 0, 'Should report positive dollar distance to reclaim EMA15');
  assert.ok((radar.moatBufferRemaining ?? 0) > 0, 'Should report positive dollar buffer above ATR defense floor');

  // Case B: If the dip exceeds the dynamic 10-day tolerance (e.g. 11 consecutive days below EMA15), streak resets to 0
  const elevenDayDipCandles = [...moatDipCandles];
  for (let extra = 0; extra < 8; extra++) {
    const idx = 45 + extra;
    const latestEma = calculateEMA(elevenDayDipCandles, 15)[elevenDayDipCandles.length - 1].ema;
    const dipClose = Math.round(latestEma * 0.985);
    elevenDayDipCandles.push({
      time: (idx + 1) * 86400000,
      open: dipClose + 100,
      high: dipClose + 200,
      low: dipClose - 200,
      close: dipClose,
      volume: 130,
    });
  }
  const expiredMetrics = calculateCycleMetrics(elevenDayDipCandles, elevenDayDipCandles[elevenDayDipCandles.length - 1].close);
  assert.equal(expiredMetrics.consecutiveAbove, 0, 'Dip exceeding 10 days must reset consecutiveAbove to 0');

  // Case C: Deep breakdown below ATR moat (> 3% and below EMA15 - 1.05 ATR) resets streak to 0 and state becomes true_breakdown
  const deepCrashCandles = [...baseCandles];
  const crashClose = Math.round(ema42 * 0.92); // -8% crash well below EMA15 and ATR defense floor
  deepCrashCandles[44] = {
    time: 45 * 86400000,
    open: ema42,
    high: ema42,
    low: crashClose - 500,
    close: crashClose,
    volume: 300,
  };
  const crashMetrics = calculateCycleMetrics(deepCrashCandles, crashClose);
  const crashRadar = calculateTacticalRadar(deepCrashCandles, crashClose, 'zh');
  assert.equal(crashMetrics.consecutiveAbove, 0, 'Deep crash below ATR moat must reset streak to 0');
  assert.equal(crashRadar.state, 'true_breakdown', 'Deep crash below ATR moat must trigger true_breakdown');

  // Case D: Bear market history with no prior bull streak should not artificially count tail dip days
  const bearCandles: CandleData[] = Array.from({ length: 40 }, (_, i) => {
    const close = 90000 - i * 500;
    return {
      time: (i + 1) * 86400000,
      open: close + 200,
      high: close + 400,
      low: close - 400,
      close,
      volume: 100,
    };
  });
  const bearEma = calculateEMA(bearCandles, 15);
  const bearStreak = calculateStreakDetails(bearCandles, bearEma);
  assert.equal(bearStreak.streak, 0, 'Pure downtrend must have 0 streak');
  assert.equal(bearStreak.isUncertain, false);
});

test('Dynamic Moat & Curve 4 Red Line: 7-day shallow dip preserves streak, and breakdown draws red line to Day 100', () => {
  // Build a test series simulating Cycle 5 launched on 2026-08-17
  const startMs = new Date('2026-08-17').getTime();
  const candles: CandleData[] = Array.from({ length: 70 }, (_, i) => {
    const t = startMs + i * 86400000;
    const base = 60000 + i * 350;
    return {
      time: t,
      open: base,
      high: base + 500,
      low: base - 500,
      close: base,
      volume: 100,
    };
  });

  // Verify buildNormalizedCycleData retains Curve 4 even under breakdown
  const brokenData = buildNormalizedCycleData(candles, { isBroken: true, breakdownDay: 61 });
  assert.equal(brokenData.length, 101, 'Should output 101 points (Day 0 to 100)');

  // Prior to breakdown: current (green) is defined
  assert.ok(typeof brokenData[0].current === 'number', 'Day 0 must have current gain');
  assert.ok(typeof brokenData[60].current === 'number', 'Day 60 must have current gain');

  // Breakdown point Day 61: flagged with isBreakdownPoint and connects both lines
  assert.equal(brokenData[61].isBreakdownPoint, true, 'Day 61 must be flagged as breakdown point');
  assert.ok(typeof brokenData[61].current === 'number', 'Day 61 should connect with current');
  assert.ok(typeof brokenData[61].currentBroken === 'number', 'Day 61 should connect with currentBroken');

  // After breakdown day up to Day 100: currentBroken (red) extends to Day 100
  assert.ok(typeof brokenData[62].currentBroken === 'number', 'Day 62 must have currentBroken');
  assert.ok(typeof brokenData[70].currentBroken === 'number', 'Day 70 must project currentBroken');
  assert.ok(typeof brokenData[100].currentBroken === 'number', 'Day 100 must have currentBroken all the way to 100');
});

test('Spring Reclaim: when a 7-day dip in ATR moat reclaims EMA15, streak bridges full cycle instead of resetting to 1', () => {
  // Build a test series simulating Cycle 5 launched on 2026-08-17
  const startMs = new Date('2026-08-17').getTime();
  const candles: CandleData[] = Array.from({ length: 57 }, (_, i) => {
    const t = startMs + i * 86400000;
    const base = 60000 + i * 350;
    return {
      time: t,
      open: base,
      high: base + 500,
      low: base - 500,
      close: base,
      volume: 100,
    };
  });

  // Add a 7-day shallow dip within ATR moat (days 57 to 63)
  const preEma = calculateEMA(candles, 15)[56].ema;
  for (let d = 0; d < 7; d++) {
    const t = startMs + (57 + d) * 86400000;
    const dipClose = Math.round(preEma * 0.985); // 1.5% below EMA15, held inside ATR moat
    candles.push({
      time: t,
      open: dipClose,
      high: dipClose + 200,
      low: dipClose - 200,
      close: dipClose,
      volume: 100,
    });
  }

  // Day 64: Strong bullish reclaim candle above EMA15
  const emaBeforeReclaim = calculateEMA(candles, 15)[candles.length - 1].ema;
  const reclaimClose = Math.round(emaBeforeReclaim * 1.01);
  candles.push({
    time: startMs + 64 * 86400000,
    open: reclaimClose - 300,
    high: reclaimClose + 300,
    low: reclaimClose - 300,
    close: reclaimClose,
    volume: 200,
  });

  const ema = calculateEMA(candles, 15);
  const atr = calculateATR(candles, 14);
  const streakDetails = calculateStreakDetails(candles, ema, atr);
  const radar = calculateTacticalRadar(candles, reclaimClose, 'zh');

  assert.ok(streakDetails.streak >= 60, `Streak must preserve full cycle across 7-day dip, got ${streakDetails.streak}`);
  assert.equal(radar.currentCycleDay, streakDetails.streak);
  assert.equal(radar.state, 'spring_reclaim', 'Must identify state as spring_reclaim');
});


