import { GoogleGenAI } from "@google/genai";
import { CandleData, MarketStats } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

export const generateMarketInsight = async (stats: MarketStats, recentCandles: CandleData[]): Promise<string> => {
  try {
    const lastClose = recentCandles[recentCandles.length - 1]?.close || stats.currentPrice;
    
    // Calculate a rough 30-day change for context
    const thirtyDaysAgo = recentCandles[recentCandles.length - 30]?.close || lastClose;
    const change30d = ((lastClose - thirtyDaysAgo) / thirtyDaysAgo) * 100;

    const prompt = `
      Act as an expert crypto analyst specializing in the "BTC 100-Day Bull Run Theory".
      
      The Theory: 
      - A rapid, unilateral rise typically lasts ~100 days.
      - Phases: Observation (0-30d), Confirmation (30-70d), Warning (70-100d).
      
      Current Data:
      - Price: $${stats.currentPrice.toLocaleString()}
      - 24h Change: ${stats.change24hPercent.toFixed(2)}%
      - 30d Trend: ${change30d.toFixed(2)}%
      
      Task:
      Analyze if we are currently in a potential "100-day cycle". 
      If trending up strongly, estimate which phase we might be in.
      If trending down or sideways, mention we are likely in a "Rest" phase.
      
      IMPORTANT: Please reply in Chinese (Simplified). Keep it concise (max 3 sentences). Professional tone.
    `;

    const response = await ai.models.generateContent({
      model: 'deepseek-v3.2',
      contents: prompt,
    });

    return response.text || "暂时无法生成分析。";
  } catch (error) {
    console.error("Error generating insight:", error);
    return "AI 分析服务暂时不可用。";
  }
};