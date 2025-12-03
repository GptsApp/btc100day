import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { Language } from '../types';

interface FAQSectionProps {
  lang: Language;
}

interface FAQItemViewProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItemView: React.FC<FAQItemViewProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-2xl mb-3 overflow-hidden bg-black/30 backdrop-blur-sm ${isOpen ? 'border-[#7cff67]/30 shadow-[0_4px_12px_rgba(124,255,103,0.1)]' : 'border-white/20'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-black/20 backdrop-blur-sm group cursor-pointer hover:bg-black/40"
      >
        <span className={`font-medium text-[15px] transition-colors text-shadow ${isOpen ? 'text-[#7cff67]' : 'text-white group-hover:text-white/90'}`}>{question}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[#7cff67]/20 text-[#7cff67]' : 'bg-white/20 text-white/60 group-hover:bg-white/30 group-hover:text-white/80'}`}>
           {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </div>
      </button>
      <div
        className={`px-5 text-white text-shadow text-sm leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-1 border-t border-white/10">
           {answer}
        </div>
      </div>
    </div>
  );
};

export const FAQSection: React.FC<FAQSectionProps> = ({ lang }) => {
  const content = contentData[lang];

  return (
    <div id="faq" className="mt-8 mb-12">
      <div className="flex items-center gap-2 mb-6 px-1">
         <div className="p-1.5 bg-black/30 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
             <HelpCircle className="w-4 h-4 text-[#7cff67]" />
         </div>
         <h2 className="text-xl font-semibold text-white text-shadow tracking-tight">{content.title}</h2>
      </div>
      <div>
        {content.items.map((item, idx) => (
          <FAQItemView key={idx} question={item.q} answer={item.a} />
        ))}
      </div>
    </div>
  );
};

const contentData = {
  en: {
    title: "Common Questions (FAQ)",
    items: [
      {
        q: "1. What is the BTC 100-Day Cycle Theory?",
        a: "Wei God (@coolish) observed that when BTC starts a rapid unilateral rise, it often peaks around 100 days. This isn't about mechanically counting days, but a probabilistic judgment method based on behavioral psychology and market laws."
      },
      {
        q: "2. How to judge the starting point of the 100-day cycle?",
        a: "Key criteria: 1) Price breaks and sustains above the EMA15 white line. 2) Rapid unilateral rise with few deep pullbacks. 3) Volume increases. 4) High percentage of consecutive up days. This needs to be dynamically confirmed using a Bayesian perspective, not just counting days."
      },
      {
        q: "3. What do 'Fast Start, Slow End' and 'Slow Start, Fast End' mean?",
        a: "These are distribution patterns of gains within the 100 days. 'Fast Start, Slow End': Big gains in the first 50 days, oscillation later. 'Slow Start, Fast End': Accumulation in the first 50 days, acceleration later. 'Uniform Distribution': Balanced gains. History shows these patterns tend to alternate."
      },
      {
        q: "4. How accurate is this theory?",
        a: "According to the 4 cycles publicly predicted by Wei God, all successfully identified peak time windows (within ±10 days error). However, note: 1) Small sample size. 2) Effectiveness may decrease as it becomes public. 3) Must be used with other analysis tools."
      },
      {
        q: "5. What if I missed the first 50 days?",
        a: "Don't worry! Even if you miss the first 50 days, the second 50 days often offer enough profit. Days 30-70 are the best entry window—offering both trend confirmation and sufficient remaining space. Don't FOMO in blindly during Days 0-30."
      },
      {
        q: "6. Why hasn't this method failed yet?",
        a: "Wei God believes: 'Ineffective methods are camouflage for effective ones.' There is too much market noise. Truly understanding and executing this method requires patience and conviction, which acts as a moat. However, as public awareness grows, its future effectiveness may diminish."
      }
    ]
  },
  zh: {
    title: "常见问题 (FAQ)",
    items: [
      {
        q: "1. 什么是 BTC 100天周期理论？",
        a: "魏神(@coolish)通过观察发现，BTC在单边快速上涨时，往往能在约100天左右拉出阶段性高点。这不是机械数日子，而是一种基于行为心理学和市场规律的概率判断方法。"
      },
      {
        q: "2. 如何判断 100天周期的起点？",
        a: "关键标准：1) 价格突破并持续在EMA15白线上方运行 2) 单边快速上涨，少有深度回调 3) 成交量配合放大 4) 连续上涨天数占比高。需要用贝叶斯视角动态确认，而不是机械数日子。"
      },
      {
        q: "3. 前快后慢和前慢后快是什么意思？",
        a: "这是100天周期内涨幅分布的模式。前快后慢：前50天涨幅大，后50天震荡；前慢后快：前50天蓄力，后50天加速；均匀分布：前后50天涨幅相当。历史显示这些模式会交替出现。"
      },
      {
        q: "4. 这个理论的准确率如何？",
        a: "根据魏神公开的4个周期，都成功预测了高点时间窗口（误差在±10天内）。但要注意：1) 样本量较小 2) 随着公开程度提高，有效性可能递减 3) 需要结合其他分析工具综合判断。"
      },
      {
        q: "5. 如果错过了前50天怎么办？",
        a: "不要紧！即使前50天踏空，后50天仍有足够的肉吃。Day 30-70是最佳入场时机，既有确认度，又有足够上涨空间。不要因为FOMO而在Day 0-30盲目入场。"
      },
      {
        q: "6. 为什么这个方法还没失效？",
        a: "魏神认为：效果差的方法是效果好方法的'保护色'。市场噪音太多，真正理解并执行这个方法需要耐心和信念，这个门槛本身就是护城河。但随着公开程度提高，未来有效性可能递减。"
      }
    ]
  }
};