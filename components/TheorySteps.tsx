import React from 'react';
import { Search, CheckCircle2, AlertTriangle, Coffee } from 'lucide-react';
import { Language } from '../types';

interface TheoryStepsProps {
  lang: Language;
}

export const TheorySteps: React.FC<TheoryStepsProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="animated-border mt-6 bg-black/60 backdrop-blur-xl rounded-[24px] p-6 md:p-8 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
      <h3 className="text-xl font-semibold text-white text-shadow mb-8 tracking-tight">{t.title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">

        {t.steps.map((step, idx) => (
          <div key={idx} className="bg-black/20 backdrop-blur-xl rounded-[15px] p-5 border border-white/30 transition-all duration-300 hover:bg-black/30 hover:border-white/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center">
                {React.cloneElement(step.icon, { className: `w-6 h-6 ${step.iconColor}` })}
              </div>
              <div>
                <h4 className="font-bold text-white text-shadow text-base">{step.title}</h4>
                <span className="text-xs font-mono text-white/90 text-shadow">{step.day}</span>
                <div className="w-full h-px bg-white/30 border-t border-dashed border-white/30 mt-2"></div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-purple-400 text-shadow uppercase font-bold tracking-wider mb-1">{lang === 'en' ? 'Check' : '看什么'}</span>
                <p className="text-xs text-white text-shadow leading-relaxed">{step.check}</p>
              </div>
              <div>
                <span className="block text-[10px] text-[#7cff67] text-shadow uppercase font-bold tracking-wider mb-1">{lang === 'en' ? 'Action' : '怎么做'}</span>
                <p className="text-xs text-white text-shadow leading-relaxed">{step.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Core Takeaways */}
      <div className="mt-8 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/30 p-6">
         <h4 className="flex items-center gap-2 font-bold text-white text-shadow mb-4 text-sm uppercase tracking-wide">
            <div className="w-1 h-4 bg-[#7cff67] rounded-full shadow-[0_0_8px_rgba(124,255,103,0.5)]"></div>
            {lang === 'en' ? 'Core Takeaways' : '核心要点'}
         </h4>
         <div className="grid md:grid-cols-2 gap-y-3 gap-x-8">
            {t.takeaways.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 hover:bg-black/20 hover:rounded-lg transition-colors duration-200 backdrop-blur-sm">
                    <div className="w-6 h-6 rounded-full bg-[#7cff67] mt-0.5 shrink-0 shadow-[0_0_8px_rgba(124,255,103,0.5)] flex items-center justify-center">
                        <span className="text-xs font-bold text-black">{i + 1}</span>
                    </div>
                    <p className="text-sm text-white text-shadow leading-relaxed font-medium">{item}</p>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const translations = {
  en: {
    title: "How to Use (Step by Step)",
    steps: [
      {
        title: "Step 1: Observation",
        day: "Day 0-30",
        icon: <Search className="w-5 h-5" />,
        iconColor: "text-blue-400",
        check: "Price > EMA15? Volume up? Consecutive green days?",
        action: "Observe only! Probability uncertain. Don't FOMO."
      },
      {
        title: "Step 2: Confirmation",
        day: "Day 30-70",
        icon: <CheckCircle2 className="w-5 h-5" />,
        iconColor: "text-emerald-400",
        check: "Sustained > EMA15, +20% gain, no prolonged deep EMA15 breaks (consider depth & duration).",
        action: "Best Entry! Even if missed first 50d, still profitable."
      },
      {
        title: "Step 3: Warning",
        day: "Day 70-100",
        icon: <AlertTriangle className="w-5 h-5" />,
        iconColor: "text-amber-400",
        check: "FOMO peaks, high volatility, divergence.",
        action: "Reduce positions. Lock profits. Day 80-100 exit."
      },
      {
        title: "Step 4: Rest",
        day: "Day 100+",
        icon: <Coffee className="w-5 h-5" />,
        iconColor: "text-gray-400",
        check: "Price corrects or consolidates.",
        action: "Wait patiently for next cycle. Don't chase highs."
      }
    ],
    takeaways: [
       "Even if you miss the first 50 days, the last 50 days are still profitable - Don't give up.",
       "Day 30-70 is the best entry timing - High confirmation and sufficient space.",
       "Day 70-100 Reduce positions gradually - Better to earn less than lose.",
       "Day 100+ Wait patiently - Do not chase highs, wait for next opportunity."
    ]
  },
  zh: {
    title: "如何使用 100天理论 (Step by Step)",
    steps: [
      {
        title: "Step 1: 观察期",
        day: "Day 0-30",
        icon: <Search className="w-5 h-5" />,
        iconColor: "text-blue-400",
        check: "价格是否突破EMA15白线？成交量是否放大？连续上涨天数是否增加？观察价格在EMA15上方的天数。看成交量柱状图是否明显增加",
        action: "不要急着入场！概率不确定，耐心观察。"
      },
      {
        title: "Step 2: 确认期",
        day: "Day 30-70",
        icon: <CheckCircle2 className="w-5 h-5" />,
        iconColor: "text-emerald-400",
        check: "连续在EMA15上方，涨幅>20%，未长期深度跌破EMA15（考虑跌破幅度和持续时长），成交量持续放大",
        action: "最佳入场时机！即使前50天踏空，后50天仍有肉吃。"
      },
      {
        title: "Step 3: 预警期",
        day: "Day 70-100",
        icon: <AlertTriangle className="w-5 h-5" />,
        iconColor: "text-amber-400",
        check: "接近100天，FOMO情绪高涨，高位震荡。",
        action: "逐步减仓，锁定利润！例如：Day 80减30%，Day 90减30%，Day 100清仓。或者换小额账户轻仓参与。"
      },
      {
        title: "Step 4: 休息期",
        day: "Day 100+",
        icon: <Coffee className="w-5 h-5" />,
        iconColor: "text-gray-400",
        check: "100天后低度参与，等待回调。",
        action: "耐心等待下一次机会。复盘学习，不要乱操作。"
      }
    ],
    takeaways: [
       "即使前50天踏空，后50天仍有足够的肉吃 - 不要因为错过开头而放弃",
       "Day 30-70是最佳入场时机 - 既有确认度，又有足够空间",
       "Day 70-100逐步减仓 - 宁可少赚，不要贪心",
       "Day 100+耐心等待 - 不要追高，等下一次机会"
    ]
  }
};