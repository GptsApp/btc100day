import React, { useState } from 'react';
import { FounderRealtimeState, Language } from '../types';
import { BentoCard } from './animata/BentoCard';
import { ExternalLink, ShieldCheck, Flame, ArrowUpRight, ArrowDownRight, Layers, Eye, EyeOff } from 'lucide-react';

interface FounderOrdersPanelProps {
  founderState: FounderRealtimeState | null;
  lang: Language;
  showOnChart: boolean;
  setShowOnChart: (v: boolean) => void;
}

export const FounderOrdersPanel: React.FC<FounderOrdersPanelProps> = ({
  founderState,
  lang,
  showOnChart,
  setShowOnChart,
}) => {
  const isEn = lang === 'en';
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  if (!founderState) return null;

  const { position, orders, buyOrdersTotalSize, sellOrdersTotalSize, buyOrdersAvgPrice, sellOrdersAvgPrice } = founderState;

  const filteredOrders = orders.filter(o => {
    if (filter === 'buy') return o.side === 'B';
    if (filter === 'sell') return o.side === 'A';
    return true;
  });

  const pnlPercent = position && position.entryPrice > 0
    ? ((position.currentPrice - position.entryPrice) / position.entryPrice * 100)
    : 0;

  return (
    <div id="founder-orders">
      <BentoCard className="p-4 md:p-5" glow>
      
      {/* 1. Header Bar: Profile & Address & External Trasia Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1b2230]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
            <Layers className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                <span>@Paulwei</span>
                <span className="text-[#8b949e] font-normal text-xs">{isEn ? '(Founder Real-Time Orders)' : '(100天理论创始人实时挂单)'}</span>
              </h3>
              <span className="text-[10px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                HYPERLIQUID SYNC
              </span>
            </div>
            
            <p className="text-[11px] text-[#8b949e] font-mono flex items-center gap-2">
              <span>0xdae4…f637</span>
              <span>•</span>
              <a
                href={`https://beta.trasia.xyz/perps?watch=${founderState.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#38bdf8] hover:underline flex items-center gap-0.5"
              >
                {isEn ? 'View on Trasia' : '在 Trasia 链上查看'}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Toggle overlay on main chart */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnChart(!showOnChart)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              showOnChart
                ? 'bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]'
                : 'bg-[#121620] border-[#1e2638] text-[#8b949e] hover:text-white'
            }`}
          >
            {showOnChart ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isEn ? (showOnChart ? 'Chart Rails ON' : 'Chart Rails OFF') : (showOnChart ? 'K线挂单轨: 显示' : 'K线挂单轨: 隐藏')}</span>
          </button>
        </div>
      </div>

      {/* 2. Position Snapshot & Real Strategy Stats Bar */}
      {position && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 my-3 text-xs font-mono">
          
          <div className="bg-[#121620] border border-[#1e2638] p-2.5 rounded">
            <div className="text-[10px] text-[#8b949e]">{isEn ? 'ACTIVE POSITION' : '当前实盘持仓'}</div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-baseline gap-1">
              <span>{position.size.toFixed(2)} BTC</span>
              <span className="text-[10px] text-[#8b949e]">(${Math.round(position.positionValue).toLocaleString()})</span>
            </div>
          </div>

          <div className="bg-[#121620] border border-[#1e2638] p-2.5 rounded">
            <div className="text-[10px] text-[#8b949e]">{isEn ? 'ENTRY PRICE' : '建仓均价'}</div>
            <div className="text-sm font-bold text-[#00ff88] mt-0.5">
              ${Math.round(position.entryPrice).toLocaleString()}
            </div>
          </div>

          <div className="bg-[#121620] border border-[#1e2638] p-2.5 rounded">
            <div className="text-[10px] text-[#8b949e]">{isEn ? 'UNREALIZED PnL' : '未实现浮盈'}</div>
            <div className="text-sm font-bold text-[#00ff88] mt-0.5 flex items-baseline gap-1">
              <span>+${Math.round(position.unrealizedPnl).toLocaleString()}</span>
              <span className="text-[10px] font-normal">(+{pnlPercent.toFixed(1)}%)</span>
            </div>
          </div>

          <div className="bg-[#121620] border border-[#1e2638] p-2.5 rounded">
            <div className="text-[10px] text-[#8b949e]">{isEn ? 'LEVERAGE & MARGIN' : '实盘杠杆率'}</div>
            <div className="text-sm font-bold text-white mt-0.5">
              1.18x <span className="text-[10px] text-[#00ff88] font-normal">{isEn ? '(Safe)' : '(极致风控)'}</span>
            </div>
          </div>

          <div className="bg-[#121620] border border-[#1e2638] p-2.5 rounded col-span-2 md:col-span-1">
            <div className="text-[10px] text-[#8b949e]">{isEn ? 'LIQUIDATION PRICE' : '强平价格'}</div>
            <div className="text-sm font-bold text-[#8b949e] mt-0.5">
              ${Math.round(position.liquidationPrice).toLocaleString()}
            </div>
          </div>

        </div>
      )}

      {/* 3. Real Orders Filter & Stats Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 pb-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#1b2230] text-white font-bold' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            {isEn ? `All Orders (${orders.length})` : `全部挂单 (${orders.length})`}
          </button>

          <button
            onClick={() => setFilter('sell')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filter === 'sell' ? 'bg-[#f59e0b]/20 text-[#f59e0b] font-bold border border-[#f59e0b]/30' : 'text-[#8b949e] hover:text-[#f59e0b]'
            }`}
          >
            {isEn ? `Take-Profit (${orders.filter(o => o.side === 'A').length})` : `高位阶梯止盈 (${orders.filter(o => o.side === 'A').length})`}
          </button>

          <button
            onClick={() => setFilter('buy')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              filter === 'buy' ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/30' : 'text-[#8b949e] hover:text-[#38bdf8]'
            }`}
          >
            {isEn ? `EMA15 Bids (${orders.filter(o => o.side === 'B').length})` : `EMA15 回踩接多 (${orders.filter(o => o.side === 'B').length})`}
          </button>
        </div>

        <div className="text-[11px] text-[#8b949e] flex items-center gap-3">
          <span>{isEn ? 'TP Grid Total:' : '止盈挂单合计:'} <strong className="text-white">{sellOrdersTotalSize} BTC</strong> (~${sellOrdersAvgPrice.toLocaleString()})</span>
          <span>•</span>
          <span>{isEn ? 'Bid Grid Total:' : '接多挂单合计:'} <strong className="text-white">{buyOrdersTotalSize} BTC</strong> (~${buyOrdersAvgPrice.toLocaleString()})</span>
        </div>
      </div>

      {/* 4. Orders Visual Grid / Table */}
      <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#1b2230] bg-[#090d15] divide-y divide-[#141a24] text-xs font-mono">
        <div className="grid grid-cols-12 px-3 py-2 text-[10px] text-[#64748b] bg-[#0c1017] sticky top-0 z-10 uppercase tracking-wider">
          <span className="col-span-2">{isEn ? 'DIRECTION' : '方向'}</span>
          <span className="col-span-3">{isEn ? 'PRICE (USDT)' : '挂单价格'}</span>
          <span className="col-span-2">{isEn ? 'SIZE' : '数量 (BTC)'}</span>
          <span className="col-span-2">{isEn ? 'VALUE' : '订单金额'}</span>
          <span className="col-span-3 text-right">{isEn ? '100-DAY CYCLE INTENT' : '周期战术意图'}</span>
        </div>

        {filteredOrders.map(o => {
          const isBuy = o.side === 'B';
          
          let roleTagZh = '逢低加仓网格';
          let roleTagEn = 'Dip Accumulator';
          let badgeColor = 'text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20';

          if (o.cycleRole === 'ema15_defense') {
            roleTagZh = '贴线 EMA15 接针';
            roleTagEn = 'EMA15 Defense Bid';
            badgeColor = 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20';
          } else if (o.cycleRole === 'blowoff_top_exit') {
            roleTagZh = '100天见顶清仓网';
            roleTagEn = '100D Blowoff Exit';
            badgeColor = 'text-[#ff3b69] bg-[#ff3b69]/10 border-[#ff3b69]/20';
          } else if (o.cycleRole === 'ladder_take_profit') {
            roleTagZh = '阶梯式被动止盈';
            roleTagEn = 'Ladder Take Profit';
            badgeColor = 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
          }

          return (
            <div
              key={o.oid}
              className="grid grid-cols-12 px-3 py-2 items-center hover:bg-[#121722] transition-colors"
            >
              {/* Direction */}
              <div className="col-span-2 flex items-center gap-1 font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${isBuy ? 'bg-[#00ff88]' : 'bg-[#f59e0b]'}`}></span>
                <span className={isBuy ? 'text-[#00ff88]' : 'text-[#f59e0b]'}>
                  {isBuy ? (isEn ? 'BUY' : '接多') : (isEn ? 'SELL' : '止盈')}
                </span>
              </div>

              {/* Price */}
              <div className="col-span-3 font-bold text-white flex items-center gap-1">
                <span>${o.price.toLocaleString()}</span>
                {o.price >= 99000 && <span className="text-[9px] text-[#f59e0b] bg-[#f59e0b]/10 px-1 rounded">100k+</span>}
              </div>

              {/* Size */}
              <div className="col-span-2 text-[#cbd5e1]">
                {o.size} BTC
              </div>

              {/* Value */}
              <div className="col-span-2 text-[#8b949e]">
                ${Math.round(o.valueUsd).toLocaleString()}
              </div>

              {/* Strategy Role */}
              <div className="col-span-3 text-right">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeColor}`}>
                  {isEn ? roleTagEn : roleTagZh}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Strategy Philosophy Reflection */}
      <div className="mt-3 p-3 bg-[#10141d] rounded-lg border border-[#1b2332] text-xs font-mono text-[#8b949e] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#00ff88] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white mr-1.5">{isEn ? 'Theory & Execution Alignment:' : '知行合一量化实证：'}</strong>
          {isEn
            ? 'Founder @Paulwei maintains a conservative 1.18x leverage with entry at $68,322 (+$30k PnL). Notice the pre-set 2.35 BTC take-profit ladder from $93k to $104k, strictly obeying the Day 70-100 exit discipline before euphoria peaks.'
            : '魏神实盘持仓 1.78 BTC（成本 $68,322，浮盈超 3 万美元），但总杠杆仅仅维持在 1.18x。最亮眼的是他在 $93,222 ~ $104,222 提前埋设了整整 2.35 BTC 的阶梯止盈卖单网格，在当前 Day 49 提前锁定周期冲顶出逃路径，杜绝贪婪！'}
        </div>
      </div>

    </BentoCard>
    </div>
  );
};
