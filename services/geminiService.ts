import { CandleData, MarketStats } from '../types';

export const generateMarketInsight = async (stats: MarketStats, recentCandles: CandleData[]): Promise<string> => {
  try {
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, recentCandles })
    });

    const data = await response.json();
    return data.insight || "暂时无法生成分析。";
  } catch (error) {
    console.error("Error generating insight:", error);
    return "AI 分析服务暂时不可用。";
  }
};