import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ModernChart } from './components/CandleChart';
import { InsightCard } from './components/InsightCard';
import { FAQSection } from './components/FAQSection';
import { TheorySteps } from './components/TheorySteps';
import { AnalysisPanel } from './components/AnalysisPanel';
import { fetchMarketStats, fetchCandleData } from './services/cryptoService';
import { MarketStats, CandleData, Language, HighlightPeriod } from './types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const App = () => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('zh');

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [statsData, candlesData] = await Promise.all([
          fetchMarketStats(),
          fetchCandleData('max')
        ]);
        setStats(statsData);
        setCandles(candlesData);
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };

    const updatePrice = async () => {
      try {
        const statsData = await fetchMarketStats();
        setStats(statsData);
      } catch (e) {
        console.error("Price update error:", e);
      }
    };

    initData();

    // Update price every 10 seconds to reduce load
    const interval = setInterval(updatePrice, 10000);

    return () => clearInterval(interval);
  }, []);

  const t = translations[lang];
  const isPositive = stats ? stats.change24hPercent >= 0 : true;

  // Ensure we show data from 2023-01-01 to match user request
  const chartData = useMemo(() => {
    return candles.filter(c => c.time >= new Date('2023-01-01').getTime());
  }, [candles]);

  // Defined from User Request for the Chart
  const highlightPeriods: HighlightPeriod[] = useMemo(() => {
    const isEn = lang === 'en';
    return [
      {
        label: isEn ? "Cycle 1" : "周期 1",
        startDate: "2023-10-14",
        endDate: "2024-01-22",
        description: isEn ? "Uniform Distribution" : "均匀分布",
        characteristics: isEn ? "Balanced gains front & back" : "前后涨幅相对均衡"
      },
      {
        label: isEn ? "Cycle 2" : "周期 2",
        startDate: "2024-01-22",
        endDate: "2024-04-29",
        description: isEn ? "Fast Start, Slow End" : "前快后慢",
        characteristics: isEn ? "Front-running effect, overdrafting space" : "抢跑效应，提前透支空间"
      },
      {
        label: isEn ? "Cycle 3" : "周期 3",
        startDate: "2024-09-07",
        endDate: "2024-12-16",
        description: isEn ? "Slow Start, Fast End" : "前慢后快",
        characteristics: isEn ? "Accumulation first, acceleration later" : "前期蓄力，后期加速"
      },
      {
        label: isEn ? "Cycle 4" : "周期 4",
        startDate: "2025-04-09",
        endDate: "2025-07-18",
        description: isEn ? "Fast Start, Slow End" : "前快后慢",
        characteristics: isEn ? "Late major cycle, mixed speeds" : "大周期后期，快慢刀交替",
        isPrediction: true
      }
    ];
  }, [lang]);

  return (
    <Layout lang={lang} setLang={setLang}>
      
      {/* Chart Section with Stats Header */}
      <div id="chart" className="animated-border bg-black/60 backdrop-blur-xl rounded-[24px] p-1 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
        <div className="px-4 md:px-6 py-5 border-b border-white/10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Side: Single Line Stats - Strict No Wrap */}
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden whitespace-nowrap">
                 <div className="flex items-center gap-2 shrink-0">
                   <img src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" alt="BTC" className="w-7 h-7 rounded-full shadow-sm" />
                   <h2 className="text-2xl md:text-4xl font-bold text-white text-shadow tracking-tight">BTCUSDT</h2>
                 </div>
                 
                 <div className="w-px h-5 bg-white/30 mx-1 shrink-0"></div>

                 <div className="flex items-baseline gap-2 md:gap-3 shrink-0">
                    <span className="text-2xl md:text-4xl font-semibold text-white text-shadow tracking-tight font-mono">
                      {stats ? `$${stats.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-------'}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 text-sm font-medium text-shadow ${isPositive ? 'text-[#7cff67]' : 'text-[#ff6b6b]'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {stats ? Math.abs(stats.change24hPercent).toFixed(2) : '--'}%
                        <span className="hidden sm:inline text-white/60 font-normal ml-1 text-xs uppercase">24h</span>
                    </span>
                 </div>
              </div>

              {/* Right Side: Legend */}
              <div className="hidden md:flex flex-wrap items-center gap-4 text-xs text-white text-shadow">
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-lg px-2 py-1 rounded-full border border-white/30 relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{t.price}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-lg px-2 py-1 rounded-full border border-white/30 relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="w-5 h-0.5 bg-white opacity-80 rounded-full"></div>
                    <span>EMA15</span>
                </div>
                 <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-lg px-2 py-1 rounded-full border border-white/30 relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="w-2 h-2 bg-[#10b981] opacity-50 border border-[#10b981] border-dashed"></div>
                    <span>{t.first50}</span>
                </div>
                 <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-lg px-2 py-1 rounded-full border border-white/30 relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="w-2 h-2 bg-[#ef4444] opacity-50 border border-[#ef4444] border-dashed"></div>
                    <span>{t.last50}</span>
                </div>
             </div>

           </div>
        </div>
        
        {/* Analysis Panel */}
        <div className="px-4 md:px-6 pt-6 border-b border-white/15">
           <AnalysisPanel candles={candles} currentPrice={stats?.currentPrice || 0} lang={lang} />
        </div>

        <div className="w-full p-2 md:p-4 relative" style={{ height: '500px' }}>
           {loading && candles.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center z-10">
               <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             </div>
           ) : (
             <div style={{ width: '100%', height: '100%' }}>
               <ModernChart data={chartData} highlights={highlightPeriods} />
             </div>
           )}
        </div>
      </div>

      {/* Step by Step Theory Guide (Wrapped in ID for nav) */}
      <div id="theory-steps">
        <TheorySteps lang={lang} />
      </div>

      {/* AI Insight Section */}
      <InsightCard stats={stats} history={candles} lang={lang} />

      {/* FAQ Section */}
      <FAQSection lang={lang} />

    </Layout>
  );
};

const translations = {
  en: {
    price: "Price",
    first50: "1st 50 Days",
    last50: "Last 50 Days"
  },
  zh: {
    price: "价格",
    first50: "前50天",
    last50: "后50天"
  }
};

export default App;