import React, { useState } from 'react';
import { Sparkles, Loader2, Play, Eraser } from 'lucide-react';
import { MarketStats, CandleData, Language } from '../types';
import { generateMarketInsight } from '../services/geminiService';

interface InsightCardProps {
  stats: MarketStats | null;
  history: CandleData[];
  lang: Language;
}

export const InsightCard: React.FC<InsightCardProps> = ({ stats, history, lang }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleGenerate = async () => {
    if (!stats || history.length === 0) return;
    setLoading(true);
    const result = await generateMarketInsight(stats, history, lang); 
    setInsight(result);
    setLoading(false);
  };

  return (
    <div id="insight" className="animated-border bg-black/60 backdrop-blur-xl rounded-[24px] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col md:flex-row min-h-[320px] relative">
      {/* Left Prompt Area */}
      <div className="w-full md:w-[35%] p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col relative group">
        
        <div className="flex-1">
           <div className="w-12 h-12 bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center text-[#7cff67] mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold text-white text-shadow mb-3 tracking-tight">{t.title}</h3>
           <p className="text-sm text-white/90 text-shadow leading-relaxed">
             {t.description}
           </p>
        </div>
        
        <div className="mt-8">
           <button 
            onClick={handleGenerate}
            disabled={loading || !stats}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white text-sm font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg relative overflow-hidden border border-white/20 hover:border-white/30"
          >
            {loading ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span>{t.buttonLoading}</span>
                </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t.button}</span>
                </>
            )}
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-full md:w-[65%] p-8 relative flex flex-col">
        {insight ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
             <div className="flex items-center justify-between mb-5">
               <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-[#7cff67]" />
                   <span className="text-xs font-bold text-white text-shadow uppercase tracking-wider">DeepSeek V3.2</span>
               </div>
               <span className="text-[10px] text-white/60 font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md border border-white/20">{new Date().toLocaleTimeString()}</span>
             </div>

             <div className="prose prose-sm max-w-none leading-7 flex-grow font-sans text-white">
               <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-base">
                 <p className="whitespace-pre-wrap text-shadow">{insight}</p>
               </div>
             </div>
             
             <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                    onClick={() => setInsight(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-black/30 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                >
                    <Eraser className="w-3.5 h-3.5" />
                    {t.clear}
                </button>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/20 rounded-2xl bg-black/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/20">
                <Sparkles className="w-6 h-6 text-white/60" />
            </div>
            <h4 className="text-white text-shadow font-medium mb-1 text-sm">{t.placeholderTitle}</h4>
            <p className="text-white/80 text-shadow max-w-xs text-xs">{t.placeholder}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const translations = {
    en: {
        title: "AI Market Analyst",
        description: "Analyze the current trend against the '100-Day Bull Run' theory criteria (rapid unilateral rise, volume, sentiment) using DeepSeek V3.2.",
        button: "Generate Analysis",
        buttonLoading: "Thinking...",
        placeholderTitle: "AI Analysis Ready",
        placeholder: "Click 'Generate Analysis' to get real-time insights based on current market structure.",
        clear: "Clear"
    },
    zh: {
        title: "AI 市场分析师",
        description: "使用 DeepSeek V3.2 根据\"100天牛市\"理论标准（单边快速上涨、成交量、情绪）分析当前趋势。",
        button: "生成分析报告",
        buttonLoading: "正在思考...",
        placeholderTitle: "等待指令",
        placeholder: "点击左侧按钮，获取基于当前市场结构的实时AI分析。",
        clear: "清除"
    }
};