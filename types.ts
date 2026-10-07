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
  characteristics: string;
  isPrediction?: boolean;
}

// Tactical Signal & Decision Engine Types
export type TacticalState = 'healthy_bull' | 'shakeout_test' | 'spring_reclaim' | 'true_breakdown' | 'observation' | 'rest';

export interface TacticalRadarData {
  state: TacticalState;
  stateLabel: string;
  score: number; // 0 - 100
  stance: 'long_aggressive' | 'long_hold' | 'cautious_watch' | 'defensive_exit';
  currentCycleDay: number;
  cycleStageName: string;
  ema15Price: number;
  invalidationPrice: number; // Invalid if close < EMA15 - 1.0 ATR
  riskRewardRatio: string;
  // Quantitative 3-Pillar Indicators
  donchian20High?: number;
  isDonchianBreakout?: boolean;
  cycleLaunchDonchianHigh?: number; // Donchian 20D high at cycle launch (Day 0 threshold)
  isCycleLaunchBreakout?: boolean;  // True if already confirmed at cycle start
  atr14?: number;
  atrDefenseFloor?: number; // EMA15 - 1.0 * ATR14 dynamic shakeout moat
  piCycleRatio?: number;    // SMA111 / (2 * SMA350)
  piCycleState?: 'safe' | 'warning' | 'critical';
  checklist: {
    label: string;
    value: string;
    passed: boolean;
    hint: string;
  }[];
  tacticalAdvice: {
    headline: string;
    positionAdvice: string;
    defenseLine: string;
    targetZone: string;
    invalidationTrigger: string;
  };
}

// Normalized Historical Cycle Overlay Data with Monte Carlo Confidence Bands
export interface NormalizedCyclePoint {
  day: number; // 0 - 100
  cycle1?: number; // Gain %
  cycle2?: number;
  cycle3?: number;
  current?: number;
  avgBenchmark?: number;
  // Wall Street Monte Carlo Cone
  coneP90?: number; // 90th percentile (parabolic surge)
  coneP50?: number; // Median expected trajectory
  coneP10?: number; // 10th percentile conservative boundary
}

// Microstructure & Derivatives Market Intel
export interface MicrostructureData {
  fundingRate: number; // 8h funding
  fundingAnnualized: number; // % annualized
  openInterestUsd: number; // in Millions USD
  openInterestBtc: number; // in BTC
  premiumIndex: number; // Basis vs spot/oracle
  cvd24hTrend: 'accumulating' | 'distributing' | 'neutral';
  leverageRiskLevel: 'low' | 'moderate' | 'overheated' | 'extreme';
  liquidationMagnetAbove: number; // Estimated short cluster level
  liquidationMagnetBelow: number; // Estimated long cluster level
}

// Whale Sentinel Event for @Paulwei On-chain tracking
export interface WhaleSentinelAlert {
  id: string;
  timestamp: number;
  type: 'order_matched' | 'order_cancelled' | 'position_adjusted' | 'take_profit_hit';
  title: string;
  details: string;
  severity: 'info' | 'success' | 'warning';
}

// Real-time On-chain / Hyperliquid Position & Order Types for @Paulwei
export interface FounderLiveFill {
  tid: number;
  oid: number;
  coin: string;
  side: 'B' | 'A'; // 'B' = Buy (Long), 'A' = Ask (Sell/Short)
  dir: string;     // 'Open Long' | 'Close Long' | etc.
  price: number;
  size: number;
  valueUsd: number;
  closedPnl: number;
  fee: number;
  timestamp: number;
  hash: string;
}

export interface FounderLiveOrder {
  oid: number;
  coin: string;
  side: 'B' | 'A'; // 'B' = Buy (Long), 'A' = Ask (Sell/Short)
  price: number;
  size: number;
  origSize: number;
  timestamp: number;
  orderType: string;
  reduceOnly: boolean;
  valueUsd: number;
  cycleRole: 'ema15_defense' | 'dip_accumulator' | 'ladder_take_profit' | 'blowoff_top_exit';
}

export interface FounderLivePosition {
  coin: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  positionValue: number;
  unrealizedPnl: number;
  returnOnEquity: number;
  liquidationPrice: number;
  leverage: number;
  marginUsed: number;
  accountEquity: number;
}

export interface FounderRealtimeState {
  address: string;
  position: FounderLivePosition | null;
  orders: FounderLiveOrder[];
  fills: FounderLiveFill[];
  buyOrdersTotalSize: number;
  sellOrdersTotalSize: number;
  buyOrdersAvgPrice: number;
  sellOrdersAvgPrice: number;
  recentFillsBuySize: number;
  recentFillsSellSize: number;
  recentFillsBuyAvgPrice: number;
  recentFillsSellAvgPrice: number;
  recentFillsRealizedPnl: number;
  updatedAt: number;
  microstructure?: MicrostructureData;
}
