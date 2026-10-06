import type { CandleData, MarketStats } from '../types';
import { analyzeCycleStage } from './cycleAnalysis';
import type { CycleAnalysis } from './cycleAnalysis';

export { analyzeCycleStage } from './cycleAnalysis';

export const generateMarketInsight = async (stats: MarketStats, recentCandles: CandleData[], lang: string = 'zh'): Promise<string> => {
  try {
    if (!stats?.currentPrice || !recentCandles?.length) {
      return lang === 'en' ? 'Insufficient market data to generate analysis.' : '市场数据不足，无法生成分析。';
    }

    const analysis = analyzeCycleStage(stats, recentCandles);

    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, stats, lang })
    });

    const data = await response.json().catch(() => null);

    if (data?.insight) {
      return data.insight;
    }

    if (!response.ok) {
      return lang === 'en'
        ? 'AI service is temporarily unavailable. Please try again later.'
        : 'AI 分析服务暂时不可用，请稍后重试。';
    }

    return lang === 'en' ? 'Unable to generate analysis. Please try again.' : '暂时无法生成分析，请重试。';
  } catch {
    return lang === 'en' ? 'Network error. Please check your connection.' : '网络错误，请检查连接后重试。';
  }
};

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
