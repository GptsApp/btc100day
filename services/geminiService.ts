import { CandleData, MarketStats } from '../types';

export const generateMarketInsight = async (stats: MarketStats, recentCandles: CandleData[]): Promise<string> => {
  try {
    // Simulate AI analysis based on market data
    const lastClose = recentCandles[recentCandles.length - 1]?.close || stats.currentPrice;
    const thirtyDaysAgo = recentCandles[recentCandles.length - 30]?.close || lastClose;
    const change30d = ((lastClose - thirtyDaysAgo) / thirtyDaysAgo) * 100;

    let analysis = "";

    if (change30d > 20) {
      analysis = "当前市场呈现强劲上涨趋势，符合100天牛市理论的确认期特征。建议关注70-100天预警期的到来，适时锁定利润。市场情绪高涨，但需警惕回调风险。";
    } else if (change30d > 5) {
      analysis = "市场处于温和上涨阶段，可能正在进入100天牛市周期的观察期。成交量和价格走势需要进一步确认，建议耐心观察突破信号。";
    } else if (change30d < -10) {
      analysis = "当前市场处于调整阶段，符合100天理论中的"休息期"特征。建议等待下一轮周期机会，避免盲目抄底操作。";
    } else {
      analysis = "市场处于横盘整理状态，暂未出现明确的100天牛市信号。建议保持观望，等待价格突破关键阻力位后再做决策。";
    }

    return analysis;
  } catch (error) {
    console.error("Error generating insight:", error);
    return "AI 分析服务暂时不可用，请稍后重试。";
  }
};