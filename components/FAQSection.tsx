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
        a: "Simply put: When BTC starts going crazy upward (like a rocket, rising continuously with few major drops), this kind of explosive rise usually lasts about 100 days before reaching a peak, then starts pulling back for a rest. For example, rising from $10k to $70k with almost no significant drops - this 'rapid unilateral rise' should be watched carefully after about 100 days. This is a pattern Wei God (@coolish) discovered through years of observation, successfully predicting 4 BTC cyclical tops."
      },
      {
        q: "2. How to judge the starting point of the 100-day cycle?",
        a: "Look at the white line (EMA15) on the chart: When BTC price breaks above the white line and stays above it consistently, while volume increases significantly and there are many consecutive up days, this could be the start of a new cycle. Important reminder: Don't be 100% certain from the start - gradually increase confidence during the rise. First 30 days: just observe (10% confidence), Days 30-70: start confirming (50%+ confidence), Days 70-100: high alert (highest confidence)."
      },
      {
        q: "3. What do 'Fast Start, Slow End' and 'Slow Start, Fast End' mean?",
        a: "These describe how gains are distributed within the 100 days: Fast Start, Slow End = first 50 days rise aggressively (e.g., +50%), last 50 days rise slowly (e.g., +20%); Slow Start, Fast End = first 50 days rise slowly (e.g., +20%), last 50 days accelerate (e.g., +50%); Uniform Distribution = similar gains in both halves. Wei God observed these patterns rotate, helping identify current cycle characteristics."
      },
      {
        q: "4. How accurate is this theory?",
        a: "Currently 100% accurate! Wei God's 4 publicly predicted cycles all hit: successfully warned of tops around 100 days (±10 days error). But be rational: 1) Sample size still small, needs more validation 2) May fail as more people know about it 3) Can't rely on this method alone, combine with other indicators 4) Past success doesn't guarantee future effectiveness."
      },
      {
        q: "5. What if I missed the first 50 days?",
        a: "No worries at all! Wei God emphasizes: Even if you completely miss the first 50 days, the last 50 days still offer substantial profits. Best strategy: Days 30-70 are the golden entry period - trend is confirmed yet sufficient upside remains. Never FOMO (Fear of Missing Out) and chase blindly in the first 30 days when risk is highest and certainty lowest."
      },
      {
        q: "6. Why hasn't this method failed yet?",
        a: "Wei God's interesting explanation: 99% of market methods are garbage, and these garbage methods actually protect the truly effective 1%. Additionally, this method requires extreme patience and firm conviction to execute - most people can't do it. For example, on day 80 when everyone is celebrating, do you dare believe there are only 20 days left to the top? This anti-human-nature operation is itself a barrier."
      },
      {
        q: "7. What's the scientific basis of this theory?",
        a: "Wei God states this theory integrates sociology, behavioral psychology, communication theory, and game theory. 100 days equals a complete emotional cycle: from FOMO inception, peak to exhaustion; a market narrative propagation cycle; and the critical point of smart money vs retail investor game theory."
      },
      {
        q: "8. How to avoid mechanically counting days?",
        a: "Use 'Bayesian thinking': Observation phase (0-30 days) 10% confidence, Confirmation phase (30-70 days) 50%+ confidence, Warning phase (70-100 days) highest confidence. Focus on weekly-level confirmation, not daily fluctuations, and dynamically adjust probability assessments."
      },
      {
        q: "9. What are the historical success cases?",
        a: "Wei God's 4 publicly predicted cycles: 2023.10.14-2024.1.22 (85-day warning), 2024.1.22-2024.4.29 (60-day warning), 2024.9.7-2024.12.16 (90-day warning), 2025.4.9-2025.7.18 (94-day warning). All successfully issued risk alerts before cycle ends."
      },
      {
        q: "10. Will this theory remain effective in the future?",
        a: "Wei God warns: As the method becomes public and BTC market structure changes (ETFs, institutional participation), effectiveness may decline. Suggestions: 1) Use as auxiliary tool, not sole basis 2) Stay flexible, prepare to iterate strategies 3) Cherish current effectiveness while it lasts."
      }
    ]
  },
  zh: {
    title: "常见问题 (FAQ)",
    items: [
      {
        q: "1. 什么是 BTC 100天周期理论？",
        a: "简单说：当BTC开始疯狂上涨（像火箭一样连续涨，很少大跌），这种疯涨通常持续约100天就会到顶，然后开始回调休息。比如从1万涨到7万，中间几乎不怎么跌，这种'单边快速上涨'大概100天后就该小心了。这是魏神(@coolish)通过多年观察总结的规律，已经成功预测了4次BTC的阶段性顶部。"
      },
      {
        q: "2. 如何判断 100天周期的起点？",
        a: "看图表上的白线（EMA15）：当BTC价格突破白线并且一直在白线上方运行，同时成交量明显增加，连续上涨天数很多，这就可能是一个新周期的开始。重要提醒：不要一开始就100%确定，要在上涨过程中逐步增加信心。前30天只是观察（信心10%），30-70天开始确认（信心50%+），70-100天高度警惕（信心最高）。"
      },
      {
        q: "3. 前快后慢和前慢后快是什么意思？",
        a: "这是涨幅在100天内的分配方式：前快后慢=前50天涨得猛（比如涨50%），后50天涨得慢（比如只涨20%）；前慢后快=前50天涨得慢（比如涨20%），后50天突然加速（比如涨50%）；均匀分布=前后50天涨幅差不多。魏神观察发现这些模式会轮流出现，帮助判断当前周期的特征。"
      },
      {
        q: "4. 这个理论的准确率如何？",
        a: "目前100%准确！魏神公开预测的4个周期全部命中：都在100天左右成功预警了顶部（误差±10天）。但要理性看待：1) 样本还不够多，需要更多验证 2) 随着越来越多人知道，可能会失效 3) 不能只靠这一个方法，要结合其他指标 4) 过去的成功不代表未来一定有效。"
      },
      {
        q: "5. 如果错过了前50天怎么办？",
        a: "完全不用担心！魏神强调：即使前50天完全踏空，后50天依然有丰厚利润。最佳策略：Day 30-70是黄金入场期，这时既确认了趋势，又有足够上涨空间。千万别因为FOMO（害怕错过）在前30天盲目追高，那时风险最大、确定性最低。"
      },
      {
        q: "6. 为什么这个方法还没失效？",
        a: "魏神的解释很有趣：市场上99%的方法都是垃圾，这些垃圾方法反而保护了真正有效的1%方法。另外，这个方法需要极大耐心和坚定信念才能执行，大多数人做不到。比如在第80天，所有人都在狂欢时，你敢相信还有20天就要见顶吗？这种反人性的操作本身就是门槛。"
      },
      {
        q: "7. 这个理论的科学基础是什么？",
        a: "魏神表示这个理论融合了社会学、行为心理学、传播学和博弈论。100天约等于一个完整的情绪周期：从FOMO发酵、高潮到疲惫；一个市场叙事的传播周期；以及聪明钱与散户博弈的临界点。"
      },
      {
        q: "8. 如何避免机械数日子的错误？",
        a: "正确做法是采用'贝叶斯思维'：观察期(0-30天)信心10%，确认期(30-70天)信心50%+，预警期(70-100天)信心最高。重点是周级别确认，不被日线波动干扰，动态调整概率判断。"
      },
      {
        q: "9. 历史上有哪些成功案例？",
        a: "魏神公开预测的4个周期：2023.10.14-2024.1.22(85天预警)、2024.1.22-2024.4.29(60天预警)、2024.9.7-2024.12.16(90天预警)、2025.4.9-2025.7.18(94天预警)。都在周期结束前成功发出风险提示。"
      },
      {
        q: "10. 未来这个理论还会有效吗？",
        a: "魏神警告：随着方法公开和BTC市场结构变化(ETF、机构参与)，有效性可能递减。建议：1)作为辅助工具，不是唯一依据 2)保持灵活性，准备迭代战法 3)且用且珍惜当下的有效性。"
      }
    ]
  }
};