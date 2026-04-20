import { CandleData, MarketStats } from '../types';

const BINANCE_API = 'https://data-api.binance.vision/api/v3';
const BINANCE_API_FALLBACK = 'https://api.binance.com/api/v3';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// EMA Calculation Helper - uses SMA of first `period` points as seed
export const calculateEMA = (data: CandleData[], period: number = 15): { time: number; ema: number }[] => {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: { time: number; ema: number }[] = [];

  // Not enough data for full SMA, use running average
  if (data.length < period) {
    let sum = 0;
    data.forEach((d, i) => {
      sum += d.close;
      emaArray.push({ time: d.time, ema: sum / (i + 1) });
    });
    return emaArray;
  }

  // Phase 1: Calculate SMA for the first `period` data points
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  const sma = sum / period;

  // Fill first period-1 entries with running SMA for visual continuity
  let runSum = 0;
  for (let i = 0; i < period - 1; i++) {
    runSum += data[i].close;
    emaArray.push({ time: data[i].time, ema: runSum / (i + 1) });
  }

  // The period-th entry uses proper SMA as seed
  emaArray.push({ time: data[period - 1].time, ema: sma });
  let prevEma = sma;

  // Phase 2: Standard EMA formula
  for (let i = period; i < data.length; i++) {
    const ema = data[i].close * k + prevEma * (1 - k);
    emaArray.push({ time: data[i].time, ema });
    prevEma = ema;
  }

  return emaArray;
};

// Cache helpers
const CANDLE_CACHE_KEY = 'btc100_candle_cache';
const CANDLE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getCachedCandles = (): CandleData[] | null => {
  try {
    const raw = localStorage.getItem(CANDLE_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CANDLE_CACHE_TTL) return null;
    return data;
  } catch { return null; }
};

const setCachedCandles = (data: CandleData[]) => {
  try {
    localStorage.setItem(CANDLE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded, ignore */ }
};
const fetchWithTimeout = async (url: string, timeoutMs: number = 10000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

// Helper: try fetching JSON from a list of URLs, return first success
const fetchFirstSuccess = async (urls: string[]): Promise<any> => {
  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.code || json?.status?.error_code || json?.error) {
        throw new Error(JSON.stringify(json));
      }
      return json;
    } catch (e) {
      console.warn(`Failed: ${url}`, e);
      continue;
    }
  }
  throw new Error('All API sources failed');
};

export const fetchMarketStats = async (): Promise<MarketStats> => {
  // Try Binance Vision → Binance → CoinGecko
  try {
    const data = await fetchFirstSuccess([
      `${BINANCE_API}/ticker/24hr?symbol=BTCUSDT`,
      `${BINANCE_API_FALLBACK}/ticker/24hr?symbol=BTCUSDT`,
    ]);
    return {
      currentPrice: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      change24hPercent: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      marketCap: parseFloat(data.quoteVolume) * 1000,
      volume24h: parseFloat(data.quoteVolume)
    };
  } catch {
    // CoinGecko fallback
    const data = await fetchFirstSuccess([
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
    ]);
    const btc = data.bitcoin;
    return {
      currentPrice: btc.usd,
      change24h: btc.usd * (btc.usd_24h_change / 100),
      change24hPercent: btc.usd_24h_change,
      high24h: btc.usd * 1.02,
      low24h: btc.usd * 0.98,
      marketCap: btc.usd_market_cap,
      volume24h: btc.usd_24h_vol
    };
  }
};

export const fetchCandleData = async (_days: string = 'max'): Promise<CandleData[]> => {
  // Check cache first
  const cached = getCachedCandles();
  if (cached) return cached;

  // Try Binance Vision → Binance → CoinGecko OHLC
  const parseBinanceKlines = (data: any[]): CandleData[] =>
    data
      .map((d: any[]) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[7])
      }))
      .filter((d: CandleData) => !isNaN(d.close) && !isNaN(d.open) && d.close > 0)
      .sort((a: CandleData, b: CandleData) => a.time - b.time);

  try {
    const data = await fetchFirstSuccess([
      `${BINANCE_API}/klines?symbol=BTCUSDT&interval=1d&limit=1000`,
      `${BINANCE_API_FALLBACK}/klines?symbol=BTCUSDT&interval=1d&limit=1000`,
    ]);
    if (!Array.isArray(data)) throw new Error('Not an array');
    const result = parseBinanceKlines(data);
    setCachedCandles(result);
    return result;
  } catch {
    // CoinGecko OHLC fallback (max 365 days for free tier)
    const data = await fetchFirstSuccess([
      `${COINGECKO_API}/coins/bitcoin/ohlc?vs_currency=usd&days=365`,
    ]);
    if (!Array.isArray(data)) throw new Error('Not an array');
    return data
      .map((d: number[]) => ({
        time: d[0],
        open: d[1],
        high: d[2],
        low: d[3],
        close: d[4],
        volume: 0
      }))
      .filter((d: CandleData) => !isNaN(d.close) && d.close > 0)
      .sort((a: CandleData, b: CandleData) => a.time - b.time);
  }
};

// Helper: retry with exponential backoff
const fetchWithRetry = async (url: string, maxRetries: number = 2): Promise<Response> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fetchWithTimeout(url);
    } catch (e) {
      if (i === maxRetries) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 500));
    }
  }
  throw new Error('Unreachable');
};