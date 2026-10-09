import React, { useMemo } from 'react';
import { CandleData, Language } from '../types';
import { calculateCycleMetrics } from '../services/cycleAnalysis';
import { TrendingUp, TrendingDown, ArrowUpRight, ShieldCheck, Flame, Compass, Activity } from 'lucide-react';

interface AnalysisPanelProps {
  candles: CandleData[];
  currentPrice: number;
  lang: Language;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ candles, currentPrice, lang }) => {
  const isEn = lang === 'en';

  const stats = useMemo(() => {
    if (!candles || candles.length < 35) return null;
    return calculateCycleMetrics(candles, currentPrice);
  }, [candles, currentPrice]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pb-2">
      
      {/* 1. EMA15 Distance */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className="whitespace-nowrap">{isEn ? 'EMA15 BIAS' : 'EMA15 乖离率'}</span>
          <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight whitespace-nowrap ${stats.emaDistance >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {stats.emaDistance >= 0 ? '+' : ''}{stats.emaDistance.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-slate-400 whitespace-nowrap">{stats.emaDistance >= 0 ? (isEn ? 'Above Line' : '轨道上方') : (isEn ? 'Below Line' : '跌破轨道')}</span>
          <span className={`whitespace-nowrap ${stats.emaDistance > 8 ? 'text-amber-500' : 'text-slate-500'}`}>{stats.emaDistance > 8 ? (isEn ? 'Stretched' : '高乖离') : (isEn ? 'Healthy' : '适中')}</span>
        </div>
      </div>

      {/* 2. Consecutive Above Streak (New 3-Filter Rule Applied) */}
      <div className={`bg-slate-900 border rounded-lg p-3 flex flex-col justify-between transition-colors relative overflow-hidden ${stats.isUncertainPhase ? 'border-amber-500/50 hover:border-amber-500' : 'border-slate-800 hover:border-emerald-500/40'}`}>
        <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full pointer-events-none ${stats.isUncertainPhase ? 'bg-amber-500/10' : 'bg-emerald-500/5'}`}></div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className={`whitespace-nowrap ${stats.isUncertainPhase ? 'text-amber-500' : 'text-emerald-500'}`}>{isEn ? 'EMA15 STREAK' : 'EMA15 连跑天数'}</span>
          <Flame className={`w-3.5 h-3.5 shrink-0 ${stats.isUncertainPhase ? 'text-amber-500' : 'text-emerald-500'}`} />
        </div>
        <div className="my-1.5 flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">{stats.consecutiveAbove}</span>
          <span className="text-xs text-slate-400 font-mono">
            {isEn ? 'DAYS' : '天'}
            {stats.isUncertainPhase ? (isEn ? ' (Pending)' : ' (待定)') : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className={`${stats.isUncertainPhase ? 'text-amber-500' : 'text-emerald-500'} flex items-center gap-1 whitespace-nowrap`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${stats.isUncertainPhase ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            {stats.isUncertainPhase
              ? (isEn ? `Moat Day ${stats.activeDipDays}/5` : `护城河第 ${stats.activeDipDays}/5 天`)
              : (isEn ? '3-Filter Safe' : '三维过滤保护')}
          </span>
          <span className="text-slate-500 whitespace-nowrap">{stats.consecutiveAbove >= 30 ? (isEn ? 'Confirmed' : '确认期') : (isEn ? 'Accumulating' : '蓄力期')}</span>
        </div>
      </div>

      {/* 3. 7-Day Velocity */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className="whitespace-nowrap">{isEn ? '7D VELOCITY' : '近 7 天动量'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight whitespace-nowrap ${stats.change7d >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {stats.change7d >= 0 ? '+' : ''}{stats.change7d.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-slate-400 whitespace-nowrap">{isEn ? 'Close-to-Close' : '收盘对收盘'}</span>
          <span className="text-slate-500 whitespace-nowrap">{stats.change7d > 10 ? (isEn ? 'Fast Wave' : '快速波段') : (isEn ? 'Steady' : '平稳')}</span>
        </div>
      </div>

      {/* 4. 30D Max Run-Up */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className="whitespace-nowrap">{isEn ? '30D RUN-UP' : '30D 最大涨幅'}</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight whitespace-nowrap ${stats.maxGain30d >= 15 ? 'text-emerald-500' : 'text-white'}`}>
            +{stats.maxGain30d.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className={`whitespace-nowrap ${stats.maxGain30d >= 20 ? 'text-emerald-500' : 'text-slate-400'}`}>{stats.maxGain30d >= 20 ? (isEn ? 'Target Met' : '达标 (>20%)') : (isEn ? 'Normal' : '稳步推进')}</span>
          <span className="text-slate-500 whitespace-nowrap">Low→High</span>
        </div>
      </div>

      {/* 5. 30D Max Drawdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className="whitespace-nowrap">{isEn ? '30D MAX DD' : '30D 最大回撤'}</span>
          <TrendingDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight whitespace-nowrap ${stats.maxDrawdownPercent <= 12 ? 'text-emerald-500' : 'text-amber-500'}`}>
            -{stats.maxDrawdownPercent.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className={`whitespace-nowrap ${stats.maxDrawdownPercent <= 12 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.maxDrawdownPercent <= 12 ? (isEn ? 'Controlled (<12%)' : '可控 (<12%)') : (isEn ? 'Elevated' : '高波动')}</span>
          <span className="text-slate-500 whitespace-nowrap">Peak→Trough</span>
        </div>
      </div>

      {/* 6. Volume Ratio */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-mono tracking-wider gap-1">
          <span className="whitespace-nowrap">{isEn ? 'VOL EXPANSION' : '量能放大系数'}</span>
          <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight whitespace-nowrap ${stats.volumeRatio >= 1.2 ? 'text-emerald-500' : 'text-white'}`}>
            {stats.volumeRatio.toFixed(2)}x
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-slate-400 whitespace-nowrap">{isEn ? '5D vs 20D Avg' : '5日均量比20日'}</span>
          <span className={`whitespace-nowrap ${stats.volumeRatio >= 1.2 ? 'text-emerald-500' : 'text-slate-500'}`}>{stats.volumeRatio >= 1.2 ? (isEn ? 'Expanded' : '放量') : (isEn ? 'Normal' : '温和')}</span>
        </div>
      </div>

    </div>
  );
};
