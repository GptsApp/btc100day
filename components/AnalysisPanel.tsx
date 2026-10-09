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
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 pb-2">
      
      {/* 1. EMA15 Distance */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-3 flex flex-col justify-between hover:border-[#2d3748] transition-colors">
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span>{isEn ? 'EMA15 BIAS' : 'EMA15 乖离率'}</span>
          <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight ${stats.emaDistance >= 0 ? 'text-[#00ff88]' : 'text-[#ff3b69]'}`}>
            {stats.emaDistance >= 0 ? '+' : ''}{stats.emaDistance.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#a0aec0]">{stats.emaDistance >= 0 ? (isEn ? 'Above Line' : '轨道上方') : (isEn ? 'Below Line' : '跌破轨道')}</span>
          <span className={stats.emaDistance > 8 ? 'text-amber-400' : 'text-[#718096]'}>{stats.emaDistance > 8 ? (isEn ? 'Stretched' : '高乖离') : (isEn ? 'Healthy' : '适中')}</span>
        </div>
      </div>

      {/* 2. Consecutive Above Streak (New 3-Filter Rule Applied) */}
      <div className={`bg-[#0b0e14] border rounded-lg p-3 flex flex-col justify-between transition-colors relative overflow-hidden ${stats.isUncertainPhase ? 'border-amber-500/50 hover:border-amber-400' : 'border-[#1e2330] hover:border-[#00ff88]/40'}`}>
        <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full pointer-events-none ${stats.isUncertainPhase ? 'bg-amber-500/10' : 'bg-[#00ff88]/5'}`}></div>
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span className={stats.isUncertainPhase ? 'text-amber-400' : 'text-[#00ff88]'}>{isEn ? 'EMA15 STREAK' : 'EMA15 连跑天数'}</span>
          <Flame className={`w-3.5 h-3.5 ${stats.isUncertainPhase ? 'text-amber-400' : 'text-[#00ff88]'}`} />
        </div>
        <div className="my-1.5 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">{stats.consecutiveAbove}</span>
          <span className="text-xs text-[#a0aec0] font-mono">
            {isEn ? 'DAYS' : '天'}
            {stats.isUncertainPhase ? (isEn ? ' (Pending)' : ' (待定)') : ''}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className={`${stats.isUncertainPhase ? 'text-amber-400' : 'text-[#00ff88]'} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${stats.isUncertainPhase ? 'bg-amber-400' : 'bg-[#00ff88]'}`}></span>
            {stats.isUncertainPhase
              ? (isEn ? `Moat Day ${stats.activeDipDays}/5` : `护城河第 ${stats.activeDipDays}/5 天`)
              : (isEn ? '3-Filter Safe' : '三维过滤保护')}
          </span>
          <span className="text-[#718096]">{stats.consecutiveAbove >= 30 ? (isEn ? 'Confirmed' : '确认期') : (isEn ? 'Accumulating' : '蓄力期')}</span>
        </div>
      </div>

      {/* 3. 7-Day Velocity */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-3 flex flex-col justify-between hover:border-[#2d3748] transition-colors">
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span>{isEn ? '7D VELOCITY' : '近 7 天动量'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#a855f7]" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight ${stats.change7d >= 0 ? 'text-[#00ff88]' : 'text-[#ff3b69]'}`}>
            {stats.change7d >= 0 ? '+' : ''}{stats.change7d.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#a0aec0]">{isEn ? 'Close-to-Close' : '收盘对收盘'}</span>
          <span className="text-[#718096]">{stats.change7d > 10 ? (isEn ? 'Fast Wave' : '快速波段') : (isEn ? 'Steady' : '平稳')}</span>
        </div>
      </div>

      {/* 4. 30D Max Run-Up */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-3 flex flex-col justify-between hover:border-[#2d3748] transition-colors">
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span>{isEn ? '30D RUN-UP' : '30D 最大涨幅'}</span>
          <TrendingUp className="w-3.5 h-3.5 text-[#38bdf8]" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight ${stats.maxGain30d >= 15 ? 'text-[#00ff88]' : 'text-white'}`}>
            +{stats.maxGain30d.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className={stats.maxGain30d >= 20 ? 'text-[#00ff88]' : 'text-[#a0aec0]'}>{stats.maxGain30d >= 20 ? (isEn ? 'Target Met' : '达标 (>20%)') : (isEn ? 'Normal' : '稳步推进')}</span>
          <span className="text-[#718096]">Low→High</span>
        </div>
      </div>

      {/* 5. 30D Max Drawdown */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-3 flex flex-col justify-between hover:border-[#2d3748] transition-colors">
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span>{isEn ? '30D MAX DD' : '30D 最大回撤'}</span>
          <TrendingDown className="w-3.5 h-3.5 text-[#ff3b69]" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight ${stats.maxDrawdownPercent <= 12 ? 'text-[#00ff88]' : 'text-[#ff3b69]'}`}>
            -{stats.maxDrawdownPercent.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className={stats.maxDrawdownPercent <= 12 ? 'text-[#00ff88]' : 'text-amber-400'}>{stats.maxDrawdownPercent <= 12 ? (isEn ? 'Controlled (<12%)' : '可控 (<12%)') : (isEn ? 'Elevated' : '高波动')}</span>
          <span className="text-[#718096]">Peak→Trough</span>
        </div>
      </div>

      {/* 6. Volume Ratio */}
      <div className="bg-[#0b0e14] border border-[#1e2330] rounded-lg p-3 flex flex-col justify-between hover:border-[#2d3748] transition-colors">
        <div className="flex items-center justify-between text-[11px] text-[#718096] uppercase font-mono tracking-wider">
          <span>{isEn ? 'VOL EXPANSION' : '量能放大系数'}</span>
          <Compass className="w-3.5 h-3.5 text-[#f59e0b]" />
        </div>
        <div className="my-1.5">
          <div className={`text-xl font-bold font-mono tracking-tight ${stats.volumeRatio >= 1.2 ? 'text-[#00ff88]' : 'text-white'}`}>
            {stats.volumeRatio.toFixed(2)}x
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#a0aec0]">{isEn ? '5D vs 20D Avg' : '5日均量比20日'}</span>
          <span className={stats.volumeRatio >= 1.2 ? 'text-[#00ff88]' : 'text-[#718096]'}>{stats.volumeRatio >= 1.2 ? (isEn ? 'Expanded' : '放量') : (isEn ? 'Normal' : '温和')}</span>
        </div>
      </div>

    </div>
  );
};
