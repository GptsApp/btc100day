import React, { useState } from 'react';
import { Plus, Minus, HelpCircle, FileText } from 'lucide-react';
import { Language } from '../types';

interface FAQSectionProps {
  lang: Language;
}

interface FAQItemViewProps {
  index: number;
  question: string;
  answer: React.ReactNode;
}

const FAQItemView: React.FC<FAQItemViewProps> = ({ index, question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-b border-slate-200 transition-colors ${isOpen ? 'bg-slate-50/50' : 'bg-transparent'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-2 flex items-center justify-between text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400 font-medium">[{String(index).padStart(2, '0')}]</span>
          <span className={`font-sans text-sm md:text-base font-semibold tracking-tight transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-950'}`}>
            {question}
          </span>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors shrink-0 ml-4 ${isOpen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-2 pb-5 pt-1 text-slate-600 text-sm font-sans leading-relaxed">
          <div className="pl-7 pr-4 border-l-2 border-slate-900">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

export const FAQSection: React.FC<FAQSectionProps> = ({ lang }) => {
  const content = contentData[lang];

  return (
    <div id="faq" className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Research Paper Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
            <span>RESEARCH METHODOLOGY • EVIDENCE & AUDIT</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {content.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {lang === 'en'
              ? 'Empirical backtests, 3-filter liquidation protection mechanics, and quantitative verification parameters.'
              : '实盘量化回测数据支撑、三维防假摔诱空过滤引擎及核心风控逻辑释疑。'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>SOURCE AUDIT</span>
          <strong className="text-slate-900">BINANCE 1D OHLC</strong>
        </div>
      </div>

      {/* Accordion List */}
      <div className="divide-y divide-slate-100">
        {content.items.map((item, idx) => (
          <FAQItemView key={idx} index={idx + 1} question={item.q} answer={item.a} />
        ))}
      </div>

    </div>
  );
};

const contentData = {
  en: {
    title: "Quantitative Methodology & Backtest Inquiries",
    items: [
      {
        q: "What is the BTC 100-Day Parabolic Bull Run Theory?",
        a: "The BTC 100-Day Cycle Theory defines an empirical pattern: when Bitcoin initiates a single-sided parabolic bull wave above daily EMA15, momentum persists for ~100 trading days (historical spans: 99 to 101 days) before entering exhaustion. Rooted in sociological narrative diffusion, investor sentiment fatigue, and market liquidity exhaustion."
      },
      {
        q: "What are the empirical backtest findings across Cycle 1, 2, and 3?",
        a: "Our empirical Binance backtest verifies: 1) Span: Cycle 1 was 101 days (+82.4%), Cycle 2 was 99 days (+86.5%), Cycle 3 was 101 days (+99.0%). 2) EMA15 Dominance: Bitcoin stays above daily EMA15 for 72% - 83% of each cycle. 3) Unbroken Streaks: Every cycle exhibits a sustained 30-50 day streak without deep breaks. 4) Space Ceiling: Total cycle gain consistently caps at +80% ~ +100%, and win-rate collapses past Day 70."
      },
      {
        q: "How does the 3-Filter Engine protect against shakeouts like Sept 10-18?",
        a: "Market makers routinely engineer liquidity sweeps around EMA15. The terminal implements a 3-Filter Engine: 1) Buffer Zone (±2.0%): Shallow tests do not terminate the streak. 2) 2-Day Close Rule: A breakdown requires 2 consecutive daily closes below EMA15 to confirm. 3) Reclaim Velocity: Dips quickly reclaimed within 24-48h (e.g. Sept 11-12 & Sept 16-17) are confirmed as Bear Trap Springs, triggering aggressive buying rather than stop-outs."
      },
      {
        q: "How do 'Fast Start, Slow End' vs 'Slow Start, Fast End' dictate trade plans?",
        a: "Cycle 2 was 'Fast Start, Slow End' (surged +75% in first 50 days, then spent 50 days in wide chop). Cycle 3 was 'Slow Start, Fast End' (grinded near EMA15 for 30 days (+15%), then accelerated vertically to $107k (+99%)). Identifying rotation patterns prevents chasing late moves."
      },
      {
        q: "What is the ironclad Invalidation Level?",
        a: "The quantitative invalidation trigger is displayed on the dashboard: a daily close 2% below daily EMA15 that fails to reclaim within 48 hours. When fired, the 100-day single-sided premise is invalid, and capital preservation takes absolute priority."
      },
      {
        q: "How do the 3 Pillars (Donchian 20D, ATR 14 Moat, Pi-Top) augment the 100-Day Theory?",
        a: "Based on 3,300+ daily bars backtest: 1) Donchian 20D Breakout filters 28.3% false starts, lifting win-rate to 58.6% and tripling 30d avg gain (+4.0% → +10.6%). 2) ATR 14 Moat (EMA15 - 1.0 ATR) prevents 33.6% shakeout premature exits, extending holding to 40.5 days and boosting profit factor to 5.08 (+17.0% avg gain). 3) Pi Cycle Top ratio (111SMA / 2*350SMA >= 0.98) provides a systemic euphoria tripwire past Day 70 to enforce systematic profit-taking before major crashes."
      }
    ]
  },
  zh: {
    title: "量化实测数据支撑与规则答疑",
    items: [
      {
        q: "什么是 BTC 100 天单边周期理论？",
        a: "BTC 100天周期理论揭示了一个客观规律：当比特币进入单边快速主升浪（价格稳定踩在日线 EMA15 上方）时，爆发性动能通常持续约 100 天（历史实测为 99 至 101 天）见顶，随后进入休整期。其本质是行为心理学、传播学与市场杠杆博弈的情绪周期极限。"
      },
      {
        q: "Cycle 1、Cycle 2、Cycle 3 的真实量化回测证据是什么？",
        a: "我们调取币安完整日线数据回测证实：1) 周期跨度极度严格：Cycle 1 为 101天(+82.4%)，Cycle 2 为 99天(+86.5%)，Cycle 3 为 101天(+99.0%)。2) EMA15上方天数占比高达 72% ~ 83%，说明主升浪绝大多数时间不破线。3) 黄金连涨波段：每轮必然存在一段 30~50 天几乎不破线的极强单边。4) 空间天花板效应：累积涨幅触及 +80%~+100% 或日历来到 Day 70 之后，盈亏比断崖式恶化。"
      },
      {
        q: "面对 9.10 - 9.18 类型的均线跌破诱空，系统如何精准过滤？",
        a: "实战中主力频繁在关键均线打出插针诱空（Liquidity Sweep）。系统引入三维过滤引擎：1) 缓冲引力带（±2.0%）：收盘偏离不超过2%视为贴线洗盘，不盲目打断计数。2) 双日收盘原则（2-Day Close Rule）：必须连续2个交易日收盘价有效击穿，才确认破位。3) 反包动能验证：若前一日微幅跌破，次日立刻以大阳线收复（如历史 9.11-9.12 及 9.16-9.17），系统判定为空头陷阱（Bear Trap Spring），不仅不认赔，反而是最佳顺势加仓买点。"
      },
      {
        q: "前快后慢和前慢后快在实战中如何指导开单？",
        a: "前快后慢（如 Cycle 2）：前 50 天暴涨 +75%，透支了后半场空间，后 50 天在高位巨幅洗盘震荡；前慢后快（如 Cycle 3）：前 30 天贴着 EMA15 磨盘洗盘仅涨 +15%，第 40 天开始主升浪垂直加速拉升至 +99%。识别当前周期的节奏，能彻底避免在后半段追高被套。"
      },
      {
        q: "交易员必须恪守的理论硬失效防守线是什么？",
        a: "看板右侧战术简报中实时更新'理论硬失效价格'（当前为日线 EMA15 下方 2%）。若日线收盘连续击穿该价位且 48 小时内无法收复，判定 100 天单边假设失效，必须无条件执行止损避险纪律。"
      },
      {
        q: "三大实战指标（唐奇安 20D、ATR 动态护城河、Pi-Top）如何给理论护航？",
        a: "基于 3300 根全量日线回测证实：1) 唐奇安 20D 通道突破过滤掉了 28.3% 的假启动震荡，使 30 天平均收益从 +4.0% 暴增至 +10.6%，胜率升至 58.6%；2) ATR 14 动态护城河（EMA15 - 1.0 ATR）避免了 33.6% 盘中洗盘被甩下车，将平均持仓期从 14.9 天延长至 40.5 天，盈亏比高达 5.08，单笔平均收益从 +5.8% 跃升至 +17.0%；3) Pi-Cycle 极值比（>=0.98）在 Day 70 之后提供硬核逃顶预警，防范单边终局 -40%+ 的断崖踩踏。"
      }
    ]
  }
};
