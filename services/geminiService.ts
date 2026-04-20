import { CandleData, MarketStats } from '../types';
import { calculateEMA } from './cryptoService';

interface CycleAnalysis {
  stage: 'observation' | 'confirmation' | 'warning' | 'rest';
  probability: number;
  daysInCycle: number;
  criteria: {
    emaBreakout: boolean;
    singleSidedRise: boolean;
    volumeExpansion: boolean;
    consecutiveDays: number;
  };
  metrics: {
    emaDistance: number;
    maxDrawdown: number;
    volumeRatio: number;
    gain30d: number;
    gain7d: number;
  };
}

export const generateMarketInsight = async (stats: MarketStats, recentCandles: CandleData[], lang: string = 'zh'): Promise<string> => {
  try {
    const analysis = analyzeCycleStage(stats, recentCandles);

    // Call DeepSeek AI with processed data
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, stats, lang })
    });

    if (response.ok) {
      const data = await response.json();
      return data.insight || (lang === 'en' ? "Unable to generate analysis at the moment." : "暂时无法生成分析。");
    } else {
      return lang === 'en' ? "AI analysis service error. Please try again later." : "AI 分析服务错误，请稍后重试。";
    }
  } catch (error) {
    console.error("Error generating insight:", error);
    return lang === 'en' ? "Network error. Please check your connection and try again." : "网络错误，请检查连接后重试。";
  }
};

function analyzeCycleStage(stats: MarketStats, candles: CandleData[]): CycleAnalysis {
  if (!candles || candles.length < 35) {
    return {
      stage: 'rest',
      probability: 0,
      daysInCycle: 0,
      criteria: { emaBreakout: false, singleSidedRise: false, volumeExpansion: false, consecutiveDays: 0 },
      metrics: { emaDistance: 0, maxDrawdown: 0, volumeRatio: 1, gain30d: 0, gain7d: 0 }
    };
  }

  const emaData = calculateEMA(candles, 15);
  const currentPrice = stats.currentPrice;
  const lastEMA = emaData[emaData.length - 1]?.ema || candles[candles.length - 1].close;

  // 1. EMA15 Breakout Check
  const emaBreakout = currentPrice > lastEMA;
  const emaDistance = ((currentPrice - lastEMA) / lastEMA) * 100;

  // 2. Consecutive Days Above EMA15
  let consecutiveDays = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    const emaVal = emaData[i]?.ema;
    if (emaVal && candles[i].close > emaVal) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  // 3. Single-Sided Rise Check (Focus on EMA15 breaks, not just drawdown)
  const recentCandles = candles.slice(-30);
  let maxDrawdown = 0;
  let peak = recentCandles[0].high;
  let daysBelowEMA = 0;
  let maxDaysBelowEMA = 0;

  let maxEmaBreakDepth = 0;

  recentCandles.forEach((c, i) => {
    if (c.high > peak) peak = c.high;
    const drawdown = (peak - c.low) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    // Check if close price is below EMA15
    const emaVal = emaData[emaData.length - 30 + i]?.ema;
    if (emaVal && c.close < emaVal) {
      daysBelowEMA++;
      maxDaysBelowEMA = Math.max(maxDaysBelowEMA, daysBelowEMA);

      // Track how deep below EMA15
      const emaBreakDepth = (emaVal - c.close) / emaVal;
      maxEmaBreakDepth = Math.max(maxEmaBreakDepth, emaBreakDepth);
    } else {
      daysBelowEMA = 0;
    }
  });

  // Single-sided rise: comprehensive EMA15 break analysis
  const singleSidedRise =
    maxDaysBelowEMA <= 3 || // No significant break
    (maxDaysBelowEMA <= 7 && maxEmaBreakDepth < 0.08) || // Brief shallow break (<8%)
    (maxDaysBelowEMA <= 5 && maxEmaBreakDepth < 0.12); // Short moderate break (<12%)

  // 4. Volume Expansion Check
  const last5Vol = candles.slice(-5).reduce((acc, c) => acc + (c.volume || 0), 0) / 5;
  const last20Vol = candles.slice(-20).reduce((acc, c) => acc + (c.volume || 0), 0) / 20;
  const volRatio = last20Vol > 0 ? (last5Vol / last20Vol) : 1;
  const volumeExpansion = volRatio > 1.2;

  // 5. Calculate 30-day and 7-day gains
  const thirtyDaysAgo = candles[candles.length - 30]?.close || currentPrice;
  const sevenDaysAgo = candles[candles.length - 7]?.close || currentPrice;
  const gain30d = ((currentPrice - thirtyDaysAgo) / thirtyDaysAgo) * 100;
  const gain7d = ((currentPrice - sevenDaysAgo) / sevenDaysAgo) * 100;

  // Determine cycle stage and probability
  const criteria = { emaBreakout, singleSidedRise, volumeExpansion, consecutiveDays };
  const metrics = {
    emaDistance: Number(emaDistance.toFixed(2)),
    maxDrawdown: Number((maxDrawdown * 100).toFixed(2)),
    volumeRatio: Number(volRatio.toFixed(2)),
    gain30d: Number(gain30d.toFixed(2)),
    gain7d: Number(gain7d.toFixed(2))
  };
  const criteriaScore = (emaBreakout ? 1 : 0) + (singleSidedRise ? 1 : 0) + (volumeExpansion ? 1 : 0) + (consecutiveDays > 10 ? 1 : 0);

  let stage: CycleAnalysis['stage'];
  let probability: number;
  let daysInCycle: number;

  if (criteriaScore >= 3 && consecutiveDays >= 70) {
    stage = 'warning';
    probability = Math.min(95, 60 + (consecutiveDays - 70) * 2 + (gain30d > 50 ? 20 : 0));
    daysInCycle = consecutiveDays;
  } else if (criteriaScore >= 3 && consecutiveDays >= 30) {
    stage = 'confirmation';
    probability = Math.min(85, 40 + criteriaScore * 10 + (gain30d > 20 ? 15 : 0));
    daysInCycle = consecutiveDays;
  } else if (criteriaScore >= 2 && consecutiveDays >= 5) {
    stage = 'observation';
    probability = Math.min(60, 20 + criteriaScore * 8 + (emaDistance > 5 ? 10 : 0));
    daysInCycle = consecutiveDays;
  } else {
    stage = 'rest';
    probability = Math.max(70, 90 - criteriaScore * 15);
    daysInCycle = 0;
  }

  return { stage, probability, daysInCycle, criteria, metrics };
}

