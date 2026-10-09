import React, { useMemo } from 'react';
import { CandleData, Language, TacticalRadarData } from '../types';
import { calculateTacticalRadar } from '../services/cycleAnalysis';
import { ArrowUpRight, ArrowDownRight, Shield, Flame, Activity } from 'lucide-react';

interface TacticalSummaryProps {
  candles: CandleData[];
  currentPrice: number;
  change24hPercent: number;
  lang: Language;
}

export const TacticalSummary: React.FC<TacticalSummaryProps> = ({
  candles,
  currentPrice,
  change24hPercent,
  lang
}) => {
  const isEn = lang === 'en';

  const radar: TacticalRadarData = useMemo(() => {
    return calculateTacticalRadar(candles, currentPrice, lang);
  }, [candles, currentPrice, lang]);

  const isPositive = change24hPercent >= 0;
  const emaDiff = radar.ema15Price > 0 ? ((currentPrice - radar.ema15Price) / radar.ema15Price * 100) : 0;

  return (
    <div className="bg-[#0e1117] border border-[#1e232d] rounded-lg p-3 md:p-4 text-[#e6edf3]">
      
      {/* Top Main Line: Price + Cycle Status + Hard Defense */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1b2028]">
        
        {/* Left: Ticker & Live Price */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg md:text-xl text-white font-mono tracking-tight">BTC/USDT</span>
            <span className="text-[11px] text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded font-mono">1D</span>
          </div>

          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={`text-xs font-semibold flex items-center ${isPositive ? 'text-[#00c076]' : 'text-[#f43f5e]'}`}>
              {isPositive ? '+' : ''}{change24hPercent.toFixed(2)}%
            </span>
          </div>

          <div className="h-4 w-px bg-[#21262d] hidden sm:block"></div>

          {/* Stance Tag */}
          <div className="flex items-center gap-1.5 bg-[#161b22] border border-[#30363d] px-2.5 py-1 rounded text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c076]"></span>
            <span className="text-white font-medium">{radar.stateLabel}</span>
          </div>
        </div>

        {/* Right: Key Decision Anchors */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[#8b949e] mr-1.5">{isEn ? 'CYCLE STAGE:' : '周期阶段:'}</span>
            <span className="text-white font-medium">{radar.cycleStageName}</span>
          </div>

          <div className="h-3 w-px bg-[#21262d]"></div>

          <div>
            <span className="text-[#8b949e] mr-1.5">{isEn ? 'STOP LOSS:' : '防守止损:'}</span>
            <span className="text-[#f43f5e] font-semibold">${radar.invalidationPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Metric Tiles - Clean single row, no redundant repetition */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-3 text-xs font-mono">
        
        {/* 1. Cycle Day */}
        <div className={`bg-[#12161f] border px-3 py-2 rounded ${radar.isUncertainPhase ? 'border-amber-500/40' : 'border-[#1e232d]'}`}>
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'CYCLE DAY' : '周期进度'}</div>
          <div className="text-base font-bold text-white">
            Day {radar.currentCycleDay}
            {radar.isUncertainPhase && (
              <span className="text-amber-400 text-xs font-semibold ml-1">{isEn ? '(Pending)' : '(待定)'}</span>
            )}{' '}
            <span className="text-[#8b949e] text-xs font-normal">/ 100</span>
          </div>
        </div>

        {/* 2. EMA15 Streak */}
        <div className={`bg-[#12161f] border px-3 py-2 rounded ${radar.isUncertainPhase ? 'border-amber-500/40' : 'border-[#1e232d]'}`}>
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'EMA15 STREAK' : '均线上方连跑'}</div>
          <div className={`text-base font-bold ${radar.isUncertainPhase ? 'text-amber-400' : 'text-[#00c076]'}`}>
            {radar.currentCycleDay} {isEn ? 'Days' : '天'}
            {radar.isUncertainPhase && (
              <span className="text-xs font-normal ml-1">{isEn ? '(Hold)' : '(暂保)'}</span>
            )}
          </div>
        </div>

        {/* 3. EMA15 Price & Bias */}
        <div className="bg-[#12161f] border border-[#1e232d] px-3 py-2 rounded">
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'EMA15 BIAS' : 'EMA15 乖离率'}</div>
          <div className="text-base font-bold text-white flex items-baseline gap-1">
            <span>${radar.ema15Price.toLocaleString()}</span>
            <span className={`text-xs ${emaDiff >= 0 ? 'text-[#00c076]' : 'text-[#f43f5e]'}`}>
              ({emaDiff >= 0 ? '+' : ''}{emaDiff.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 4. Target Zone */}
        <div className="bg-[#12161f] border border-[#1e232d] px-3 py-2 rounded">
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'TARGET ZONE' : '波段目标'}</div>
          <div className="text-base font-bold text-[#e6edf3]">
            {radar.tacticalAdvice.targetZone}
          </div>
        </div>

        {/* 5. Recommended Exposure */}
        <div className="bg-[#12161f] border border-[#1e232d] px-3 py-2 rounded">
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'EXPOSURE' : '建议仓位'}</div>
          <div className="text-base font-bold text-[#00c076]">
            {radar.tacticalAdvice.positionAdvice}
          </div>
        </div>

        {/* 6. Score */}
        <div className="bg-[#12161f] border border-[#1e232d] px-3 py-2 rounded">
          <div className="text-[10px] text-[#8b949e] mb-1">{isEn ? 'BULL SCORE' : '多头动能分'}</div>
          <div className="text-base font-bold text-white">
            {radar.score} <span className="text-[#8b949e] text-xs font-normal">/ 100</span>
          </div>
        </div>

      </div>

    </div>
  );
};
