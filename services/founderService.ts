import type { FounderRealtimeState, FounderLiveOrder, FounderLivePosition, MicrostructureData } from '../types';

export const FOUNDER_ADDRESS = '0xdae4df7207feb3b350e4284c8efe5f7dac37f637';
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info';

const CACHE_KEY = 'btc100_founder_live_cache';
const CACHE_TTL = 30 * 1000; // 30s cache

export const fetchFounderRealtimeState = async (): Promise<FounderRealtimeState | null> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.updatedAt < CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch {
    // ignore
  }

  try {
    const [ordersRes, stateRes, metaRes] = await Promise.all([
      fetch(HYPERLIQUID_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'frontendOpenOrders',
          user: FOUNDER_ADDRESS,
        }),
      }),
      fetch(HYPERLIQUID_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: FOUNDER_ADDRESS,
        }),
      }),
      fetch(HYPERLIQUID_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs',
        }),
      }).catch(() => null),
    ]);

    if (!ordersRes.ok || !stateRes.ok) {
      throw new Error(`API fetch error: orders ${ordersRes.status}, state ${stateRes.status}`);
    }

    const rawOrders = await ordersRes.json();
    const rawState = await stateRes.json();
    let rawMeta: any = null;
    if (metaRes && metaRes.ok) {
      try {
        rawMeta = await metaRes.json();
      } catch {
        // ignore
      }
    }

    // Microstructure extraction from Hyperliquid BTC context
    let microstructure: MicrostructureData | undefined = undefined;
    if (Array.isArray(rawMeta) && rawMeta.length >= 2 && Array.isArray(rawMeta[0]?.universe) && Array.isArray(rawMeta[1])) {
      const universe = rawMeta[0].universe;
      const btcIdx = universe.findIndex((u: any) => u.name === 'BTC');
      if (btcIdx !== -1 && rawMeta[1][btcIdx]) {
        const ctx = rawMeta[1][btcIdx];
        const funding = parseFloat(ctx.funding || '0');
        const annualized = funding * 3 * 365 * 100;
        const oi = parseFloat(ctx.openInterest || '0');
        const markPx = parseFloat(ctx.markPx || ctx.oraclePx || '86000');
        const oiUsd = (oi * markPx) / 1e6; // in millions
        const premium = parseFloat(ctx.premium || '0') * 100;

        let leverageRiskLevel: MicrostructureData['leverageRiskLevel'] = 'low';
        if (annualized > 50) leverageRiskLevel = 'extreme';
        else if (annualized > 25) leverageRiskLevel = 'overheated';
        else if (annualized > 10) leverageRiskLevel = 'moderate';

        microstructure = {
          fundingRate: funding,
          fundingAnnualized: Number(annualized.toFixed(2)),
          openInterestBtc: Math.round(oi),
          openInterestUsd: Math.round(oiUsd),
          premiumIndex: Number(premium.toFixed(3)),
          cvd24hTrend: funding >= 0 ? 'accumulating' : 'neutral',
          leverageRiskLevel,
          liquidationMagnetAbove: Math.round(markPx * 1.045),
          liquidationMagnetBelow: Math.round(markPx * 0.955),
        };
      }
    }

    // Parse Position
    let position: FounderLivePosition | null = null;
    if (rawState?.assetPositions) {
      const btcPos = rawState.assetPositions.find((p: any) => p?.position?.coin === 'BTC')?.position;
      if (btcPos) {
        const szi = parseFloat(btcPos.szi || '0');
        const entryPx = parseFloat(btcPos.entryPx || '0');
        const posVal = parseFloat(btcPos.positionValue || '0');
        const unPnl = parseFloat(btcPos.unrealizedPnl || '0');
        const roe = parseFloat(btcPos.returnOnEquity || '0');
        const liqPx = parseFloat(btcPos.liquidationPx || '0');
        const lev = btcPos.leverage?.value || 3;
        const margin = parseFloat(btcPos.marginUsed || '0');
        const equity = parseFloat(rawState.marginSummary?.accountValue || '0');

        position = {
          coin: 'BTC',
          size: szi,
          entryPrice: entryPx,
          currentPrice: szi !== 0 ? (posVal / szi) : 0,
          positionValue: posVal,
          unrealizedPnl: unPnl,
          returnOnEquity: roe,
          liquidationPrice: liqPx,
          leverage: lev,
          marginUsed: margin,
          accountEquity: equity,
        };
      }
    }

    // Parse and categorize 25 orders in light of the 100-Day Bull Run Theory
    const orders: FounderLiveOrder[] = (Array.isArray(rawOrders) ? rawOrders : []).map((o: any) => {
      const px = parseFloat(o.limitPx || '0');
      const sz = parseFloat(o.sz || '0');
      const origSz = parseFloat(o.origSz || '0');
      const side = o.side as 'B' | 'A';
      const val = px * sz;

      // Assign role in the 100-Day Lifecycle
      let cycleRole: FounderLiveOrder['cycleRole'] = 'dip_accumulator';
      if (side === 'B') {
        if (px >= 82000) {
          cycleRole = 'ema15_defense'; // Near EMA15 line (~83.6k)
        } else {
          cycleRole = 'dip_accumulator'; // 66k - 80k breakout supports
        }
      } else {
        if (px >= 99000) {
          cycleRole = 'blowoff_top_exit'; // 99k - 104k 100-day parabolic exhaustion
        } else {
          cycleRole = 'ladder_take_profit'; // 88k - 98k systematic TP
        }
      }

      return {
        oid: o.oid,
        coin: o.coin,
        side,
        price: px,
        size: sz,
        origSize: origSz,
        timestamp: o.timestamp,
        orderType: o.orderType || 'Limit',
        reduceOnly: !!o.reduceOnly,
        valueUsd: val,
        cycleRole,
      };
    }).sort((a, b) => a.price - b.price);

    const buyOrders = orders.filter(o => o.side === 'B');
    const sellOrders = orders.filter(o => o.side === 'A');

    const buyOrdersTotalSize = buyOrders.reduce((sum, o) => sum + o.size, 0);
    const sellOrdersTotalSize = sellOrders.reduce((sum, o) => sum + o.size, 0);

    const buyOrdersAvgPrice = buyOrdersTotalSize > 0
      ? buyOrders.reduce((sum, o) => sum + o.price * o.size, 0) / buyOrdersTotalSize
      : 0;

    const sellOrdersAvgPrice = sellOrdersTotalSize > 0
      ? sellOrders.reduce((sum, o) => sum + o.price * o.size, 0) / sellOrdersTotalSize
      : 0;

    // Parse and aggregate recent 3-month fills (group same oid + price to merge split fills)
    const rawFillsList: any[] = Array.isArray(rawFills)
      ? rawFills.filter((f: any) => f && f.coin === 'BTC' && f.time >= threeMonthsAgo)
      : [];

    const mergedFillsMap = new Map<string, FounderLiveFill>();
    rawFillsList.forEach((f: any) => {
      const px = parseFloat(f.px || '0');
      const sz = parseFloat(f.sz || '0');
      const pnl = parseFloat(f.closedPnl || '0');
      const fee = parseFloat(f.fee || '0');
      const side = (f.side === 'A' ? 'A' : 'B') as 'B' | 'A';
      const oid = Number(f.oid || f.tid || f.time);
      const key = `${oid}_${px}`;

      const existing = mergedFillsMap.get(key);
      if (existing) {
        existing.size = Number((existing.size + sz).toFixed(5));
        existing.valueUsd = existing.price * existing.size;
        existing.closedPnl = Number((existing.closedPnl + pnl).toFixed(2));
        existing.fee = Number((existing.fee + fee).toFixed(4));
        if (f.time > existing.timestamp) existing.timestamp = f.time;
      } else {
        mergedFillsMap.set(key, {
          tid: Number(f.tid || f.time),
          oid,
          coin: f.coin || 'BTC',
          side,
          dir: f.dir || (side === 'B' ? 'Open Long' : 'Close Long'),
          price: px,
          size: Number(sz.toFixed(5)),
          valueUsd: px * sz,
          closedPnl: Number(pnl.toFixed(2)),
          fee: Number(fee.toFixed(4)),
          timestamp: Number(f.time),
          hash: f.hash || '',
        });
      }
    });

    const fills: FounderLiveFill[] = Array.from(mergedFillsMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const buyFills = fills.filter(f => f.side === 'B');
    const sellFills = fills.filter(f => f.side === 'A');

    const recentFillsBuySize = buyFills.reduce((sum, f) => sum + f.size, 0);
    const recentFillsSellSize = sellFills.reduce((sum, f) => sum + f.size, 0);

    const recentFillsBuyAvgPrice = recentFillsBuySize > 0
      ? buyFills.reduce((sum, f) => sum + f.price * f.size, 0) / recentFillsBuySize
      : 0;

    const recentFillsSellAvgPrice = recentFillsSellSize > 0
      ? sellFills.reduce((sum, f) => sum + f.price * f.size, 0) / recentFillsSellSize
      : 0;

    const recentFillsRealizedPnl = fills.reduce((sum, f) => sum + f.closedPnl, 0);

    const result: FounderRealtimeState = {
      address: FOUNDER_ADDRESS,
      position,
      orders,
      fills,
      buyOrdersTotalSize: Number(buyOrdersTotalSize.toFixed(4)),
      sellOrdersTotalSize: Number(sellOrdersTotalSize.toFixed(4)),
      buyOrdersAvgPrice: Math.round(buyOrdersAvgPrice),
      sellOrdersAvgPrice: Math.round(sellOrdersAvgPrice),
      recentFillsBuySize: Number(recentFillsBuySize.toFixed(4)),
      recentFillsSellSize: Number(recentFillsSellSize.toFixed(4)),
      recentFillsBuyAvgPrice: Math.round(recentFillsBuyAvgPrice),
      recentFillsSellAvgPrice: Math.round(recentFillsSellAvgPrice),
      recentFillsRealizedPnl: Number(recentFillsRealizedPnl.toFixed(2)),
      updatedAt: Date.now(),
      microstructure,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, updatedAt: Date.now() }));
    } catch {
      // ignore
    }

    return result;
  } catch (err) {
    console.error('Failed to fetch real-time Hyperliquid state:', err);
    return null;
  }
};
