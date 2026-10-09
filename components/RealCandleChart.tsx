import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineStyle,
} from 'lightweight-charts';
import { CandleData, HighlightPeriod, FounderLiveOrder, FounderLiveFill, FounderLivePosition } from '../types';
import { calculateEMA, calculateATR } from '../services/cycleAnalysis';
import { RotateCcw, Eye, EyeOff, Compass } from 'lucide-react';

interface RealCandleChartProps {
  data: CandleData[];
  highlights: HighlightPeriod[];
  founderPosition?: FounderLivePosition | null;
  founderOrders?: FounderLiveOrder[];
  founderFills?: FounderLiveFill[];
  showFounderLayers?: boolean;
  onToggleFounderLayers?: () => void;
  selectedOrderPrice?: number | null;
  lang?: 'zh' | 'en';
}

interface CycleDefinition {
  id: string;
  name: string;
  label: string;
  start: string;
  mid: string;
  end: string;
  gain: string;
  isCurrent?: boolean;
}

export const RealCandleChart: React.FC<RealCandleChartProps> = ({
  data,
  highlights,
  founderPosition,
  founderOrders = [],
  founderFills = [],
  showFounderLayers = true,
  onToggleFounderLayers,
  selectedOrderPrice = null,
  lang = 'zh',
}) => {
  const isEn = lang === 'en';
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  // Active view tab: 'all' or 'c1', 'c2', 'c3', 'c4'
  const [activeCycleTab, setActiveCycleTab] = useState<string>('all');
  const activeCycleTabRef = useRef<string>('all');
  activeCycleTabRef.current = activeCycleTab;

  // Track the user's actual, latest visible logical range (#1 Priority)
  // Whenever user pans or zooms, this is updated and NEVER overwritten by background polling!
  const currentLogicalRangeRef = useRef<{ from: number; to: number } | null>(null);

  // References to the 4 cycle background shading DOM elements (direct zero-lag manipulation)
  const bandsMapRef = useRef<{ [key: string]: { p1: HTMLDivElement | null; p2: HTMLDivElement | null } }>({
    c1: { p1: null, p2: null },
    c2: { p1: null, p2: null },
    c3: { p1: null, p2: null },
    c4: { p1: null, p2: null },
  });

  // Legend tooltip dynamic data
  const [crosshairData, setCrosshairData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    ema: number;
    volume: number;
    cycleInfo?: string;
  } | null>(null);

  // Filter candles starting from 2023 for clean performance & cycle coverage
  const chartData = useMemo(() => {
    const minTime = new Date('2023-01-01').getTime();
    return data.filter((c) => c.time >= minTime);
  }, [data]);

  const emaData = useMemo(() => {
    return calculateEMA(data, 15);
  }, [data]);

  const atrData = useMemo(() => {
    return calculateATR(data, 14);
  }, [data]);

  const atrDefenseFloor = useMemo(() => {
    if (data.length === 0 || emaData.length === 0 || atrData.length === 0) return 0;
    const lastEma = emaData[emaData.length - 1]?.ema || 0;
    const lastAtr = atrData[atrData.length - 1]?.atr || 0;
    return Math.round(lastEma - lastAtr);
  }, [data, emaData, atrData]);

  // Date list in chronological order
  const chartDates = useMemo(() => {
    return chartData.map((c) => {
      const d = new Date(c.time);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
  }, [chartData]);
  const chartDatesRef = useRef<string[]>([]);
  chartDatesRef.current = chartDates;

  // Defined 4 Major Cycles with exact 50d / 50d partitions
  const cycleBands: CycleDefinition[] = useMemo(() => [
    {
      id: 'c1',
      name: isEn ? 'Cycle 1' : '周期 1',
      label: 'C1',
      start: '2023-10-14',
      mid: '2023-12-03',
      end: '2024-01-22',
      gain: '+82.4%',
    },
    {
      id: 'c2',
      name: isEn ? 'Cycle 2' : '周期 2',
      label: 'C2',
      start: '2024-01-22',
      mid: '2024-03-12',
      end: '2024-05-01',
      gain: '+86.5%',
    },
    {
      id: 'c3',
      name: isEn ? 'Cycle 3' : '周期 3',
      label: 'C3',
      start: '2024-09-07',
      mid: '2024-10-27',
      end: '2024-12-16',
      gain: '+99.0%',
    },
    {
      id: 'c4',
      name: isEn ? 'Cycle 4 (Active)' : '周期 4 (当前运行)',
      label: 'C4',
      start: '2026-08-17',
      mid: '2026-10-06',
      end: '2026-11-25',
      gain: '+32.2%',
      isCurrent: true,
    },
  ], [isEn]);
  const cycleBandsRef = useRef<CycleDefinition[]>([]);
  cycleBandsRef.current = cycleBands;

  // Precompute candle indices for all cycle keypoints
  const cycleIndices = useMemo(() => {
    const findNearestIndex = (dateStr: string) => {
      if (chartDates.length === 0) return 0;
      let idx = chartDates.findIndex((d) => d >= dateStr);
      if (idx === -1) return chartDates.length - 1;
      return idx;
    };

    return cycleBands.map((c) => {
      const startIdx = findNearestIndex(c.start);
      const midIdx = findNearestIndex(c.mid);
      let endIdx = findNearestIndex(c.end);
      if (c.isCurrent) {
        endIdx = Math.min(chartDates.length - 1, startIdx + 100);
      }
      return {
        id: c.id,
        label: c.label,
        startIdx,
        midIdx,
        endIdx,
        theoreticalEndIdx: startIdx + 100,
      };
    });
  }, [cycleBands, chartDates]);
  const cycleIndicesRef = useRef(cycleIndices);
  cycleIndicesRef.current = cycleIndices;

  const latestBar = useMemo(() => {
    if (chartData.length === 0) return null;
    const last = chartData[chartData.length - 1];
    const lastEma = emaData[emaData.length - 1]?.ema || last.close;
    return {
      time: new Date(last.time).toISOString().split('T')[0],
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      ema: Math.round(lastEma),
      volume: last.volume || 0,
      cycleInfo: undefined as string | undefined,
    };
  }, [chartData, emaData]);

  // Synchronous zero-lag DOM position update for background shading zones (0 React re-renders)
  const updateBandsCoords = useCallback(() => {
    if (!chartRef.current || !containerRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const containerWidth = containerRef.current.clientWidth;
    const indices = cycleIndicesRef.current;

    indices.forEach((ci) => {
      const xStart = timeScale.logicalToCoordinate(ci.startIdx as any);
      const xMid = timeScale.logicalToCoordinate(ci.midIdx as any);
      const xEnd = timeScale.logicalToCoordinate(ci.theoreticalEndIdx as any);

      const bandEls = bandsMapRef.current[ci.id];
      if (!bandEls) return;

      if (xStart === null && xMid === null && xEnd === null) {
        if (bandEls.p1) bandEls.p1.style.display = 'none';
        if (bandEls.p2) bandEls.p2.style.display = 'none';
        return;
      }

      const s = xStart !== null ? xStart : (xMid !== null ? xMid - 100 : 0);
      const m = xMid !== null ? xMid : (xStart !== null ? xStart + 100 : 0);
      const e = xEnd !== null ? xEnd : (m + (m - s));

      const p1Left = s;
      const p1Width = Math.max(0, m - s);
      const p2Left = m;
      const p2Width = Math.max(0, e - m);

      if (bandEls.p1) {
        if (p1Width > 0 && p1Left + p1Width > 0 && p1Left < containerWidth) {
          bandEls.p1.style.display = 'block';
          bandEls.p1.style.left = `${p1Left}px`;
          bandEls.p1.style.width = `${p1Width}px`;
        } else {
          bandEls.p1.style.display = 'none';
        }
      }

      if (bandEls.p2) {
        if (p2Width > 0 && p2Left + p2Width > 0 && p2Left < containerWidth) {
          bandEls.p2.style.display = 'block';
          bandEls.p2.style.left = `${p2Left}px`;
          bandEls.p2.style.width = `${p2Width}px`;
        } else {
          bandEls.p2.style.display = 'none';
        }
      }
    });
  }, []);

  // Initialize Chart ONCE on mount with Clean White Theme
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 520,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(226, 232, 240, 0.7)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(226, 232, 240, 0.7)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#0f172a',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          color: '#0f172a',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0f172a',
        },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
        autoScale: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
        minBarSpacing: 0.2,
        shiftVisibleRangeOnNewBar: false, // Prevents auto-scrolling away when live updates arrive!
      },
    });

    chartRef.current = chart;

    // Volume Series
    const volSeries = chart.addSeries(HistogramSeries, {
      color: '#cbd5e1',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volSeriesRef.current = volSeries;

    // Candlesticks Series (Vibrant Emerald Green / Crimson Red)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries;
    markersPluginRef.current = createSeriesMarkers(candleSeries, []);

    // EMA15 Line (Solid Dark Slate Blue)
    const emaSeries = chart.addSeries(LineSeries, {
      color: '#0f172a',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: '#0f172a',
      crosshairMarkerBackgroundColor: '#ffffff',
      title: 'EMA15',
    });
    emaSeriesRef.current = emaSeries;

    // Track user pan/zoom in REAL-TIME: Whenever time scale changes, record the user's active viewport!
    chart.timeScale().subscribeVisibleLogicalRangeChange((newRange) => {
      if (newRange) {
        currentLogicalRangeRef.current = newRange;
      }
      updateBandsCoords();
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
        updateBandsCoords();
      }
    };
    window.addEventListener('resize', handleResize);

    // Crosshair Subscriber
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > containerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > 520
      ) {
        setCrosshairData(null);
        return;
      }

      const barData: any = param.seriesData.get(candleSeries);
      const emaVal: any = param.seriesData.get(emaSeries);
      const volVal: any = param.seriesData.get(volSeries);

      if (barData) {
        const timeStr = typeof param.time === 'string'
          ? param.time
          : `${(param.time as any).year}-${String((param.time as any).month).padStart(2, '0')}-${String((param.time as any).day).padStart(2, '0')}`;

        const curDateMs = new Date(timeStr).getTime();
        const bands = cycleBandsRef.current;
        const activeCycle = bands.find((h) => {
          const s = new Date(h.start).getTime();
          const e = new Date(h.end).getTime();
          return curDateMs >= s && curDateMs <= e;
        });

        let cycleDetails = '';
        if (activeCycle) {
          const midMs = new Date(activeCycle.mid).getTime();
          const partStr = curDateMs <= midMs ? '前50天' : '后50天';
          cycleDetails = `${activeCycle.name} [${partStr}]`;
        }

        setCrosshairData({
          time: timeStr,
          open: barData.open,
          high: barData.high,
          low: barData.low,
          close: barData.close,
          ema: emaVal?.value ? Math.round(emaVal.value) : 0,
          volume: volVal?.value || 0,
          cycleInfo: cycleDetails || undefined,
        });
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      markersPluginRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [updateBandsCoords]);

  // Guaranteed Full Visibility Zoom to Cycle (Zero Flash, Direct Viewport Setup)
  const zoomToCycle = useCallback((cycleId: string) => {
    if (!chartRef.current) return;
    setActiveCycleTab(cycleId);
    activeCycleTabRef.current = cycleId;

    if (cycleId === 'all') {
      chartRef.current.timeScale().fitContent();
      const fullRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (fullRange) {
        currentLogicalRangeRef.current = fullRange;
      }
      updateBandsCoords();
      return;
    }

    const indices = cycleIndicesRef.current;
    const targetIndexObj = indices.find((ci) => ci.id === cycleId);
    if (!targetIndexObj) return;

    const dates = chartDatesRef.current;
    const buffer = 10;
    const fromLogical = Math.max(0, targetIndexObj.startIdx - buffer);
    const toLogical = Math.min(dates.length + 5, targetIndexObj.endIdx + buffer);

    const rangeObj = {
      from: fromLogical,
      to: toLogical,
    };

    // Explicitly set the cycle view and record it as current viewport
    currentLogicalRangeRef.current = rangeObj;
    chartRef.current.timeScale().setVisibleLogicalRange(rangeObj);
    updateBandsCoords();
  }, [updateBandsCoords]);

  const prevCandlesCountRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Set Candlestick / EMA / Vol Data: STRICTLY PRESERVES USER MANUAL ZOOM & PAN
  useEffect(() => {
    if (!candleSeriesRef.current || !emaSeriesRef.current || !volSeriesRef.current) return;
    if (chartData.length === 0) return;

    const formattedCandles = chartData.map((c) => {
      const d = new Date(c.time);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        time: timeStr,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    });

    const uniqueCandles: any[] = [];
    const seenTimes = new Set<string>();
    formattedCandles.forEach((c) => {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        uniqueCandles.push(c);
      }
    });

    // Volume
    const volData = chartData.map((c) => {
      const d = new Date(c.time);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isUp = c.close >= c.open;
      return {
        time: timeStr,
        value: c.volume || 0,
        color: isUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
      };
    });
    const uniqueVol: any[] = [];
    const seenVol = new Set<string>();
    volData.forEach((v) => {
      if (!seenVol.has(v.time)) {
        seenVol.add(v.time);
        uniqueVol.push(v);
      }
    });

    // EMA15
    const formattedEma = data.map((c, i) => {
      const d = new Date(c.time);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const emaVal = emaData[i]?.ema;
      return {
        time: timeStr,
        value: emaVal || c.close,
      };
    }).filter((e) => seenTimes.has(e.time));

    const uniqueEma: any[] = [];
    const seenEma = new Set<string>();
    formattedEma.forEach((e) => {
      if (!seenEma.has(e.time)) {
        seenEma.add(e.time);
        uniqueEma.push(e);
      }
    });

    const isFirstInit = !isInitializedRef.current;

    if (isFirstInit) {
      isInitializedRef.current = true;
      candleSeriesRef.current.setData(uniqueCandles);
      volSeriesRef.current.setData(uniqueVol);
      emaSeriesRef.current.setData(uniqueEma);
      prevCandlesCountRef.current = uniqueCandles.length;

      chartRef.current?.timeScale().fitContent();
      const fullRange = chartRef.current?.timeScale().getVisibleLogicalRange();
      if (fullRange) currentLogicalRangeRef.current = fullRange;
      updateBandsCoords();
    } else {
      const isCandleCountChanged = uniqueCandles.length !== prevCandlesCountRef.current;

      if (isCandleCountChanged) {
        // A whole new day candle was appended (happens once per 24 hours)
        candleSeriesRef.current.setData(uniqueCandles);
        volSeriesRef.current.setData(uniqueVol);
        emaSeriesRef.current.setData(uniqueEma);
        prevCandlesCountRef.current = uniqueCandles.length;

        // Restore the user's exact current viewport (#1 Priority)
        if (currentLogicalRangeRef.current && chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(currentLogicalRangeRef.current);
        }
        updateBandsCoords();
      } else {
        // High-performance live price poll (every 10s): in-place update ONLY!
        const lastCandle = uniqueCandles[uniqueCandles.length - 1];
        const lastVol = uniqueVol[uniqueVol.length - 1];
        const lastEma = uniqueEma[uniqueEma.length - 1];

        if (lastCandle) candleSeriesRef.current.update(lastCandle);
        if (lastVol) volSeriesRef.current.update(lastVol);
        if (lastEma) emaSeriesRef.current.update(lastEma);

        // DO NOT TOUCH OR RESET THE TIME SCALE!
        // The user's zoom, pan, and scroll operations are 100% PRESERVED as #1 Priority!
        updateBandsCoords();
      }
    }
  }, [chartData, emaData, data, updateBandsCoords]);

  // Draw Founder Orders Lines on Chart ONLY for Cycle 4 or when specifically looking at current cycle
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    priceLinesRef.current.forEach((line) => {
      candleSeriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    // ONLY show founder orders when viewing Cycle 4 specifically!
    const shouldShowForCycle = activeCycleTab === 'c4';

    // Update 3-month fill markers on candlestick series (visible in 'all' or 'c4')
    if (markersPluginRef.current) {
      if (!showFounderLayers || (activeCycleTab !== 'all' && activeCycleTab !== 'c4') || !founderFills.length) {
        markersPluginRef.current.setMarkers([]);
      } else {
        const availableDates = new Set(chartDates);
        const dailyGroups = new Map<string, { side: 'B' | 'A'; totalSize: number; weightedPx: number; count: number }>();

        founderFills.forEach((f) => {
          const d = new Date(f.timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!availableDates.has(dateStr)) return;
          const key = `${dateStr}_${f.side}`;
          const prev = dailyGroups.get(key);
          if (prev) {
            const nextSz = prev.totalSize + f.size;
            prev.weightedPx = (prev.weightedPx * prev.totalSize + f.price * f.size) / nextSz;
            prev.totalSize = nextSz;
            prev.count += 1;
          } else {
            dailyGroups.set(key, {
              side: f.side,
              totalSize: f.size,
              weightedPx: f.price,
              count: 1,
            });
          }
        });

        const markers = Array.from(dailyGroups.entries())
          .map(([key, g]) => {
            const time = key.split('_')[0];
            const isBuy = g.side === 'B';
            const szStr = Number(g.totalSize.toFixed(3));
            const pxStr = Math.round(g.weightedPx / 100) / 10; // e.g. 83.2k
            return {
              time,
              position: (isBuy ? 'belowBar' : 'aboveBar') as 'belowBar' | 'aboveBar',
              color: isBuy ? '#059669' : '#d97706',
              shape: (isBuy ? 'arrowUp' : 'arrowDown') as 'arrowUp' | 'arrowDown',
              text: isBuy ? `B ${szStr} @${pxStr}k` : `S ${szStr} @${pxStr}k`,
            };
          })
          .sort((a, b) => a.time.localeCompare(b.time));

        markersPluginRef.current.setMarkers(markers);
      }
    }

    // Draw ATR Defense Floor price line when viewing c4 or all and latest close is below EMA15
    if (
      (activeCycleTab === 'c4' || activeCycleTab === 'all') &&
      latestBar &&
      latestBar.close < latestBar.ema &&
      atrDefenseFloor > 0
    ) {
      const moatLine = candleSeriesRef.current.createPriceLine({
        price: atrDefenseFloor,
        color: '#e11d48',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: isEn
          ? `ATR Moat Floor $${atrDefenseFloor.toLocaleString()}`
          : `ATR 防守底线 $${atrDefenseFloor.toLocaleString()}`,
      });
      priceLinesRef.current.push(moatLine);
    }

    if (!showFounderLayers || !shouldShowForCycle) {
      if (showFounderLayers && selectedOrderPrice) {
        const highlighted = candleSeriesRef.current.createPriceLine({
          price: selectedOrderPrice,
          color: '#0f172a',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SELECTED: $${selectedOrderPrice.toLocaleString()}`,
        });
        priceLinesRef.current.push(highlighted);
      }
      return;
    }

    // Founder Entry Price
    if (founderPosition && founderPosition.entryPrice > 0) {
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: founderPosition.entryPrice,
        color: '#059669',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `@Paulwei Entry $${Math.round(founderPosition.entryPrice).toLocaleString()}`,
      });
      priceLinesRef.current.push(entryLine);
    }

    // Real Orders Rails
    if (founderOrders && founderOrders.length > 0) {
      const sellOrders = founderOrders.filter((o) => o.side === 'A');
      const buyOrders = founderOrders.filter((o) => o.side === 'B');

      const topExit = sellOrders[sellOrders.length - 1]; // $104,222
      if (topExit) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: topExit.price,
          color: '#d97706',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `[TP Exit] $${topExit.price.toLocaleString()} (Day 100 顶部清仓)`,
        }));
      }

      const wall100k = sellOrders.find((o) => o.price === 100222);
      if (wall100k) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: wall100k.price,
          color: '#d97706',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `[TP Wall] $${wall100k.price.toLocaleString()} (10万关口止盈)`,
        }));
      }

      const majorTP = sellOrders.find((o) => o.price === 95222);
      if (majorTP) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: majorTP.price,
          color: '#d97706',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `[Major TP] $${majorTP.price.toLocaleString()} (0.3 BTC 核心减仓)`,
        }));
      }

      const firstTP = sellOrders[0];
      if (firstTP) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: firstTP.price,
          color: '#d97706',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `[First TP] $${firstTP.price.toLocaleString()} (首批止盈)`,
        }));
      }

      const emaBid = buyOrders.find((o) => o.price === 83186);
      if (emaBid) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: emaBid.price,
          color: '#2563eb',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `[EMA15 Bid] $${emaBid.price.toLocaleString()} (贴线接多)`,
        }));
      }

      const breakoutBid = buyOrders.find((o) => o.price === 80262);
      if (breakoutBid) {
        priceLinesRef.current.push(candleSeriesRef.current.createPriceLine({
          price: breakoutBid.price,
          color: '#2563eb',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `[Support Bid] $${breakoutBid.price.toLocaleString()} (起涨点防守)`,
        }));
      }

      if (selectedOrderPrice) {
        const highlighted = candleSeriesRef.current.createPriceLine({
          price: selectedOrderPrice,
          color: '#0f172a',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SELECTED: $${selectedOrderPrice.toLocaleString()}`,
        });
        priceLinesRef.current.push(highlighted);
      }
    }
  }, [showFounderLayers, founderPosition, founderOrders, founderFills, chartDates, selectedOrderPrice, activeCycleTab, latestBar, atrDefenseFloor, isEn]);

  const activeDisplay = crosshairData || latestBar;
  const isUp = activeDisplay ? activeDisplay.close >= activeDisplay.open : true;
  const priceChange = activeDisplay ? (activeDisplay.close - activeDisplay.open) : 0;
  const priceChangePct = activeDisplay && activeDisplay.open > 0 ? (priceChange / activeDisplay.open * 100) : 0;

  return (
    <div className="flex flex-col h-[640px] font-mono text-xs select-none relative">
      
      {/* 1. FIXED HEIGHT TOOLBAR (38px height, never jitters or pushes chart) */}
      <div className="h-[38px] min-h-[38px] max-h-[38px] flex items-center justify-between gap-3 px-1 mb-1 border-b border-slate-100 text-slate-500 overflow-hidden">
        
        {/* Left: O/H/L/C numbers + EMA15 + Single Line Tag */}
        {activeDisplay && (
          <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden text-[11px]">
            <span className="text-slate-900 font-bold shrink-0">{activeDisplay.time}</span>
            <div className="flex items-center gap-2 font-mono shrink-0">
              <span>O:<strong className="text-slate-900 ml-0.5">${activeDisplay.open.toLocaleString()}</strong></span>
              <span>H:<strong className="text-emerald-600 ml-0.5">${activeDisplay.high.toLocaleString()}</strong></span>
              <span>L:<strong className="text-rose-600 ml-0.5">${activeDisplay.low.toLocaleString()}</strong></span>
              <span>C:<strong className={`ml-0.5 ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>${activeDisplay.close.toLocaleString()}</strong></span>
              <span className={`font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({isUp ? '+' : ''}{priceChangePct.toFixed(2)}%)
              </span>
            </div>

            <div className="h-3 w-px bg-slate-200 shrink-0 hidden sm:block"></div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-0.5 bg-slate-900 rounded-full"></span>
              <span className="text-slate-600">EMA15:<strong className="text-slate-900 ml-1">${activeDisplay.ema.toLocaleString()}</strong></span>
            </div>

            {latestBar && latestBar.close < latestBar.ema && atrDefenseFloor > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 font-bold">
                {isEn
                  ? `⚠️ Moat Buffer (Floor $${atrDefenseFloor.toLocaleString()})`
                  : `⚠️ 护城河缓冲中 (防守底线 $${atrDefenseFloor.toLocaleString()})`}
              </span>
            )}

            {activeDisplay.cycleInfo && (
              <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full shrink-0 font-medium">
                {activeDisplay.cycleInfo}
              </span>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleFounderLayers && (activeCycleTab === 'c4' || activeCycleTab === 'all') && (
            <button
              onClick={onToggleFounderLayers}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ${
                showFounderLayers
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {showFounderLayers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isEn ? '@Paulwei Rails' : '魏神挂单轨'}</span>
            </button>
          )}

          <button
            onClick={() => zoomToCycle('all')}
            className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={isEn ? 'Reset Zoom (All)' : '重置全景视图'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 2. CHART VIEWPORT WITH PRECISE 50D/50D CYCLE BACKGROUND OVERLAYS */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-white" style={{ height: '520px' }}>
        
        {/* Cycle 50d/50d Colored Background Shading Zones (Zero-lag direct DOM styling) */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" style={{ bottom: '26px' }}>
          {cycleBands.map((c) => (
            <React.Fragment key={c.id}>
              {/* 1st 50 Days: Subtle Jade Green Area */}
              <div
                ref={(el) => {
                  if (!bandsMapRef.current[c.id]) bandsMapRef.current[c.id] = { p1: null, p2: null };
                  bandsMapRef.current[c.id].p1 = el;
                }}
                className="absolute top-0 bottom-0 border-l border-emerald-400/50 bg-emerald-500/[0.045]"
                style={{ display: 'none' }}
              >
                <div className="p-2 text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                  <span>{c.label}</span>
                  <span className="font-normal text-[9px] text-emerald-600/80">
                    {isEn ? '1st 50d' : '前50天'}
                  </span>
                </div>
              </div>

              {/* 2nd 50 Days: Subtle Rose Red Area */}
              <div
                ref={(el) => {
                  if (!bandsMapRef.current[c.id]) bandsMapRef.current[c.id] = { p1: null, p2: null };
                  bandsMapRef.current[c.id].p2 = el;
                }}
                className="absolute top-0 bottom-0 border-l border-dashed border-rose-400/50 border-r border-solid bg-rose-500/[0.045]"
                style={{ display: 'none' }}
              >
                <div className="p-2 text-[10px] font-mono font-bold text-rose-700 flex items-center gap-1">
                  <span>{c.label}</span>
                  <span className="font-normal text-[9px] text-rose-600/80">
                    {isEn ? '2nd 50d' : '后50天'}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* The Lightweight-Charts canvas on top (transparent background) */}
        <div ref={containerRef} className="relative z-10 w-full h-full" />
      </div>

      {/* 3. 1-CLICK CYCLE ZOOM CONTROLLER */}
      <div className="h-[48px] min-h-[48px] max-h-[48px] flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] overflow-x-auto">
        
        {/* Left Label */}
        <div className="flex items-center gap-1.5 text-slate-500 shrink-0 pr-1">
          <Compass className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline font-medium text-slate-800">{isEn ? 'Quick Zoom:' : '一键定位周期:'}</span>
        </div>

        {/* Cycle Navigation Buttons (Mobbin Stadium Pill Style) */}
        <div className="flex items-center gap-1.5 shrink-0 flex-1 justify-start md:justify-end">
          
          <button
            onClick={() => zoomToCycle('all')}
            className={`px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 ${
              activeCycleTab === 'all'
                ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <span>{isEn ? 'All (Full View)' : '全景总览 (2023-2026)'}</span>
          </button>

          {cycleBands.map((c) => {
            const isActive = activeCycleTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => zoomToCycle(c.id)}
                className={`px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-sm'
                    : c.isCurrent
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/80'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
                title={`点击平滑缩放聚焦至 ${c.name} (${c.start} ~ ${c.end})`}
              >
                {c.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                <span className="font-bold">{c.name}</span>
                <span className={`text-[10px] ${isActive ? 'text-slate-300' : c.isCurrent ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {c.gain}
                </span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
