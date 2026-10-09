import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { TradingCockpit } from './components/TradingCockpit';
import { CycleOverlayChart } from './components/CycleOverlayChart';
import { FounderOrdersPanel } from './components/FounderOrdersPanel';
import { fetchMarketStats, fetchCandleData } from './services/cryptoService';
import { fetchFounderRealtimeState } from './services/founderService';
import { MarketStats, CandleData, Language, HighlightPeriod, FounderRealtimeState } from './types';

const FAQSection = lazy(() => import('./components/FAQSection').then(m => ({ default: m.FAQSection })));
const TheorySteps = lazy(() => import('./components/TheorySteps').then(m => ({ default: m.TheorySteps })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
  </div>
);

const App = () => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [founderState, setFounderState] = useState<FounderRealtimeState | null>(null);
  const [showFounderOnChart, setShowFounderOnChart] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('zh');

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [statsData, candlesData, founderData] = await Promise.all([
          fetchMarketStats(),
          fetchCandleData('max'),
          fetchFounderRealtimeState()
        ]);
        setStats(statsData);
        setCandles(candlesData);
        setFounderState(founderData);
      } catch (e) {
        console.error("Initialization error:", e);
        setError(lang === 'en' ? 'Failed to stream market feed. Please refresh.' : '行情数据流同步异常，请刷新重试。');
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

    const updateFounder = async () => {
      try {
        const f = await fetchFounderRealtimeState();
        if (f) setFounderState(f);
      } catch (e) {
        console.error("Founder sync error:", e);
      }
    };

    initData();

    const priceInterval = setInterval(updatePrice, 10000);
    const founderInterval = setInterval(updateFounder, 30000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(founderInterval);
    };
  }, []);

  // Live candlestick sync
  const liveCandles = useMemo(() => {
    if (candles.length === 0 || !stats?.currentPrice) return candles;
    const result = [...candles];
    const last = result[result.length - 1];
    result[result.length - 1] = {
      ...last,
      close: stats.currentPrice,
      high: Math.max(last.high, stats.currentPrice),
      low: Math.min(last.low, stats.currentPrice)
    };
    return result;
  }, [candles, stats?.currentPrice]);

  // Verified cycles
  const highlightPeriods: HighlightPeriod[] = useMemo(() => {
    const isEn = lang === 'en';
    return [
      {
        label: isEn ? "Cycle 1" : "周期 1",
        startDate: "2023-10-14",
        endDate: "2024-01-22",
        description: isEn ? "Uniform Distribution (+82.4%)" : "均匀分布型 (+82.4%)",
        characteristics: isEn ? "Balanced gains front & back, 77.2% above EMA15" : "前后半段均衡推进，77.2%天数收在EMA15上方"
      },
      {
        label: isEn ? "Cycle 2" : "周期 2",
        startDate: "2024-01-22",
        endDate: "2024-04-29",
        description: isEn ? "Front-Running (+86.5%)" : "前快后慢型 (+86.5%)",
        characteristics: isEn ? "Front-running effect, overdrafting upside by Day 50" : "抢跑效应，前50天即透支绝大部分空间"
      },
      {
        label: isEn ? "Cycle 3" : "周期 3",
        startDate: "2024-09-07",
        endDate: "2024-12-16",
        description: isEn ? "Late Acceleration (+99.0%)" : "前慢后快型 (+99.0%)",
        characteristics: isEn ? "Grinding near EMA15 then vertical parabolic surge" : "前30天贴线蓄力洗盘，后半程垂直加速爆拉"
      },
      {
        label: isEn ? "Cycle 4 (Active)" : "周期 4 (当前运行)",
        startDate: "2026-08-17",
        endDate: "2026-11-25",
        description: isEn ? "Active Bull Wave (+32.2%)" : "当前单边主升浪 (+32.2%)",
        characteristics: isEn ? "3-Filter confirmed spring reclaims, holding EMA15 for 49 days" : "三维过滤已确认诱空反包，稳健踩在EMA15上方达49天",
      }
    ];
  }, [lang]);

  return (
    <Layout lang={lang} setLang={setLang}>
      
      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2.5 flex items-center justify-between font-mono text-xs text-amber-800">
          <span>{error}</span>
          <button onClick={() => { setError(null); window.location.reload(); }} className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded">
            {lang === 'en' ? 'RETRY' : '重试'}
          </button>
        </div>
      )}

      {/* 1. Integrated Trading Cockpit with Real-time Founder Overlays & Integrated Orders Panel */}
      <TradingCockpit
        stats={stats}
        candles={liveCandles}
        highlights={highlightPeriods}
        loading={loading}
        lang={lang}
        founderPosition={founderState?.position}
        founderOrders={founderState?.orders}
        founderFills={founderState?.fills}
        showFounderLayers={showFounderOnChart}
        onToggleFounderLayers={() => setShowFounderOnChart(!showFounderOnChart)}
        microstructure={founderState?.microstructure}
      />

      {/* 2. 100-Day Normalized Cycle Overlay Chart (All Cycles Day 0 Aligned) */}
      <CycleOverlayChart candles={liveCandles} lang={lang} />

      {/* 4. Operational Methodology & Research FAQ */}
      <Suspense fallback={<LazyFallback />}>
        <TheorySteps lang={lang} />
        <FAQSection lang={lang} />
      </Suspense>

    </Layout>
  );
};

export default App;
