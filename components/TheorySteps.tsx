import React, { useState } from 'react';
import {
  FileText,
  Compass,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Flame,
  Clock
} from 'lucide-react';
import { Language } from '../types';

interface MethodologyGuideProps {
  lang: Language;
}

export const TheorySteps: React.FC<MethodologyGuideProps> = ({ lang }) => {
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<'sop' | 'lifecycle'>('sop');

  const phases = [
    {
      step: '01',
      phase: isEn ? 'OBSERVATION & GATE' : '第一阶段：观察蓄势与启动闸门',
      window: 'DAY 0 — 30',
      tag: isEn ? 'DUAL-MOMENTUM GATE' : '双动能启动闸门',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      thesis: isEn
        ? 'Price systematically breaks above daily EMA15 and punches through Donchian 20D resistance with expanding volume.'
        : '价格放量突破并有效站稳日线 EMA15 轨道上方，且向上穿透唐奇安 20 日高点，确认非震荡假启动。',
      protocol: isEn
        ? 'Action: Initiate initial long (30% - 50%). Start 100-day cycle timer on Day 0 confirmation. Strictly avoid premature chasing before 20D breakout.'
        : '执行指令：双重动能确认后打入底仓（30% ~ 50%），正式启动 100 天计时器。未突破 20 日高点前严禁盲目重仓。',
      criteria: isEn
        ? ['Daily Close >= EMA15 line', 'Breaks Donchian 20-Day High', '20-Day volume expansion > 1.2x']
        : ['日线收盘价 ≥ EMA15 轨道', '有效突破唐奇安 20 日高点', '20日成交量放大系数 > 1.2x']
    },
    {
      step: '02',
      phase: isEn ? 'GOLDEN CONFIRMATION' : '第二阶段：黄金确认与护城河',
      window: 'DAY 30 — 70',
      tag: isEn ? 'PRIME R/R & MOAT' : '黄金窗口与 ATR 护城河',
      tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      thesis: isEn
        ? 'Trend is fully verified. Shallow intraday tests remain protected by the EMA15 - 1.0 ATR volatility moat.'
        : '右侧主升浪彻底确立。均线回踩由 EMA15 - 1.0 ATR 动态护城河弹性吸收，次日大阳反包确认为假摔诱空。',
      protocol: isEn
        ? 'Action: Optimal risk-adjusted accumulation. On confirmed Spring Reclaims, scale exposure up to 70% - 90%. Hold through noise without panic selling.'
        : '执行指令：全周期胜率最高阶段。洗盘后反包确认即回踩加仓至 70% ~ 90%。守住 ATR 护城河一股不卖。',
      criteria: isEn
        ? ['Close holds above EMA15 - 1.0 ATR', 'Reclaims EMA15 within 48 hours', 'Consecutive days above EMA15 >= 30d']
        : ['日线收盘牢牢守住 ATR 防守线', '均线洗盘 48h 快速反包收复', '均线上方有效连跑天数 ≥ 30 天']
    },
    {
      step: '03',
      phase: isEn ? 'EXHAUSTION WARNING' : '第三阶段：高位预警与狂热逃顶',
      window: 'DAY 70 — 100',
      tag: isEn ? 'SYSTEMATIC EXIT' : 'Pi-Top 监控与梯级离场',
      tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
      thesis: isEn
        ? 'Retail euphoria peaks alongside violent whipsaws. Pi-Cycle Top ratio approaches 0.98. Historical expected value degrades to zero.'
        : '散户狂热情绪见顶，盘面洗盘加剧。Pi-Cycle Top 比值逼近 0.98 临界区，历史数据显示 Day 70 之后期望收益归零。',
      protocol: isEn
        ? 'Action: De-leverage systematically! Deploy passive laddered take-profits (Day 75: -30%, Day 85: -40%, Day 100: Exit 100%). Never add new risk.'
        : '执行指令：坚决去杠杆与分批锁利！执行机械阶梯止盈（Day 75 减 30%、Day 85 减 40%、Day 100 全部清仓），严禁追多。',
      criteria: isEn
        ? ['Cycle Day reaches 70 - 85d', 'Pi-Cycle ratio >= 0.95 warning zone', 'Perpetual basis / funding rate overstretched']
        : ['周期天数跨入 70 - 85 天', 'Pi-Top 比值进入 ≥0.95 预警区', '基差年化与资金费率极端过热']
    },
    {
      step: '04',
      phase: isEn ? 'DORMANT REST PERIOD' : '第四阶段：周期休整与资本保全',
      window: 'DAY 100+',
      tag: isEn ? 'CAPITAL PRESERVATION' : '完全空仓与休整等待',
      tagColor: 'bg-slate-100 text-slate-700 border-slate-200',
      thesis: isEn
        ? 'The 100-day emotional and liquidity loop is exhausted. Asset enters multi-week macro consolidation or severe distribution.'
        : '100 天情绪与杠杆流动性闭环宣告耗尽。价格转入周线级别震荡派发或深幅回撤均线修复。',
      protocol: isEn
        ? 'Action: Hold 100% cash in discipline. Do not gamble on choppy chop or attempt counter-trend bottom fishing before a new cycle sparks.'
        : '执行指令：100% 空仓休息，保住本金与利润。拒绝任何逆势抄底或震荡博弈，静待下一轮周期 Day 0 信号通电。',
      criteria: isEn
        ? ['Elapsed calendar days > 100d', 'True breakdown below EMA15 moat', 'Macro volatility contraction']
        : ['日历天数超过 100 天', '有效击穿 ATR 动态护城河', '周期动能归零转入沉寂']
    }
  ];

  return (
    <div id="theory-steps" className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Header Bar with View Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
            <span>OPERATIONAL DOCTRINE • STANDARD OPERATING PROCEDURE</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {isEn ? 'BTC 100-Day Tactical Operating Handbook' : 'BTC 100 天单边周期战术操作手册'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? 'Aerospace-grade checklist protocol: imperative directives, dynamic volatility moats, deterministic branch criteria, and emergency aborts.'
              : '军工/航天标准工程化作业守则：动作先行、警告前置、ATR 动态护城河与零歧义确定性分支熔断。'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveTab('sop')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isEn ? 'Checklist SOP' : '实战操作手册 (SOP)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lifecycle'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isEn ? '4-Phase Lifecycle' : '四阶段周期总览'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MIL-SPEC STANDARD OPERATING PROCEDURE (SOP) */}
      {activeTab === 'sop' && (
        <div className="space-y-6">

          {/* Section 1: Day 0 Gate */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center">
                  01
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {isEn ? 'PHASE 1: DAY 0 GATEKEEPER & ACTIVATION' : '阶段一：Day 0 周期通电与开仓确认（启动闸门）'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                {isEn ? 'Entry Validation' : '进场过滤验算'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Caution Callout */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>CAUTION 警示：</strong>
                  {isEn
                    ? 'Never commit capital solely on a single-day EMA15 close! Quantitative backtest shows pure EMA15 crosses have a 28.3% false-start rate. Donchian 20D breakout is mandatory.'
                    : '严禁在未突破唐奇安 20D 高点前仅凭单日站上 EMA15 盲目重仓！3300 日回测证实纯 EMA15 假突破率高达 28.3%，必须满足双重确认。'}
                </div>
              </div>

              {/* Step 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                    <span>1. 监控 日线收盘位置 (UTC 8:00 闭合判定)</span>
                  </div>
                  <div className="space-y-1 text-slate-600 pl-3 border-l border-slate-200">
                    <p>• 核验 1.1: 今日收盘价 ≥ 日线 EMA15 轨道价</p>
                    <p>• 核验 1.2: 今日最高价 &gt; 过去 20 日最高价 (Donchian 20D)</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                    <span>2. 执行 状态分支与开仓指令</span>
                  </div>
                  <div className="space-y-1 text-slate-600 pl-3 border-l border-slate-200">
                    <p className="text-emerald-700 font-semibold">• 双核验 PASS: Day 0 确立，首仓开多 30% ~ 50%，计时器设为 Day 1</p>
                    <p className="text-slate-500">• 任一项 FAIL: 判定为震荡杂波，保持空仓，严禁追单</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Day 1-70 Holding & Moat */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  02
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {isEn ? 'PHASE 2: DAY 1 - 70 TREND HOLDING & ATR MOAT' : '阶段二：Day 1 ~ Day 70 顺势持仓与防洗盘（护城河运作）'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                {isEn ? 'Golden Window' : '黄金加仓窗口'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Warning Callout */}
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-lg text-xs text-rose-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>WARNING 警告：</strong>
                  {isEn
                    ? 'Market makers engineer 1-2 violent bear trap sweeps between Day 30 and 50. Strict EMA15 closes cause a 33.6% premature stop-out rate! The EMA15 - 1.0 ATR volatility moat is the ironclad defense line.'
                    : '主力在 Day 30~50 必然发动 1~2 次击穿均线的洗盘扫止损（Bear Trap）。死卡 EMA15 收盘止损有 33.6% 概率直接卖飞在大暴涨前夜，必须以 EMA15 - 1.0 ATR 动态护城河为防守基准。'}
                </div>
              </div>

              {/* Steps 3, 4, 5 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                    <span>3. 设置 动态自适应防守线</span>
                  </div>
                  <div className="space-y-1 text-slate-600 pl-3 border-l border-slate-200 font-sans text-xs">
                    <p className="font-mono text-[11px] font-bold text-slate-800">防守底线 = EMA15 - 1.0 × ATR14</p>
                    <p>每日开盘自动锁定该价位，留出 2%~3% 市场固有日内波动冗余。</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                    <span>4. 处置 盘中击穿与诱空洗盘</span>
                  </div>
                  <div className="space-y-1 text-slate-600 pl-3 border-l border-slate-200 font-sans text-xs">
                    <p><strong>刺破均线但高于底线</strong>：判定为正常洗盘测试，一股不卖。</p>
                    <p className="text-emerald-700"><strong>次日大阳反包收复</strong>：确认为空头陷阱，立即顺势加仓至 70%~90%。</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                    <span>5. 跨越 Day 50 变盘中枢</span>
                  </div>
                  <div className="space-y-1 text-slate-600 pl-3 border-l border-slate-200 font-sans text-xs">
                    <p>50 天为获利盘大换手中枢。若 30 天涨幅已超 +70%（前快后慢型），严禁追高，全面转入持仓防守。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Day 70-100 Exit */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  03
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {isEn ? 'PHASE 3: DAY 70 - 100 SYSTEMATIC EXIT' : '阶段三：Day 70 ~ Day 100 终局离场与狂热逃顶（系统性撤离）'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-semibold">
                {isEn ? 'De-risking Protocol' : '强制减仓规程'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Alert Callout */}
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-lg text-xs text-rose-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>MANDATORY DISCIPLINE 铁律纪律：</strong>
                  {isEn
                    ? 'Past Day 70, historical upward momentum benchmark flattens to zero. Any new position carries negative mathematical expectation. Passive laddered take-profits must be executed regardless of bullish sentiment!'
                    : '进入 Day 70 之后，历史均值向上动能完全走平归零。任何新增开多期望收益率均为负数，必须无视盘面煽动，机械执行梯级离场！'}
                </div>
              </div>

              {/* Ladder Take Profit Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>STEP 1</span>
                    <span className="font-bold text-slate-800">Day 75 ~ 80</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">市价平仓 30% 仓位</div>
                  <p className="text-slate-600 font-sans text-xs">抽回全部初始本金，锁定第一批利润，转为纯浮盈博弈。</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>STEP 2</span>
                    <span className="font-bold text-slate-800">Day 85 ~ 90</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">市价平仓 40% 仓位</div>
                  <p className="text-slate-600 font-sans text-xs">若 Pi-Top 比值 ≥ 0.95 或合约费率高企，坚决落袋，仅留极轻底仓。</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>STEP 3</span>
                    <span className="font-bold text-slate-800">Day 100 到达</span>
                  </div>
                  <div className="font-bold text-sm text-rose-600">无条件清仓剩余 30%</div>
                  <p className="text-slate-600 font-sans text-xs">周期闭环耗尽，不管价格是否创出新高，全部空仓进入 Rest 阶段。</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Aborts Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  04
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {isEn ? 'PHASE 4: DETERMINISTIC EMERGENCY ABORTS' : '阶段四：非正常状态紧急熔断程序（零自由裁量权）'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                {isEn ? 'Risk Protocols' : '硬失效执行表'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-3.5 font-semibold">触发条件 (Trigger Condition)</th>
                    <th className="p-3.5 font-semibold">判定定性 (Classification)</th>
                    <th className="p-3.5 font-semibold">即时处置动作 (Mandatory Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-rose-600">日线收盘价低于 EMA15 - 1.0 ATR 达 48 小时</td>
                    <td className="p-3.5 font-medium">趋势硬失效 (True Breakdown)</td>
                    <td className="p-3.5 font-bold text-slate-900">100% 清仓市价止损，坚决禁止逆势扛单</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-amber-700">单日无预警暴跌 &gt; 5.5% 且成交量放大 &gt; 2.5x</td>
                    <td className="p-3.5 font-medium">异常放量踩踏 (Catastrophic Dip)</td>
                    <td className="p-3.5 font-bold text-slate-900">立即平掉所有浮盈杠杆仓位，转为纯现货观察</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800">Day 30 累计涨幅 &lt; 5% 且均线走平粘合</td>
                    <td className="p-3.5 font-medium">动能衰竭 (Dead Wave)</td>
                    <td className="p-3.5 font-bold text-slate-900">主动平仓保本离场，重置 100 天计时器</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: 4-PHASE LIFECYCLE OVERVIEW */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((p) => (
              <div
                key={p.step}
                className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <span className="text-2xl font-mono font-black text-slate-300">{p.step}</span>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                      {p.window}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${p.tagColor}`}>
                      {p.tag}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                      {p.phase}
                    </h3>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-0.5">
                        {isEn ? 'MARKET PATTERN' : '盘面形态'}
                      </span>
                      <p className="text-slate-700 leading-relaxed font-sans">{p.thesis}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-900 font-bold block mb-0.5">
                        {isEn ? 'ACTION DIRECTIVE' : '作战策略'}
                      </span>
                      <p className="text-slate-900 font-semibold leading-relaxed font-sans">{p.protocol}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] font-mono text-slate-600">
                  {p.criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                      <span className="truncate">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <span>{isEn ? 'GOLDEN DISCIPLINE:' : '核心铁律:'}</span>
            </div>
            <div className="flex-1 text-slate-700 font-sans leading-relaxed">
              {isEn
                ? 'Never FOMO during the early 30 days. Exploit the Day 30-70 Golden Window where risk-reward is optimal. Systematically reduce exposure between Day 70-100.'
                : '前 30 天切莫 FOMO 追高；重仓只做 Day 30-70 黄金确认期；Day 70 之后盈亏比大幅恶化，必须无条件执行分批止盈！'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
