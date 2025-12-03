import React, { useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine, Line } from 'recharts';
import { CandleData, HighlightPeriod } from '../types';
import { calculateEMA } from '../services/cryptoService';

interface CandleChartProps {
  data: CandleData[];
  height?: number;
  highlights?: HighlightPeriod[];
}

const CustomTooltip = ({ active, payload, label, highlights }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const emaValue = payload.find((p: any) => p.dataKey === 'ema')?.value;
    const volume = data.volume;
    
    const currentTime = data.time;
    const activePeriod = highlights.find((h: HighlightPeriod) => {
       const start = new Date(h.startDate).getTime();
       const end = new Date(h.endDate).getTime();
       return currentTime >= start && currentTime <= end;
    });

    return (
      <div className="bg-black/90 backdrop-blur border border-white/20 shadow-xl rounded-lg p-4 text-xs font-sans z-50 min-w-[200px]">
        <p className="text-white mb-3 font-medium">{new Date(data.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-white flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>Price</span>
            <span className="font-semibold text-white">${data.close.toLocaleString()}</span>
          </div>
          {emaValue && (
             <div className="flex items-center justify-between gap-4">
              <span className="text-white flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white opacity-80"></div>EMA15</span>
              <span className="font-semibold text-white">${emaValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
           <div className="flex items-center justify-between gap-4">
              <span className="text-white flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white opacity-60"></div>Vol</span>
              <span className="font-semibold text-white">{volume ? `$${(volume/1000000).toFixed(1)}M` : '-'}</span>
            </div>
        </div>

        {activePeriod && (
          <div className="mt-2 pt-3 border-t border-white/20 animate-in fade-in duration-300">
             <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{activePeriod.label}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">Active</span>
             </div>
             <div className="text-white space-y-1">
                <p className="font-medium">{activePeriod.description}</p>
                <p className="text-white/70 text-[10px] leading-tight">{activePeriod.characteristics}</p>
             </div>
             <div className="mt-2 text-[10px] text-white/60">
                {activePeriod.startDate} - {activePeriod.endDate}
             </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ModernChart: React.FC<CandleChartProps> = ({ data, highlights = [] }) => {
   const emaData = useMemo(() => calculateEMA(data, 15), [data]);
   
   const chartData = useMemo(() => {
     return data.map((d, i) => ({
       ...d,
       ema: emaData[i]?.ema
     }));
   }, [data, emaData]);

   const minPrice = useMemo(() => Math.min(...data.map(d => d.low)), [data]);
   const maxPrice = useMemo(() => Math.max(...data.map(d => d.high)), [data]);
   const maxVolume = useMemo(() => Math.max(...data.map(d => d.volume || 0)), [data]);

   const padding = (maxPrice - minPrice) * 0.1;

   const referenceAreas = useMemo(() => highlights.flatMap(h => {
     const start = new Date(h.startDate).getTime();
     const dayMs = 24 * 60 * 60 * 1000;
     const mid = start + (50 * dayMs);
     const end = start + (100 * dayMs); 
     
     return [
       {
         id: `${h.label}-part1`,
         x1: start,
         x2: mid,
         label: '50d',
         color: '#00ff88',
         bgOpacity: 0.25,
         strokeOpacity: 1.0
       },
       {
         id: `${h.label}-part2`,
         x1: mid,
         x2: end,
         label: '50d',
         color: '#ff3366',
         bgOpacity: 0.25,
         strokeOpacity: 1.0
       }
     ];
   }), [highlights]);

   return (
    <div
      className="w-full h-full font-sans select-none touch-none outline-none focus:outline-none relative"
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-white/10 font-bold tracking-wider select-none w-[70%] text-center" style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}>
          BTC100.DAY
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
          className="focus:outline-none"
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ff8c00" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.6} horizontal={true} vertical={false} syncWithTicks={true} />
          
          <XAxis
            dataKey="time"
            tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { year: '2-digit', month:'2-digit'})}
            axisLine={false}
            tickLine={true}
            tick={{ fill: '#ffffff', fontSize: 10, fontFamily: 'Inter' }}
            minTickGap={50}
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
          />
          
          {/* Price Axis - Hide on very small screens if needed, or keep compact */}
          <YAxis
            yAxisId="price"
            domain={[minPrice - padding, maxPrice + padding]}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#ffffff', fontSize: 10, fontFamily: 'Inter' }}
            width={35}
            tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
          />

          {/* Volume Axis (Hidden/Scaled) */}
          <YAxis 
            yAxisId="volume"
            domain={[0, maxVolume * 5]} // Increased scale divisor to make bars smaller (bottom 20%)
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={false}
            width={0}
          />
          
          <Tooltip
            content={<CustomTooltip highlights={highlights} />}
            cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.6 }}
            isAnimationActive={false}
          />

          {/* Price Grid Lines */}
          {[44000, 79000, 114000].map((price) => (
            <ReferenceLine
              key={price}
              yAxisId="price"
              y={price}
              stroke="#ffffff"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
          ))}

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
              strokeDasharray="3 3"
              strokeOpacity={ref.strokeOpacity}
              strokeWidth={1}
            />
          ))}

          {/* Volume Bar - White with opacity */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#ffffff"
            fillOpacity={0.3}
            barSize={2}
            isAnimationActive={false}
          />

          {/* Price Area */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#ff8c00"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={true}
          />
          
          {/* EMA Line */}
          <Line
             yAxisId="price"
             type="monotone"
             dataKey="ema"
             stroke="#ffffff"
             strokeOpacity={0.8}
             strokeWidth={1.5}
             dot={false}
             isAnimationActive={true}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
   );
}