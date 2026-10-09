import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { CandleData, Language, NormalizedCyclePoint } from '../types';
import { buildNormalizedCycleData, calculateTacticalRadar } from '../services/cycleAnalysis';
import { GitCompare, TrendingUp, ShieldCheck } from 'lucide-react';
import { BentoCard } from './animata/BentoCard';

interface CycleOverlayProps {
  candles: CandleData[];
  lang: Language;
}

export const CycleOverlayChart: React.FC<CycleOverlayProps> = ({ candles, lang }) => {
  const isEn = lang === 'en';

  const overlayData: NormalizedCyclePoint[] = useMemo(() => {
    return buildNormalizedCycleData(candles);
  }, [candles]);

  const radar = useMemo(() => {
    const latestClose = candles[candles.length - 1]?.close || 0;
    return calculateTacticalRadar(candles, latestClose, lang);
  }, [candles, lang]);

  const currentPoint = useMemo(() => {
    for (let i = overlayData.length - 1; i >= 0; i--) {
      if (typeof overlayData[i]?.current === 'number') {
        return overlayData[i];
      }
    }
    return null;
  }, [overlayData]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3.5 text-xs font-mono min-w-[260px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-slate-900 font-bold">
              {isEn ? `Day ${label} / 100` : `第 ${label} 天 (共100天)`}
            </span>
            <span className="text-slate-500 text-[11px] font-sans">
              {label <= 30 ? (isEn ? 'Observation' : '观察蓄力') : label <= 70 ? (isEn ? 'Golden Window' : '黄金窗口') : (isEn ? 'Warning Exit' : '预警防守')}
            </span>
          </div>

          <div className="space-y-1.5">
            {payload.map((entry: any, i: number) => {
              const nameMap: Record<string, string> = {
                current: isEn ? 'Cycle 4 (Active)' : '周期 4 (当前运行)',
                cycle1: isEn ? 'Cycle 1 (2023)' : '周期 1 (2023)',
                cycle2: isEn ? 'Cycle 2 (2024 Sp)' : '周期 2 (2024春)',
                cycle3: isEn ? 'Cycle 3 (2024 Au)' : '周期 3 (2024秋冬)',
                avgBenchmark: isEn ? 'Historical Avg' : '历史均值基准',
                coneP90: isEn ? 'Monte Carlo 90th% (High)' : '蒙特卡洛 90分位上限',
                coneP10: isEn ? 'Monte Carlo 10th% (Low)' : '蒙特卡洛 10分位下限',
              };
              const isCurr = entry.dataKey === 'current';
              const isAvg = entry.dataKey === 'avgBenchmark';
              const isCone = entry.dataKey === 'coneP90' || entry.dataKey === 'coneP10';

              if (typeof entry.value !== 'number') return null;

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-2 py-1 rounded-md ${
                    isCurr ? 'font-bold text-slate-900 bg-emerald-50 border border-emerald-200/60' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 font-mono text-[11px]">
                    {isAvg ? (
                      <span className="w-3 border-t-2 border-dashed border-slate-500"></span>
                    ) : isCone ? (
                      <span className="w-2.5 h-1 bg-slate-300 rounded-sm"></span>
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></span>
                    )}
                    <span>{nameMap[entry.dataKey] || entry.name}</span>
                  </span>
                  <span className={`font-mono font-semibold ${entry.value >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {entry.value >= 0 ? '+' : ''}{entry.value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <BentoCard id="cycle-overlay" className="p-5 md:p-6 bg-white border border-slate-200">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-900">
            <GitCompare className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                {isEn ? '100-DAY CYCLE NORMALIZED OVERLAY & MONTE CARLO CONE' : '历史 100 天周期归一化重叠对照 & 蒙特卡洛置信通道'}
              </h3>
              <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-mono whitespace-nowrap shrink-0">
                Day 0 → 100
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              {isEn
                ? 'All historical cycles aligned to Day 0. Distinct colors for Cycles 1-3, Day 30-70 Golden Window, and Wall Street Monte Carlo probability envelope.'
                : '历史全部周期对齐横轴 Day 0，前三周期多色对照，30-70 天高亮为黄金窗口，包含机构级蒙特卡洛路径置信带。'}
            </p>
          </div>
        </div>

        {/* Current Cycle Status Pill */}
        {currentPoint && (
          <div
            className={`flex flex-wrap items-center gap-2 border rounded-2xl md:rounded-full px-3.5 py-1.5 shrink-0 font-mono text-xs ${
              radar.isUncertainPhase
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200'
            }`}
            title={radar.isUncertainPhase ? (isEn ? 'Moat rebound watch in progress' : '护城河反抽观察中') : undefined}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${radar.isUncertainPhase ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            <span className={`whitespace-nowrap ${radar.isUncertainPhase ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
              {radar.isUncertainPhase
                ? (isEn ? 'Cycle 4 (Pending):' : '周期 4 (待定):')
                : (isEn ? 'Cycle 4:' : '周期 4:')}
            </span>
            <span className="font-bold text-slate-900 whitespace-nowrap">Day {currentPoint.day}</span>
            <span className="font-bold text-emerald-600 whitespace-nowrap">
              ({currentPoint.current !== undefined && currentPoint.current >= 0 ? `+${currentPoint.current}%` : `${currentPoint.current}%`})
            </span>
            {radar.isUncertainPhase && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-sans font-semibold whitespace-nowrap">
                {isEn ? 'Moat Watch' : '护城河反抽观察中'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Distinct Colored Legend Bar with Clear Dashed Line for Benchmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-xs font-mono border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          
          {/* Active Cycle 4 - Bold Emerald Green */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
            <span className="w-3 h-1.5 bg-[#10b981] rounded-full"></span>
            <span className="font-bold text-emerald-800 text-xs">
              {isEn ? 'Cycle 4 (Active)' : '周期 4 (当前运行)'}
            </span>
          </div>

          {/* Cycle 1 - Muted Slate */}
          <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
            <span className="w-3.5 h-1 bg-[#64748b] rounded-full"></span>
            <span>{isEn ? 'Cycle 1 (+82%)' : '周期 1 (+82%)'}</span>
          </div>

          {/* Cycle 2 - Deep Slate Ink */}
          <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
            <span className="w-3.5 h-1 bg-[#0f172a] rounded-full"></span>
            <span>{isEn ? 'Cycle 2 (+86%)' : '周期 2 (+86%)'}</span>
          </div>

          {/* Cycle 3 - Warm Amber Ochre */}
          <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
            <span className="w-3.5 h-1 bg-[#d97706] rounded-full"></span>
            <span>{isEn ? 'Cycle 3 (+99%)' : '周期 3 (+99%)'}</span>
          </div>

          {/* Historical Avg - Explicit Dashed Line Representation */}
          <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#94a3b8] inline-block"></span>
            <span>{isEn ? 'Historical Avg (Dashed)' : '历史均值 (虚线)'}</span>
          </div>

          {/* Monte Carlo Envelope */}
          <div className="hidden lg:flex items-center gap-2 text-slate-500 text-xs font-medium">
            <span className="w-3 h-3 bg-slate-200/60 rounded-xs border border-slate-300"></span>
            <span>{isEn ? 'Monte Carlo 10-90% Cone' : '蒙特卡洛 10-90% 置信带'}</span>
          </div>
        </div>

        {/* Shading Indicator Hint */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="inline-block w-3 h-3 rounded bg-emerald-50 border border-emerald-200/80"></span>
          <span>Day 30-70: 黄金确认窗口</span>
        </div>
      </div>

      {/* 3. Recharts Canvas with Day 30-70 Colored Background Shading & Monte Carlo Confidence Band */}
      <div className="w-full h-[380px] md:h-[420px] relative select-none pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={overlayData}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            {/* Soft Gray Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            
            <XAxis
              dataKey="day"
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(d) => `D${d}`}
              ticks={[0, 15, 30, 50, 70, 85, 100]}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />

            <YAxis
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
              width={42}
            />

            <Tooltip content={customTooltip} />

            {/* DAY 30 - 70 GOLDEN CONFIRMATION BACKGROUND SHADING */}
            <ReferenceArea
              x1={30}
              x2={70}
              fill="#10b981"
              fillOpacity={0.06}
              stroke="#10b981"
              strokeOpacity={0.25}
              strokeDasharray="4 4"
              label={{
                value: isEn ? 'DAY 30 - 70 GOLDEN WINDOW' : 'Day 30 - 70 黄金确认期',
                position: 'insideTop',
                fill: '#059669',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                fontWeight: 600,
                offset: 10,
              }}
            />

            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />

            {/* Wall Street Monte Carlo Confidence Bands (Shaded Envelope) */}
            <Area
              type="monotone"
              dataKey="coneP90"
              stroke="#cbd5e1"
              strokeDasharray="2 2"
              strokeWidth={1}
              fill="#f1f5f9"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="coneP10"
              stroke="#cbd5e1"
              strokeDasharray="2 2"
              strokeWidth={1}
              fill="#ffffff"
              fillOpacity={1}
              isAnimationActive={false}
            />

            {/* Cycle 1 Line (Muted Slate) */}
            <Line
              type="monotone"
              dataKey="cycle1"
              stroke="#64748b"
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />

            {/* Cycle 2 Line (Deep Slate Ink) */}
            <Line
              type="monotone"
              dataKey="cycle2"
              stroke="#0f172a"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />

            {/* Cycle 3 Line (Warm Amber Ochre) */}
            <Line
              type="monotone"
              dataKey="cycle3"
              stroke="#d97706"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Historical Benchmark Line (DASHED) */}
            <Line
              type="monotone"
              dataKey="avgBenchmark"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />

            {/* Active Cycle 4 (Current) - Solid Bold Emerald Line with Keyframe Node */}
            <Line
              type="monotone"
              dataKey="current"
              stroke="#10b981"
              strokeWidth={3.5}
              dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Cycle Takeaway Cards (Clean Mobbin-style Pill-Border Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="text-slate-900 font-bold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0f172a]"></span>
            <span>{isEn ? 'CYCLE 2: FRONT-RUNNING' : '周期 2：前快后慢'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
            {isEn
              ? 'Surged +75% in the first 50 days, depleting upside early. The second half saw wide sideways chop. Avoid chasing late.'
              : '前 50 天暴涨 +75% 透支空间，后半场转入宽幅震荡，切勿在前快周期后段盲目追高。'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="text-slate-900 font-bold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
            <span>{isEn ? 'CYCLE 3: ACCELERATION' : '周期 3：前慢后快'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
            {isEn
              ? 'Grinded near EMA15 for first 30 days (+15%), then launched into vertical acceleration from Day 40 to 90 (+99%).'
              : '前 30 天贴着 EMA15 充分蓄力仅涨 +15%，第 40 天开始主升浪垂直加速拉升至 10 万+。'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="text-slate-900 font-bold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
            <span>{isEn ? 'RISK RULE: DAY 70 CEILING' : '铁律风控：Day 70 预警'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
            {isEn
              ? 'Win-rate collapses past Day 70 across cycles. Missed entries must not be chased; lock in gains before Day 85-90.'
              : '历史数据显示 Day 70 之后盈亏比大幅恶化。未上车者禁止追多，持仓者须严格分批锁定利润。'}
          </p>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
          <div className="text-emerald-950 font-bold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span>{isEn ? 'MONTE CARLO PROJECTION' : '蒙特卡洛路径置信带'}</span>
          </div>
          <p className="text-emerald-800 leading-relaxed font-sans text-[11px]">
            {isEn
              ? '10,000 synthetic paths project active cycle trajectory within 10th-90th empirical percentile, preventing premature exit.'
              : '基于前三轮对数收益率与历史波动率构建 10-90% 置信走廊，避免在健康中位数震荡中被无谓洗下车。'}
          </p>
        </div>
      </div>

    </BentoCard>
  );
};
