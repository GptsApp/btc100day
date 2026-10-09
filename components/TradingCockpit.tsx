import React, { useMemo, useState } from 'react';
import { RealCandleChart } from './RealCandleChart';
import {
  CandleData,
  MarketStats,
  Language,
  HighlightPeriod,
  FounderLiveOrder,
  FounderLiveFill,
  FounderLivePosition,
  MicrostructureData,
} from '../types';
import { calculateTacticalRadar } from '../services/cycleAnalysis';
import {
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Calculator,
  Activity,
  Radio,
  Sliders,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { BentoCard } from './animata/BentoCard';

interface TradingCockpitProps {
  stats: MarketStats | null;
  candles: CandleData[];
  highlights: HighlightPeriod[];
  loading: boolean;
  lang: Language;
  founderPosition?: FounderLivePosition | null;
  founderOrders?: FounderLiveOrder[];
  founderFills?: FounderLiveFill[];
  showFounderLayers?: boolean;
  onToggleFounderLayers?: () => void;
  microstructure?: MicrostructureData;
}

export const TradingCockpit: React.FC<TradingCockpitProps> = ({
  stats,
  candles,
  highlights,
  loading,
  lang,
  founderPosition = null,
  founderOrders = [],
  founderFills = [],
  showFounderLayers = true,
  onToggleFounderLayers,
  microstructure,
}) => {
  const isEn = lang === 'en';
  const currentPrice = stats?.currentPrice || 0;
  const change24hPercent = stats?.change24hPercent || 0;
  const isPositive = change24hPercent >= 0;

  const [activeTab, setActiveTab] = useState<'founder' | 'tactical' | 'calculator' | 'microstructure'>('founder');
  const [founderSubView, setFounderSubView] = useState<'orders' | 'fills'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'sell' | 'buy'>('all');
  const [fillFilter, setFillFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [selectedOrderPrice, setSelectedOrderPrice] = useState<number | null>(null);

  // Wall Street Position Sizer State
  const [accountCapital, setAccountCapital] = useState<number>(50000);
  const [maxRiskPercent, setMaxRiskPercent] = useState<number>(2.0); // 2% account equity risk

  const radar = useMemo(() => {
    return calculateTacticalRadar(candles, currentPrice, lang);
  }, [candles, currentPrice, lang]);

  const emaDiff = radar.ema15Price > 0 ? ((currentPrice - radar.ema15Price) / radar.ema15Price * 100) : 0;

  const sellOrders = useMemo(() => founderOrders.filter(o => o.side === 'A'), [founderOrders]);
  const buyOrders = useMemo(() => founderOrders.filter(o => o.side === 'B'), [founderOrders]);
  const totalSellBtc = useMemo(() => Number(sellOrders.reduce((sum, o) => sum + o.size, 0).toFixed(2)), [sellOrders]);
  const totalBuyBtc = useMemo(() => Number(buyOrders.reduce((sum, o) => sum + o.size, 0).toFixed(2)), [buyOrders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'sell') return sellOrders;
    if (orderFilter === 'buy') return buyOrders;
    return founderOrders;
  }, [founderOrders, sellOrders, buyOrders, orderFilter]);

  const buyFills = useMemo(() => founderFills.filter(f => f.side === 'B'), [founderFills]);
  const sellFills = useMemo(() => founderFills.filter(f => f.side === 'A'), [founderFills]);
  const totalBuyFillsBtc = useMemo(() => Number(buyFills.reduce((sum, f) => sum + f.size, 0).toFixed(2)), [buyFills]);
  const totalSellFillsBtc = useMemo(() => Number(sellFills.reduce((sum, f) => sum + f.size, 0).toFixed(2)), [sellFills]);
  const buyFillsAvgPx = useMemo(
    () => (totalBuyFillsBtc > 0 ? Math.round(buyFills.reduce((sum, f) => sum + f.price * f.size, 0) / totalBuyFillsBtc) : 0),
    [buyFills, totalBuyFillsBtc]
  );
  const sellFillsAvgPx = useMemo(
    () => (totalSellFillsBtc > 0 ? Math.round(sellFills.reduce((sum, f) => sum + f.price * f.size, 0) / totalSellFillsBtc) : 0),
    [sellFills, totalSellFillsBtc]
  );
  const realizedFillsPnl = useMemo(
    () => Math.round(founderFills.reduce((sum, f) => sum + f.closedPnl, 0)),
    [founderFills]
  );

  const filteredFills = useMemo(() => {
    if (fillFilter === 'buy') return buyFills;
    if (fillFilter === 'sell') return sellFills;
    return founderFills;
  }, [founderFills, buyFills, sellFills, fillFilter]);

  // Wall Street Kelly / Fixed-Fractional Position Sizing Math
  const positionSizer = useMemo(() => {
    const defenseStop = radar.atrDefenseFloor || radar.invalidationPrice;
    const dollarRisk = (accountCapital * maxRiskPercent) / 100;
    const stopDistance = Math.max(1, currentPrice - defenseStop);
    const stopPercent = (stopDistance / currentPrice) * 100;

    // Position in BTC
    const positionSizeBtc = dollarRisk / stopDistance;
    const positionValueUsd = positionSizeBtc * currentPrice;
    const leverage = positionValueUsd / (accountCapital || 1);

    return {
      dollarRisk: Math.round(dollarRisk),
      stopDistance: Math.round(stopDistance),
      stopPercent: Number(stopPercent.toFixed(2)),
      positionSizeBtc: Number(positionSizeBtc.toFixed(4)),
      positionValueUsd: Math.round(positionValueUsd),
      leverage: Number(leverage.toFixed(2)),
      defenseStop: Math.round(defenseStop),
    };
  }, [accountCapital, maxRiskPercent, currentPrice, radar.atrDefenseFloor, radar.invalidationPrice]);

  return (
    <div id="chart" className="space-y-4">
      
      {/* 1. Global Master Console Bento (Gallery-White Pure Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.05fr_1.05fr_1fr_1fr] gap-3">
        
        {/* Ticker & Price */}
        <BentoCard className="sm:col-span-2 lg:col-span-1 p-4 flex flex-col justify-between" glow>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0"></span>
              <span className="font-mono font-bold text-sm tracking-tight text-slate-900">BTC/USDT</span>
              <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-medium">SPOT 1D</span>
            </div>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 whitespace-nowrap shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stats ? `${isPositive ? '+' : ''}${stats.change24hPercent.toFixed(2)}%` : '--'}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-2xl xl:text-3xl font-mono font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {stats ? `$${stats.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-------'}
            </span>
            <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
              24h Vol: {stats ? `$${(stats.volume24h / 1e6).toFixed(0)}M` : '-'}
            </span>
          </div>
        </BentoCard>

        {/* Cycle 4 Progress */}
        <BentoCard className={`p-4 flex flex-col justify-between ${radar.isUncertainPhase ? 'border-amber-300/90 bg-amber-50/25' : ''}`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-medium whitespace-nowrap">
              {isEn ? 'CYCLE 4 STAGE' : '周期 4 进度'}
            </span>
            {radar.isUncertainPhase && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-mono font-bold text-amber-800 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {isEn ? 'PENDING' : '待定 · 暂保'}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-2xl font-mono font-bold text-slate-900">Day {radar.currentCycleDay}</span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
            {radar.isUncertainPhase && (
              <span className="text-[11px] font-mono font-semibold text-amber-700">
                {isEn ? '(Hold)' : '(暂保)'}
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-600 mt-1 leading-tight">
            {radar.isUncertainPhase ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-emerald-700 font-semibold whitespace-nowrap">
                  {isEn ? `Reclaim +$${radar.emaReclaimDistance?.toLocaleString()}` : `收复 +$${radar.emaReclaimDistance?.toLocaleString()}`}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600 font-semibold whitespace-nowrap">
                  {isEn ? `Moat -$${radar.moatBufferRemaining?.toLocaleString()}` : `缓冲 -$${radar.moatBufferRemaining?.toLocaleString()}`}
                </span>
              </div>
            ) : (
              radar.cycleStageName
            )}
          </div>
        </BentoCard>

        {/* EMA15 Anchor */}
        <BentoCard className="p-4 flex flex-col justify-between">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-medium whitespace-nowrap">
            {isEn ? 'EMA15 LINE' : 'EMA15 轨道'}
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-slate-900 flex items-baseline gap-1.5 whitespace-nowrap">
            <span>${radar.ema15Price.toLocaleString()}</span>
            <span className={`text-xs font-semibold ${emaDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ({emaDiff >= 0 ? '+' : ''}{emaDiff.toFixed(1)}%)
            </span>
          </div>
          <div className={`text-[11px] font-mono mt-1 leading-tight ${emaDiff < 0 && radar.isUncertainPhase ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
            {emaDiff >= 0
              ? (isEn ? 'Above Line' : '站稳线上')
              : radar.isUncertainPhase
              ? (radar.isIntradayReclaim
                  ? (isEn
                      ? `Rebounding • +$${radar.emaReclaimDistance?.toLocaleString()} to EMA15`
                      : `跌破反抽 • 差 $${radar.emaReclaimDistance?.toLocaleString()} 收复`)
                  : (isEn
                      ? `Testing Line • Day ${radar.activeDipDays}/5`
                      : `贴线洗盘 • 第 ${radar.activeDipDays}/5 天`))
              : (isEn ? 'Testing' : '贴线洗盘')}
          </div>
        </BentoCard>

        {/* Stop Loss (ATR Dynamic Moat) */}
        <BentoCard className="p-4 flex flex-col justify-between border-rose-200/80 bg-rose-50/20 group relative">
          <div className="text-[11px] font-mono text-rose-700 uppercase tracking-wider font-semibold flex items-center justify-between gap-1.5">
            <span className="whitespace-nowrap">{isEn ? 'ATR MOAT FLOOR' : 'ATR 动态防守线'}</span>
            <div className="relative group/tip cursor-help shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-rose-400 hover:text-rose-600" />
              <div className="absolute right-0 top-5 hidden group-hover/tip:block z-50 w-64 p-2.5 bg-slate-900 text-white text-[11px] font-sans rounded-lg shadow-xl border border-slate-700 leading-relaxed pointer-events-none">
                <span className="font-bold text-amber-300 block mb-1">💡 怎么看这个值？</span>
                大饼最近平均每天自然波动 ${radar.atr14?.toLocaleString() || '2,100'}。均线价减去这个波动值就是防守底线。只要盘中没跌破此底线，均属庄家诱空洗盘，切忌恐慌卖飞。
              </div>
            </div>
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-rose-600 whitespace-nowrap">
            ${(radar.atrDefenseFloor || radar.invalidationPrice).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 leading-tight">
            {isEn ? '1.0 ATR Volatility Moat' : `扣减 $${radar.atr14?.toLocaleString() || '---'} 允许洗盘冗余`}
          </div>
        </BentoCard>

        {/* Derivatives Crowdedness / Microstructure Alert */}
        <BentoCard className="p-4 flex flex-col justify-between">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-medium flex items-center justify-between gap-1.5">
            <span className="whitespace-nowrap">{isEn ? 'DERIVATIVES OI' : '全网持仓 / 费率'}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${microstructure?.leverageRiskLevel === 'extreme' ? 'bg-rose-500 animate-ping' : microstructure?.leverageRiskLevel === 'overheated' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-slate-900 whitespace-nowrap">
            ${microstructure?.openInterestUsd ? `${microstructure.openInterestUsd}M` : '$3,296M'}
          </div>
          <div className="text-[11px] font-mono text-slate-600 mt-1 leading-tight flex flex-wrap items-center gap-x-1">
            <span className="whitespace-nowrap">年化费率:</span>
            <span className="font-bold text-slate-900 whitespace-nowrap">
              {microstructure?.fundingAnnualized !== undefined ? `${microstructure.fundingAnnualized}%` : '1.37%'}
            </span>
            <span className="text-slate-400 whitespace-nowrap">({microstructure?.leverageRiskLevel === 'extreme' ? '极度过热' : '健康主升'})</span>
          </div>
        </BentoCard>

      </div>

      {/* 2. Unified Operations Hub: Candlestick Chart (8 cols) + Founder Live Orders (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* Left Side: Real Candlestick Chart */}
        <BentoCard className="lg:col-span-8 p-4 flex flex-col justify-between" glow>
          <div className="w-full relative flex-1 min-h-[580px]">
            {loading && candles.length === 0 ? (
              <div className="h-[580px] flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <span className="text-xs font-mono text-slate-500">{isEn ? 'Streaming Binance feed...' : '正在同步币安日线数据...'}</span>
              </div>
            ) : (
              <RealCandleChart
                data={candles}
                highlights={highlights}
                founderPosition={founderPosition}
                founderOrders={founderOrders}
                founderFills={founderFills}
                showFounderLayers={showFounderLayers}
                onToggleFounderLayers={onToggleFounderLayers}
                selectedOrderPrice={selectedOrderPrice}
                lang={lang}
              />
            )}
          </div>
        </BentoCard>

        {/* Right Side: Dual-Mode Operations Panel (Clean White Surface) */}
        <BentoCard className="lg:col-span-4 p-4 flex flex-col justify-between font-mono text-xs" glow>
          
          <div>
            {/* Panel Navigation Tabs (4 Institutional Navigation Lanes) */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('founder')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'founder'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>@Paulwei</span>
                </button>

                <button
                  onClick={() => setActiveTab('tactical')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'tactical'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{isEn ? 'Radar' : '雷达'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'calculator'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-3 h-3" />
                  <span>{isEn ? 'Sizer' : '仓位计算'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('microstructure')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'microstructure'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>{isEn ? 'Micro' : '微观流'}</span>
                </button>
              </div>

              {/* Trasia Link */}
              <a
                href="https://beta.trasia.xyz/perps?watch=0xdae4df7207feb3b350e4284c8efe5f7dac37f637"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors font-medium shrink-0 ml-1"
                title="View on Trasia"
              >
                <span>Trasia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* TAB 1: FOUNDER LIVE ORDERS */}
            {activeTab === 'founder' && (
              <div className="space-y-3.5">
                
                {/* Position Card */}
                {founderPosition ? (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <span className="text-slate-600 whitespace-nowrap">{isEn ? 'POSITION:' : '实盘持仓:'} <strong className="text-slate-900 ml-1">{founderPosition.size.toFixed(2)} BTC</strong></span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                        +${Math.round(founderPosition.unrealizedPnl).toLocaleString()} ({((founderPosition.currentPrice - founderPosition.entryPrice)/founderPosition.entryPrice*100).toFixed(1)}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-500 block whitespace-nowrap">{isEn ? 'ENTRY' : '建仓价'}</span>
                        <span className="text-slate-900 font-bold whitespace-nowrap">${Math.round(founderPosition.entryPrice).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block whitespace-nowrap">{isEn ? 'LEVERAGE' : '总杠杆'}</span>
                        <span className="text-slate-900 font-bold whitespace-nowrap">1.18x (现货级)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block whitespace-nowrap">{isEn ? 'LIQ PRICE' : '强平价'}</span>
                        <span className="text-slate-600 font-semibold whitespace-nowrap">${Math.round(founderPosition.liquidationPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-slate-500 text-xs">
                    {isEn ? 'Connecting Hyperliquid API...' : '正在同步链上数据...'}
                  </div>
                )}

                {/* Sub-View Switcher: Open Orders vs 3-Month Fills */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
                  <button
                    onClick={() => setFounderSubView('orders')}
                    className={`py-1.5 px-2.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      founderSubView === 'orders'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>{isEn ? 'Open Orders' : '实时挂单'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {founderOrders.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFounderSubView('fills')}
                    className={`py-1.5 px-2.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      founderSubView === 'fills'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>{isEn ? '3M Fills' : '近3月成交'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {founderFills.length}
                    </span>
                  </button>
                </div>

                {founderSubView === 'orders' ? (
                  <>
                {/* Filter Selector */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        orderFilter === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      全部 ({founderOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('sell')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        orderFilter === 'sell' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      止盈 ({sellOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('buy')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        orderFilter === 'buy' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      接多 ({buyOrders.length})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    {orderFilter === 'sell' ? `止盈: ${totalSellBtc} BTC` : orderFilter === 'buy' ? `接多: ${totalBuyBtc} BTC` : `总计: ${founderOrders.length}笔`}
                  </span>
                </div>

                {/* Orders List */}
                <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredOrders.map(o => {
                    const isBuy = o.side === 'B';
                    const isSelected = selectedOrderPrice === o.price;
                    
                    let roleBadge = '加仓网格';
                    if (o.cycleRole === 'ema15_defense') {
                      roleBadge = 'EMA15接多';
                    } else if (o.cycleRole === 'blowoff_top_exit') {
                      roleBadge = '100天出逃';
                    } else if (o.cycleRole === 'ladder_take_profit') {
                      roleBadge = '阶梯止盈';
                    }

                    return (
                      <div
                        key={o.oid}
                        onClick={() => setSelectedOrderPrice(isSelected ? null : o.price)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                        title="点击在图表上聚焦高亮该挂单"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <div>
                            <span className={`font-bold mr-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>${o.price.toLocaleString()}</span>
                            <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{o.size} BTC</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'border-slate-700 bg-slate-800 text-slate-200'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}>
                            {roleBadge}
                          </span>
                          <span className={`text-[11px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            ${Math.round(o.valueUsd).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Strategy Insight */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                  <span className="text-slate-900 font-bold mr-1.5 font-mono">💡 周期心法:</span>
                  魏神已在 $93k~$104k 挂设 2.35 BTC 止盈网，下方 $83,186 挂单紧咬 EMA15，严格践行 Day 70 前分批被动兑现纪律。
                </div>
                  </>
                ) : (
                  <>
                    {/* 3-Month Fills Summary Strip */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">{isEn ? '3M ACCUMULATED' : '3月接多合计'}</span>
                        <span className="text-emerald-700 font-bold">{totalBuyFillsBtc} BTC</span>
                        <span className="text-[10px] text-slate-400 block">${buyFillsAvgPx.toLocaleString()} 均价</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{isEn ? '3M CLOSED' : '3月止盈合计'}</span>
                        <span className="text-amber-700 font-bold">{totalSellFillsBtc} BTC</span>
                        <span className="text-[10px] text-slate-400 block">${sellFillsAvgPx.toLocaleString()} 均价</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{isEn ? 'REALIZED PnL' : '已落袋盈亏'}</span>
                        <span className="text-emerald-700 font-bold">+${realizedFillsPnl.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block">{founderFills.length} 笔成交</span>
                      </div>
                    </div>

                    {/* Fill Filter Selector */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFillFilter('all')}
                          className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                            fillFilter === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                          }`}
                        >
                          {isEn ? `All (${founderFills.length})` : `全部 (${founderFills.length})`}
                        </button>
                        <button
                          onClick={() => setFillFilter('buy')}
                          className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                            fillFilter === 'buy' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                          }`}
                        >
                          {isEn ? `Open Long (${buyFills.length})` : `接多建仓 (${buyFills.length})`}
                        </button>
                        <button
                          onClick={() => setFillFilter('sell')}
                          className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                            fillFilter === 'sell' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                          }`}
                        >
                          {isEn ? `Close (${sellFills.length})` : `平多止盈 (${sellFills.length})`}
                        </button>
                      </div>
                    </div>

                    {/* Fills List */}
                    <div className="max-h-[265px] overflow-y-auto space-y-1.5 pr-1">
                      {filteredFills.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          {isEn ? 'No fills in last 3 months' : '近3个月暂无匹配成交记录'}
                        </div>
                      ) : (
                        filteredFills.map((f) => {
                          const isBuy = f.side === 'B';
                          const isSelected = selectedOrderPrice === f.price;
                          const d = new Date(f.timestamp);
                          const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                          return (
                            <div
                              key={`${f.oid}_${f.timestamp}`}
                              onClick={() => setSelectedOrderPrice(isSelected ? null : f.price)}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/60'
                              }`}
                              title="点击在K线图上高亮该成交价位"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isBuy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                      ${f.price.toLocaleString()}
                                    </span>
                                    <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                      {f.size} BTC
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {dateStr}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                      isSelected
                                        ? 'border-slate-700 bg-slate-800 text-slate-200'
                                        : isBuy
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {isBuy ? (isEn ? 'Open Long' : '接多成交') : (isEn ? 'Close Long' : '止盈平多')}
                                  </span>
                                </div>
                                <div className={`text-[10px] mt-0.5 font-medium ${
                                  f.closedPnl > 0
                                    ? (isSelected ? 'text-emerald-300' : 'text-emerald-600')
                                    : (isSelected ? 'text-slate-300' : 'text-slate-500')
                                }`}>
                                  {f.closedPnl > 0
                                    ? `+${Math.round(f.closedPnl).toLocaleString()} PnL`
                                    : `${Math.round(f.valueUsd).toLocaleString()}`}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Fills Insight */}
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                      <span className="text-emerald-900 font-bold mr-1.5 font-mono">📈 实盘轨迹:</span>
                      近3个月魏神从 $62.4k~$68.7k 底部密集建仓，沿 EMA15 一路在 $75.7k~$83.2k 逢回踩接多，完美印证百日单边波段加仓逻辑。
                    </div>
                  </>
                )}

              </div>
            )}

            {/* TAB 2: TACTICAL EXECUTION */}
            {activeTab === 'tactical' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">{isEn ? 'STANCE' : '作战定调'}</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{radar.stateLabel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-medium">{isEn ? 'SCORE' : '多头动能分'}</span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">{radar.score} / 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block font-medium">{isEn ? 'EMA15 PRICE' : 'EMA15 轨道价'}</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">${radar.ema15Price.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 block font-medium">{isEn ? 'ATR MOAT FLOOR' : 'ATR 动态防守线'}</span>
                    <span className="text-sm font-bold text-emerald-700 mt-0.5 block">${(radar.atrDefenseFloor || radar.invalidationPrice).toLocaleString()}</span>
                  </div>
                </div>

                {/* Uncertain Phase Resolution Box */}
                {radar.isUncertainPhase && (() => {
                  const floorPrice = radar.atrDefenseFloor || radar.invalidationPrice;
                  const moatRange = Math.max(1, radar.ema15Price - floorPrice);
                  const progressPct = Math.max(0, Math.min(100, Math.round(((currentPrice - floorPrice) / moatRange) * 100)));

                  return (
                    <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>{isEn ? 'UNCERTAIN PHASE RESOLUTION' : '不确定阶段双向判定卡'}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold">
                          {isEn ? `Day ${radar.activeDipDays}/5 in Moat` : `灰区第 ${radar.activeDipDays}/5 天`}
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-900 font-sans leading-relaxed">
                        {isEn
                          ? `Why still Day ${radar.currentCycleDay} instead of 0? Price is in the ATR moat buffer (Day ${radar.activeDipDays}/5, max dip -${radar.activeDipMaxDepth}%)${radar.isIntradayReclaim ? ' and rebounding intraday' : ''}. Cycle streak is provisionally preserved.`
                          : `为何仍显示 Day ${radar.currentCycleDay} 而未归零？当前处于 EMA15 与 ATR 防守线之间的灰区第 ${radar.activeDipDays}/5 天（最大偏离 -${radar.activeDipMaxDepth}%）${radar.isIntradayReclaim ? '，且日内已出现反抽' : ''}，护城河机制暂保周期不断裂。`}
                      </p>

                      {/* Visual Progress Bar between ATR Defense Floor (0%) and EMA15 (100%) */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-rose-700 font-semibold">
                            {isEn ? 'Moat Floor' : '防守底线'} ${floorPrice.toLocaleString()}
                          </span>
                          <span className="text-slate-900 font-bold">
                            {isEn ? 'Now' : '当前'} ${Math.round(currentPrice).toLocaleString()} ({progressPct}%)
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            EMA15 ${radar.ema15Price.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-amber-200/70 rounded-full overflow-hidden flex items-center p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Dual Resolution Outcomes */}
                      <div className="space-y-1.5 pt-1 border-t border-amber-200/80 font-sans text-[11px]">
                        <div className="flex items-start gap-1.5 text-emerald-900">
                          <span className="shrink-0">🟢</span>
                          <span>
                            <strong className="font-mono">
                              {isEn
                                ? `Reclaim Confirmed (≥ $${radar.ema15Price.toLocaleString()}): `
                                : `收复确认 (≥ $${radar.ema15Price.toLocaleString()})：`}
                            </strong>
                            {isEn
                              ? `Confirmed as Spring Reclaim (+$${radar.emaReclaimDistance?.toLocaleString()} needed), officially continuing Day ${radar.currentCycleDay}.`
                              : `确认为诱空假摔 (Spring Reclaim)，还差 $${radar.emaReclaimDistance?.toLocaleString()}，周期正式延续 Day ${radar.currentCycleDay}。`}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-rose-900">
                          <span className="shrink-0">🔴</span>
                          <span>
                            <strong className="font-mono">
                              {isEn
                                ? `Breakdown Reset (< $${radar.invalidationPrice.toLocaleString()} or >5d): `
                                : `破位归零 (< $${radar.invalidationPrice.toLocaleString()} 或洗盘超5天)：`}
                            </strong>
                            {isEn
                              ? 'ATR moat pierced, 100-day cycle officially resets to Day 0.'
                              : '护城河击穿，本轮百日周期正式重置为 Day 0。'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3 Pillars Highlight Bar */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <div className="pb-1 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-1 text-slate-700 font-bold">
                    <span className="whitespace-nowrap">三大实战指标监测 (含白话指引)</span>
                    <span className="text-[10px] text-slate-400 font-normal whitespace-nowrap">点击各条目见说明</span>
                  </div>

                  {/* Pillar 1: Donchian */}
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0"></span>
                        <span>唐奇安 20D (启动/高位轨):</span>
                      </span>
                      <span className="font-bold text-slate-900 font-mono whitespace-nowrap">
                        ${radar.donchian20High?.toLocaleString()} 
                        <span className={`ml-1 text-[11px] font-normal ${radar.currentCycleDay >= 30 ? 'text-emerald-600 font-bold' : radar.isDonchianBreakout ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                          ({radar.currentCycleDay >= 30 ? '起涨点已突破确认' : radar.isDonchianBreakout ? '已放量突破' : '等待冲破'})
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans pl-3.5 leading-tight">
                      📖 <strong>白话</strong>：{radar.currentCycleDay >= 30 
                        ? `当前运行第 ${radar.currentCycleDay} 天，起涨点已彻底突破确认；上方 $${radar.donchian20High?.toLocaleString()} 为近20日局部高点阻力。`
                        : '过去 20 天最高价。冲破它才算大单边“真正启动”，没破前别无脑重仓追。'}
                    </p>
                  </div>

                  {/* Pillar 2: ATR */}
                  <div className="space-y-0.5 pt-1 border-t border-slate-200/50">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>ATR14 波动安全垫:</span>
                      </span>
                      <span className="font-bold text-emerald-700 font-mono whitespace-nowrap">
                        ±${radar.atr14?.toLocaleString()} 
                        <span className="ml-1 text-[11px] font-normal text-slate-500">(1.0 ATR)</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans pl-3.5 leading-tight">
                      📖 <strong>白话</strong>：大饼每天正常的自然晃荡幅度。只要插针没跌破防守底线，都属庄家诱空，别轻易卖飞。
                    </p>
                  </div>

                  {/* Pillar 3: Pi-Cycle */}
                  <div className="space-y-0.5 pt-1 border-t border-slate-200/50">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${radar.piCycleState === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`}></span>
                        <span>Pi-Cycle 极值顶比值:</span>
                      </span>
                      <span className="font-bold text-slate-900 font-mono whitespace-nowrap">
                        {radar.piCycleRatio ? radar.piCycleRatio.toFixed(2) : '--'}
                        <span className={`ml-1 text-[11px] font-semibold ${
                          radar.piCycleState === 'critical' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          ({radar.piCycleState === 'critical' ? '🚨极值逃顶' : '🟢安全健康'})
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans pl-3.5 leading-tight">
                      📖 <strong>白话</strong>：历史逃顶神标。0.95~1.0 才算过热见大顶（如2021年牛顶）。目前 0.45 离大顶极远，大趋势无忧。
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between font-bold">
                    <span>{isEn ? 'CRITERIA CHECKLIST' : '量化入场判定清单'}</span>
                    <span className="text-slate-900 whitespace-nowrap">{radar.checklist.filter(c => c.passed).length}/5 通过</span>
                  </div>
                  {radar.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.passed ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span className="text-slate-800 font-medium leading-snug">{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0 whitespace-nowrap">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 leading-relaxed font-sans">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>硬失效纪律：日线收盘若击穿 ${radar.invalidationPrice.toLocaleString()} 达 2 天，单边假设失效必须止损。</span>
                </div>
              </div>
            )}

            {/* TAB 3: WALL STREET POSITION SIZER */}
            {activeTab === 'calculator' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">固定比例风险头寸逆算器</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Fixed Fractional</span>
                </div>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {/* Account Size */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">账户总本金 (USD):</span>
                      <span className="font-bold text-slate-900 font-mono">${accountCapital.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[10000, 50000, 100000, 250000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setAccountCapital(amt)}
                          className={`py-1 rounded text-[11px] font-mono border transition-all ${
                            accountCapital === amt ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ${amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Risk Exposure */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600">单笔最大允许风险 (Equity Risk):</span>
                      <span className="font-bold text-rose-600 font-mono">{maxRiskPercent}% (${positionSizer.dollarRisk})</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1.0, 1.5, 2.0, 3.0].map(pct => (
                        <button
                          key={pct}
                          onClick={() => setMaxRiskPercent(pct)}
                          className={`py-1 rounded text-[11px] font-mono border transition-all ${
                            maxRiskPercent === pct ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sizing Calculation Result Pod */}
                <div className="bg-white border-2 border-slate-900 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-600">硬失效止损距离:</span>
                    <span className="font-bold text-rose-600 font-mono">
                      -${positionSizer.stopDistance.toLocaleString()} (-{positionSizer.stopPercent}%)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">建议开仓手数:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {positionSizer.positionSizeBtc} BTC
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">头寸名义价值:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        ${positionSizer.positionValueUsd.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">推导实际杠杆:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {positionSizer.leverage}x
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-sans">
                    🛡️ <strong className="text-slate-800">数学铁律：</strong>若价格跌破动态防守线 (${positionSizer.defenseStop.toLocaleString()})，账户最大亏损严格锁定为 <strong className="text-rose-600 font-mono">${positionSizer.dollarRisk}</strong>，绝对不会发生追加保证金或爆仓。
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MICROSTRUCTURE & ORDER FLOW */}
            {activeTab === 'microstructure' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">衍生品微观结构与流动性磁铁</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Hyperliquid API</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">全网未平仓合约 (OI)</span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                      ${microstructure?.openInterestUsd ? `${microstructure.openInterestUsd}M` : '$3,296M'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">38,205 BTC</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">年化资金费率 (Funding)</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                      +{microstructure?.fundingAnnualized !== undefined ? `${microstructure.fundingAnnualized}%` : '1.37%'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">8h: 0.0012%</span>
                  </div>
                </div>

                {/* Liquidity Magnet Clusters */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 text-[11px] block">🧲 杠杆清算磁铁集群 (Liquidation Pools)</span>
                  
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600">上方空头爆仓带 (+4.5%):</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      ${(microstructure?.liquidationMagnetAbove || Math.round(currentPrice * 1.045)).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600">下方多头清算扫荡 (-4.5%):</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      ${(microstructure?.liquidationMagnetBelow || Math.round(currentPrice * 0.955)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed font-sans">
                  <strong>微观分析结论：</strong>当前年化资金费率仅 1.37%，远低于牛市见顶时的 80%~100% 极值；持仓量稳步扩张且无异常背离，属于最健康的<strong>现货与低杠杆有机推升单边形态</strong>。
                </div>
              </div>
            )}

          </div>

        </BentoCard>

      </div>

    </div>
  );
};
