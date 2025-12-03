import React, { useMemo } from 'react';
import { CandleData, Language } from '../types';
import { calculateEMA } from '../services/cryptoService';
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, ArrowUpRight, AlertCircle, Signal } from 'lucide-react';

interface AnalysisPanelProps {
  candles: CandleData[];
  currentPrice: number;
  lang: Language;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ candles, currentPrice, lang }) => {
  const t = translations[lang];

  const stats = useMemo(() => {
    if (!candles || candles.length < 35) return null;

    const recentCandles = candles.slice(-30); // Last 30 days for window calculation
    const emaDataFull = calculateEMA(candles, 15);
    
    // 1. EMA15 Distance (Instant)
    const lastCandle = candles[candles.length - 1];
    const lastEMA = emaDataFull[emaDataFull.length - 1]?.ema || lastCandle.close;
    const emaDistance = ((currentPrice - lastEMA) / lastEMA) * 100;
    
    // 2. Consecutive Days Above EMA15
    let consecutiveAbove = 0;
    for (let i = candles.length - 1; i >= 0; i--) {
        const emaVal = emaDataFull[i]?.ema;
        if (emaVal && candles[i].close > emaVal) {
            consecutiveAbove++;
        } else {
            break;
        }
    }

    // 3. Max Run-Up in Last 30 Days (Correct "Gain" Logic)
    let maxRunUp = 0;
    for (let i = 0; i < recentCandles.length; i++) {
        const entryLow = recentCandles[i].low;
        for (let j = i; j < recentCandles.length; j++) {
            const exitHigh = recentCandles[j].high;
            const runUp = (exitHigh - entryLow) / entryLow;
            if (runUp > maxRunUp) {
                maxRunUp = runUp;
            }
        }
    }
    const maxGain30d = maxRunUp * 100;

    // 4. Max Drawdown in Last 30 Days (Peak to Trough)
    let maxDrawdown = 0;
    let peak = recentCandles[0].high;
    
    recentCandles.forEach(c => {
        if (c.high > peak) {
            peak = c.high;
        }
        const drawdown = (peak - c.low) / peak;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });
    const maxDrawdownPercent = maxDrawdown * 100;

    // 5. Volume Trend (Last 5 days vs Last 20 days avg)
    const last5Vol = candles.slice(-5).reduce((acc, c) => acc + (c.volume || 0), 0) / 5;
    const last20Vol = candles.slice(-20).reduce((acc, c) => acc + (c.volume || 0), 0) / 20;
    const volRatio = last20Vol > 0 ? (last5Vol / last20Vol) : 1;
    const volTrend = (volRatio - 1) * 100; // % change

    // 6. 7 Day Change
    const price7d = candles[candles.length - 8]?.close || currentPrice;
    const change7d = ((currentPrice - price7d) / price7d) * 100;

    return {
        emaDistance,
        consecutiveAbove,
        maxGain30d,
        maxDrawdownPercent,
        volTrend,
        change7d
    };

  }, [candles, currentPrice]);

  if (!stats) return null;

  const renderTrend = (val: number, suffix = '%') => {
     let color = val > 0 ? 'text-[#00ff88]' : val < 0 ? 'text-[#ff3366]' : 'text-white';
     return (
         <div className={`flex items-center gap-1 ${color} font-medium`}>
             {val > 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
             <span>{val > 0 ? '+' : ''}{val.toFixed(1)}{suffix}</span>
         </div>
     );
  };

  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Row 1: Basic Trends */}
        <Widget 
          title={t.emaDist} 
          icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}
          value={renderTrend(stats.emaDistance)}
          sub={stats.emaDistance > 0 ? (lang === 'en' ? 'Above Line' : '位于上方') : (lang === 'en' ? 'Below Line' : '位于下方')}
        />
        <Widget 
           title={t.gain7d}
           icon={<BarChart3 className="w-3.5 h-3.5 text-purple-500" />}
           value={renderTrend(stats.change7d)}
           sub={lang === 'en' ? '7 Day Change' : '近7天波动'}
        />

        {/* Row 2: The 4 Core Indicators */}
        <Widget 
          title={t.consecutive} 
          icon={<TrendingUp className="w-3.5 h-3.5 text-orange-500" />}
          value={<span className="font-semibold text-white tracking-tight">{stats.consecutiveAbove} {t.days}</span>}
          sub={stats.consecutiveAbove > 0 ? (lang === 'en' ? 'Sustaining' : '持续中') : (lang === 'en' ? 'Broken' : '已跌破')}
        />

        <Widget 
           title={t.maxGain}
           icon={<ArrowUpRight className="w-3.5 h-3.5 text-green-600" />}
           value={<span className={`font-semibold tracking-tight ${stats.maxGain30d >= 20 ? 'text-[#00ff88]' : 'text-white'}`}>{stats.maxGain30d.toFixed(1)}%</span>}
           sub={stats.maxGain30d >= 20 ? (lang === 'en' ? 'Target Met' : '达标 (>20%)') : (lang === 'en' ? 'Low Momentum' : '动能不足')}
        />

         <Widget 
           title={t.maxDrawdown}
           icon={<TrendingDown className="w-3.5 h-3.5 text-red-500" />}
           value={<span className={`font-semibold tracking-tight ${stats.maxDrawdownPercent <= 15 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>{stats.maxDrawdownPercent.toFixed(1)}%</span>}
           sub={stats.maxDrawdownPercent <= 15 ? (lang === 'en' ? 'Healthy' : '健康 (<15%)') : (lang === 'en' ? 'Risky' : '风险较高')}
        />

        <Widget 
           title={t.volTrend}
           icon={<Signal className="w-3.5 h-3.5 text-indigo-500" />}
           value={<span className={`font-semibold tracking-tight ${stats.volTrend > 0 ? 'text-[#00ff88]' : 'text-white'}`}>{stats.volTrend > 0 ? '+' : ''}{stats.volTrend.toFixed(1)}%</span>}
           sub={stats.volTrend > 20 ? (lang === 'en' ? 'Amplifying' : '持续放大') : (lang === 'en' ? 'Flat/Low' : '平淡')}
        />
    </div>
  );
};

const Widget = ({ title, icon, value, sub }: any) => (
    <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-3.5 border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between h-24">
        <div className="flex items-center gap-2 mb-1">
            <div className="text-shadow">{icon}</div>
            <span className="text-[10px] uppercase font-bold text-white text-shadow tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">{title}</span>
        </div>
        <div>
            <div className="text-lg text-white text-shadow leading-none mb-1">{value}</div>
            <div className="text-[10px] text-white text-shadow font-medium">{sub}</div>
        </div>
    </div>
);

const translations = {
    en: {
        emaDist: "EMA15 Dist",
        gain7d: "7D Trend",
        consecutive: "Consec > EMA15",
        maxGain: "30D Max Gain",
        maxDrawdown: "30D Drawdown",
        volTrend: "Vol Trend",
        days: "days"
    },
    zh: {
        emaDist: "日线EMA15距离",
        gain7d: "近7天涨幅",
        consecutive: "连续在EMA15上方",
        maxGain: "近30天最大涨幅",
        maxDrawdown: "近30天最大回撤",
        volTrend: "成交量趋势",
        days: "天"
    }
}