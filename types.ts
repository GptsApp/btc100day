
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketStats {
  currentPrice: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
}

export enum TimeRange {
  D1 = '1D',
  D7 = '7D',
  D30 = '30D',
  D100 = '100D',
  Y1 = '1Y',
  ALL = 'ALL'
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type Language = 'en' | 'zh';

export interface HighlightPeriod {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  description: string;
  characteristics: string; // New field for specific cycle details
  isPrediction?: boolean;
}