function formatAnalysisReport(analysis: CycleAnalysis): string {
  const { stage, probability, daysInCycle, criteria } = analysis;

  const stageNames = {
    observation: '观察期 (0-30天)',
    confirmation: '确认期 (30-70天)',
    warning: '预警期 (70-100天)',
    rest: '休息期'
  };

  const stageName = stageNames[stage];

  let report = `📊 **数据驱动分析报告**\n\n`;
  report += `🎯 **当前阶段**: ${stageName}\n`;
  report += `📈 **概率评估**: ${probability}%\n`;
  if (daysInCycle > 0) {
    report += `⏱️ **周期天数**: ${daysInCycle}天\n`;
  }

  report += `\n🔍 **关键指标分析**:\n`;
  report += `• EMA15突破: ${criteria.emaBreakout ? '✅ 已突破' : '❌ 未突破'}\n`;
  report += `• 单边上涨: ${criteria.singleSidedRise ? '✅ 未跌破EMA15或快速收复' : '❌ 长期跌破EMA15'}\n`;
  report += `• 成交量放大: ${criteria.volumeExpansion ? '✅ 近期放量' : '❌ 成交量平淡'}\n`;
  report += `• 连续上涨: ${criteria.consecutiveDays}天在EMA15上方\n`;

  report += `\n💡 **策略建议**:\n`;

  if (stage === 'warning') {
    report += `⚠️ 高风险阶段！周期已持续${daysInCycle}天，接近100天理论上限。建议:\n`;
    report += `• 逐步减仓，锁定利润\n• 密切关注市场情绪变化\n• 准备迎接调整期`;
  } else if (stage === 'confirmation') {
    report += `🚀 黄金入场期！趋势已确认但仍有上涨空间。建议:\n`;
    report += `• 可适度加仓，但控制仓位\n• 设置止盈目标\n• 关注70天预警信号`;
  } else if (stage === 'observation') {
    report += `👀 观察期，潜在周期启动中。建议:\n`;
    report += `• 小仓位试探性建仓\n• 等待更多确认信号\n• 避免FOMO情绪`;
  } else {
    report += `😴 市场休息期，等待下轮机会。建议:\n`;
    report += `• 保持现金，耐心等待\n• 关注新周期启动信号\n• 避免盲目抄底`;
  }

  return report;
}