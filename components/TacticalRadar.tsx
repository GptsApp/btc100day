import React, { useMemo } from 'react';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CandleData, Language, TacticalRadarData } from '../types';
import { calculateTacticalRadar } from '../services/cycleAnalysis';

interface TacticalRadarProps {
  candles: CandleData[];
  currentPrice: number;
  lang: Language;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({ candles, currentPrice, lang }) => {
  const isEn = lang === 'en';

  const radar: TacticalRadarData = useMemo(() => {
    return calculateTacticalRadar(candles, currentPrice, lang);
  }, [candles, currentPrice, lang]);

  const stanceBadge = {
    long_aggressive: {
      bg: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
      label: isEn ? 'AGGRESSIVE LONG' : '激进做多 / 逢踩加仓'
    },
    long_hold: {
      bg: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
      label: isEn ? 'TREND HOLD' : '顺势持仓 / 移动止盈'
    },
    cautious_watch: {
      bg: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
      label: radar.state === 'moat_reclaim_watch'
        ? (isEn ? 'MOAT REBOUND / PENDING' : '护城河反抽 / 周期暂保')
        : (isEn ? 'SHAKEOUT TEST' : '均线洗盘 / 观察防守')
    },
    defensive_exit: {
      bg: 'bg-[#ff3b69]/10 text-[#ff3b69] border-[#ff3b69]/30',
      label: isEn ? 'DEFENSIVE EXIT' : '防守避险 / 严格止损'
    }
  }[radar.stance];

  return (
    <div id="tactical-radar" className="terminal-card rounded-xl p-4 md:p-5 text-[#e2e8f0]">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1a2233]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#101726] border border-[#232f48] flex items-center justify-center text-[#00ff88]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight font-mono">
                {isEn ? 'TACTICAL SIGNAL RADAR' : '战术级决策雷达 & 入场检查清单'}
              </h3>
              <span className="text-[10px] bg-[#162032] text-[#38bdf8] border border-[#223554] px-1.5 py-0.5 rounded font-mono">
                DETERMINISTIC
              </span>
            </div>
            <p className="text-[11px] text-[#64748b] font-mono">
              {isEn
                ? 'Multi-dimensional verification • 3-Filter Shakeout Engine • Dynamic Invalidation Level'
                : '纯数学量化验算 • 三维过滤防洗盘引擎 • 动态日线 EMA15 硬失效锚点'}
            </p>
          </div>
        </div>

        {/* Tactical Stance & Confidence Score & Pi-Cycle Top Monitor */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pi-Cycle Top Monitor Capsule */}
          {radar.piCycleRatio !== undefined && (
            <div className={`px-2.5 py-1.5 rounded border flex flex-col items-center justify-center font-mono whitespace-nowrap ${
              radar.piCycleState === 'critical'
                ? 'bg-[#ff3b69]/15 border-[#ff3b69]/50 text-[#ff3b69] animate-pulse'
                : radar.piCycleState === 'warning'
                ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]'
                : 'bg-[#101726] border-[#1e293b] text-[#94a3b8]'
            }`}>
              <span className="text-[9px] uppercase tracking-wider">{isEn ? 'PI-TOP RATIO' : 'Pi逃顶比值'}</span>
              <span className="text-xs font-bold">
                {radar.piCycleRatio.toFixed(2)}
                <span className="text-[9px] font-normal ml-1">
                  {radar.piCycleState === 'critical' ? (isEn ? 'CRITICAL' : '极值顶') : radar.piCycleState === 'warning' ? (isEn ? 'WARN' : '预警') : (isEn ? 'SAFE' : '安全')}
                </span>
              </span>
            </div>
          )}

          <div className={`px-3 py-1.5 rounded border ${stanceBadge.bg} flex flex-col items-center justify-center font-mono whitespace-nowrap`}>
            <span className="text-[9px] uppercase tracking-wider text-[#94a3b8]">{isEn ? 'STANCE' : '当前作战定调'}</span>
            <span className="text-xs font-bold tracking-tight">{stanceBadge.label}</span>
          </div>

          <div className="bg-[#101726] border border-[#1e293b] px-3 py-1.5 rounded flex flex-col items-center justify-center font-mono whitespace-nowrap">
            <span className="text-[9px] text-[#64748b] uppercase tracking-wider">{isEn ? 'SCORE' : '多头动能分'}</span>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-base font-bold ${radar.score >= 70 ? 'text-[#00ff88]' : radar.score >= 50 ? 'text-[#f59e0b]' : 'text-[#ff3b69]'}`}>
                {radar.score}
              </span>
              <span className="text-[9px] text-[#475569]">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quantitative Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4">

        {/* Left Side: 5-Point Quantitative Checklist (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
              {isEn ? 'BULL RUN ENTRY CRITERIA' : '单边牛市进场量化验证指标'}
            </span>
            <span className="text-[11px] text-[#00ff88] font-mono whitespace-nowrap shrink-0">
              {radar.checklist.filter(c => c.passed).length} / {radar.checklist.length} {isEn ? 'PASSED' : '项达标'}
            </span>
          </div>

          <div className="space-y-1.5">
            {radar.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded border transition-colors flex items-center justify-between gap-3 ${
                  item.passed
                    ? 'bg-[#090d15] border-[#1e293b] hover:border-[#2b3954]'
                    : 'bg-[#ff3b69]/5 border-[#ff3b69]/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-0.5 rounded shrink-0 ${item.passed ? 'text-[#00ff88]' : 'text-[#ff3b69]'}`}>
                    {item.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white">{item.label}</div>
                    <div className="text-[10px] text-[#64748b] font-mono">{item.hint}</div>
                  </div>
                </div>

                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                  item.passed ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#ff3b69] bg-[#ff3b69]/10'
                }`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Engine State Banner */}
          <div className="p-2.5 bg-[#090d15] border border-[#1e293b] rounded flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shrink-0"></span>
              <span className="text-[#64748b]">{isEn ? 'STATE ENGINE:' : '状态机判定：'}</span>
              <span className="font-semibold text-white">{radar.stateLabel}</span>
            </div>
            <div className="text-[#38bdf8] text-[11px] whitespace-nowrap">
              {radar.cycleStageName}
            </div>
          </div>
        </div>

        {/* Right Side: Execution & Invalidation Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-[#090d15] rounded border border-[#1e293b] p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-1">
              {isEn ? 'TACTICAL EXECUTION BRIEF' : '执行战术简报'}
            </div>
            <h4 className="text-sm font-bold text-white font-mono leading-snug">
              {radar.tacticalAdvice.headline}
            </h4>
          </div>

          {/* 4 Quantitative Anchor Parameters */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#0e131f] p-2.5 rounded border border-[#1a2336]">
              <div className="text-[10px] text-[#64748b] whitespace-nowrap">{isEn ? 'POSITION EXPOSURE' : '建议仓位暴露'}</div>
              <div className="text-sm font-bold text-[#00ff88] mt-0.5 whitespace-nowrap">{radar.tacticalAdvice.positionAdvice}</div>
            </div>

            <div className="bg-[#0e131f] p-2.5 rounded border border-[#1a2336]">
              <div className="text-[10px] text-[#64748b] whitespace-nowrap">{isEn ? 'CYCLE R/R RATIO' : '周期胜率盈亏比'}</div>
              <div className="text-sm font-bold text-white mt-0.5 whitespace-nowrap">{radar.riskRewardRatio}</div>
            </div>

            <div className="bg-[#0e131f] p-2.5 rounded border border-[#1a2336]">
              <div className="text-[10px] text-[#64748b] whitespace-nowrap">{isEn ? 'CURRENT EMA15' : '当前 EMA15 点位'}</div>
              <div className="text-sm font-bold text-white mt-0.5 whitespace-nowrap">${radar.ema15Price.toLocaleString()}</div>
            </div>

            <div className="bg-[#0e131f] p-2.5 rounded border border-[#ff3b69]/30">
              <div className="text-[10px] text-[#ff3b69] whitespace-nowrap">{isEn ? 'HARD INVALIDATION' : '理论硬失效价格'}</div>
              <div className="text-sm font-bold text-[#ff3b69] mt-0.5 whitespace-nowrap">{radar.tacticalAdvice.defenseLine}</div>
            </div>
          </div>

          {/* Next Target & Discipline */}
          <div className="pt-2 border-t border-[#1a2233] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono">
              <span className="text-[#64748b] whitespace-nowrap">{isEn ? 'WAVE TARGET ZONE:' : '预期主升波段目标：'}</span>
              <span className="font-bold text-[#00ff88] whitespace-nowrap">{radar.tacticalAdvice.targetZone}</span>
            </div>

            <div className="p-2 bg-[#ff3b69]/10 rounded border border-[#ff3b69]/20 text-[11px] font-mono text-[#fca5a5] flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff3b69] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#ff3b69]">{isEn ? 'INVALIDATION TRIGGER: ' : '止损防守触发：'}</span>
                <span>{radar.tacticalAdvice.invalidationTrigger}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
