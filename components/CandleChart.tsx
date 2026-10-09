import React, { useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine, Line } from 'recharts';
import { CandleData, HighlightPeriod, FounderLiveOrder, FounderLivePosition } from '../types';
import { calculateEMA } from '../services/cryptoService';

interface CandleChartProps {
  data: CandleData[];
  height?: number;
  highlights?: HighlightPeriod[];
  founderPosition?: FounderLivePosition | null;
  founderOrders?: FounderLiveOrder[];
  showFounderLayers?: boolean;
}

const CustomTooltip = ({ active, payload, label, highlights, founderOrders, founderPosition }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const emaValue = payload.find((p: any) => p.dataKey === 'ema')?.value;
    const volume = data.volume;
    
    const currentTime = data.time;
    const activePeriod = highlights?.find((h: HighlightPeriod) => {
       const start = new Date(h.startDate).getTime();
       const end = new Date(h.endDate).getTime();
       return currentTime >= start && currentTime <= end;
    });

    const emaDiff = emaValue ? ((data.close - emaValue) / emaValue * 100) : 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded p-3 text-xs font-mono z-50 min-w-[220px]">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
          <span className="text-slate-400 font-medium">{new Date(data.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          <span className="text-[10px] text-slate-500">1D BAR</span>
        </div>

        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              CLOSE
            </span>
            <span className="font-bold text-white font-mono-numbers">${data.close.toLocaleString()}</span>
          </div>

          {emaValue && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-white"></span>
                EMA15
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-200 font-mono-numbers">${Math.round(emaValue).toLocaleString()}</span>
                <span className={`text-[10px] ${emaDiff >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ({emaDiff >= 0 ? '+' : ''}{emaDiff.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              VOL
            </span>
            <span className="font-medium text-slate-400 font-mono-numbers">{volume ? `$${(volume/1000000).toFixed(1)}M` : '-'}</span>
          </div>
        </div>

        {activePeriod && (
          <div className="pt-2 border-t border-slate-800 text-[11px]">
             <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-white font-mono">{activePeriod.label}</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-mono">TRACKED</span>
             </div>
             <p className="text-slate-400 text-[10px] leading-tight">{activePeriod.description}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ModernChart: React.FC<CandleChartProps> = ({
  data,
  highlights = [],
  founderPosition = null,
  founderOrders = [],
  showFounderLayers = true
}) => {
   const CHART_START = new Date('2023-01-01').getTime();

   const emaData = useMemo(() => calculateEMA(data, 15), [data]);
   
   const chartData = useMemo(() => {
     return data
       .map((d, i) => ({
         ...d,
         ema: emaData[i]?.ema
       }))
       .filter(d => d.time >= CHART_START);
   }, [data, emaData]);

   const minPrice = useMemo(() => chartData.length > 0 ? Math.min(...chartData.map(d => d.low)) : 0, [chartData]);
   const maxPrice = useMemo(() => chartData.length > 0 ? Math.max(...chartData.map(d => d.high), 106000) : 106000, [chartData]);
   const maxVolume = useMemo(() => chartData.length > 0 ? Math.max(...chartData.map(d => d.volume || 0)) : 1, [chartData]);

   const padding = (maxPrice - minPrice) * 0.08;

   const referenceAreas = useMemo(() => highlights.flatMap((h, index) => {
     const start = new Date(h.startDate).getTime();
     const dayMs = 24 * 60 * 60 * 1000;
     const mid = start + (50 * dayMs);
     const end = start + (100 * dayMs);
     const cycleNum = index + 1;

     return [
       {
         id: `${h.label}-part1`,
         x1: start,
         x2: mid,
         cycleLabel: `C${cycleNum}`,
         color: '#10b981',
         bgOpacity: 0.04,
         strokeOpacity: 0.25,
         showLabel: true,
       },
       {
         id: `${h.label}-part2`,
         x1: mid,
         x2: end,
         cycleLabel: '',
         color: '#d97706',
         bgOpacity: 0.04,
         strokeOpacity: 0.25,
         showLabel: false,
       }
     ];
   }), [highlights]);

   // Compute Founder Orders Key Clusters for Horizontal Line Markers
   const keyOrderLevels = useMemo(() => {
     if (!showFounderLayers || !founderOrders || founderOrders.length === 0) return [];
     
     // Select the most strategic levels to render cleanly
     const targets = [
       { px: 104222, label: '104.2k (Top Exit)', side: 'A' },
       { px: 100222, label: '100.2k (100k Wall)', side: 'A' },
       { px: 95222, label: '95.2k (0.3 BTC TP)', side: 'A' },
       { px: 83186, label: '83.2k (EMA15 Bid)', side: 'B' },
       { px: 80262, label: '80.3k (Breakout Bid)', side: 'B' },
     ];

     return targets;
   }, [showFounderLayers, founderOrders]);

   return (
    <div
      className="w-full h-full select-none touch-none outline-none focus:outline-none relative font-mono"
      style={{ minWidth: '300px', minHeight: '400px' }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={400} className="focus:outline-none">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          className="focus:outline-none"
        >
          <defs>
            <linearGradient id="colorPriceTerminal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={true} vertical={false} />
          
          <XAxis
            dataKey="time"
            tickFormatter={(t) => {
              const date = new Date(t);
              const year = String(date.getFullYear()).slice(2);
              const month = String(date.getMonth() + 1).padStart(2, '0');
              return `${year}/${month}`;
            }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            minTickGap={45}
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
          />
          
          <YAxis
            yAxisId="price"
            domain={[minPrice - padding, maxPrice + padding]}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            width={40}
            tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
          />

          <YAxis 
            yAxisId="volume"
            domain={[0, maxVolume * 6]}
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={false}
            width={0}
          />
          
          <Tooltip
            content={<CustomTooltip highlights={highlights} founderOrders={founderOrders} founderPosition={founderPosition} />}
            cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />

          {/* Reference Areas for 50d/50d Cycles */}
          {referenceAreas.map((ref) => (
            <ReferenceArea
              yAxisId="price"
              key={ref.id}
              x1={ref.x1}
              x2={ref.x2}
              y1={minPrice - padding}
              y2={maxPrice + padding}
              fill={ref.color}
              fillOpacity={ref.bgOpacity}
              stroke={ref.color}
              strokeDasharray="2 2"
              strokeOpacity={ref.strokeOpacity}
              strokeWidth={1}
              label={ref.showLabel ? {
                value: ref.cycleLabel,
                position: 'insideTopLeft',
                fill: '#94a3b8',
                fontSize: 11,
                fontWeight: 'bold',
                offset: 8
              } : undefined}
            />
          ))}

          {/* Founder Entry Price Horizontal Ray */}
          {showFounderLayers && founderPosition && founderPosition.entryPrice > 0 && (
            <ReferenceLine
              yAxisId="price"
              y={founderPosition.entryPrice}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              strokeWidth={1.2}
              label={{
                value: `@Paulwei Entry $${Math.round(founderPosition.entryPrice).toLocaleString()}`,
                position: 'insideBottomRight',
                fill: '#10b981',
                fontSize: 10,
                offset: 4
              }}
            />
          )}

          {/* Founder Strategic Limit Orders Rails */}
          {showFounderLayers && keyOrderLevels.map(lvl => (
            <ReferenceLine
              yAxisId="price"
              key={lvl.px}
              y={lvl.px}
              stroke={lvl.side === 'B' ? '#059669' : '#d97706'}
              strokeDasharray="2 4"
              strokeOpacity={0.6}
              strokeWidth={1}
              label={{
                value: `@Paulwei ${lvl.side === 'B' ? 'BID' : 'TP'}: ${lvl.label}`,
                position: 'insideRight',
                fill: lvl.side === 'B' ? '#059669' : '#d97706',
                fontSize: 9,
                offset: 4
              }}
            />
          ))}

          {/* Volume Bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#334155"
            fillOpacity={0.6}
            barSize={2}
            isAnimationActive={false}
          />

          {/* Price Area Curve */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#f59e0b"
            strokeWidth={1.75}
            fillOpacity={1}
            fill="url(#colorPriceTerminal)"
            isAnimationActive={true}
          />
          
          {/* EMA15 Line */}
          <Line
             yAxisId="price"
             type="monotone"
             dataKey="ema"
             stroke="#ffffff"
             strokeOpacity={0.9}
             strokeWidth={1.5}
             dot={false}
             isAnimationActive={true}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
   );
};
