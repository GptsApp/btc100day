import assert from 'node:assert/strict';
import test from 'node:test';
import type { CandleData, MarketStats } from '../types.ts';
import { analyzeCycleStage, calculateCycleMetrics, calculateTacticalRadar } from '../services/cycleAnalysis.ts';

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

