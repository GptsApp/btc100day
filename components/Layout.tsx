import React, { ReactNode, useState } from 'react';
import { Languages, Menu, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { Language } from '../types';
import { DotBackground } from './animata/DotBackground';

interface LayoutProps {
  children: ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, lang, setLang }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[lang];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const rootElement = document.getElementById('root');

      if (rootElement) {
        const elementRect = element.getBoundingClientRect();
        const rootRect = rootElement.getBoundingClientRect();
        const scrollTop = rootElement.scrollTop;
        const targetPosition = scrollTop + elementRect.top - rootRect.top - offset;

        rootElement.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleNavClick = (id: string) => {
    scrollToSection(id);
    setIsMenuOpen(false);
  };

  return (
    <DotBackground>
      <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#f8fafc]">
        
        {/* Institutional Research Journal Header */}
        <header className="sticky top-0 z-50 h-[64px] border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
            
            {/* Left: Publication Meta & Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  const rootElement = document.getElementById('root');
                  if (rootElement) rootElement.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-xs">
                  <span className="font-mono font-black text-[11px] flex items-center justify-center gap-0.5">
                    <span className="mt-[1px]">1</span>
                    <span className="inline-block -rotate-90 text-sm">B</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900 tracking-tight font-mono leading-tight">BTC100.DAY</span>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">Institutional Research</span>
                </div>
              </div>

              {/* Research Volume / Meta pill */}
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-[11px] font-mono text-slate-500">
                <span className="font-semibold text-slate-700">MACRO DISPATCH</span>
                <span>•</span>
                <span>OCTOBER 2026</span>
              </div>
            </div>

            {/* Middle Nav: Understated Editorial Typography */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
              <button
                onClick={() => scrollToSection('chart')}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t.nav.chart}
              </button>
              <button
                onClick={() => scrollToSection('cycle-overlay')}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t.nav.overlay}
              </button>
              <button
                onClick={() => scrollToSection('theory-steps')}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t.nav.steps}
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t.nav.faq}
              </button>
            </nav>

            {/* Right Side: External Real-Time Feeds */}
            <div className="flex items-center gap-3">
              <a
                href="https://beta.trasia.xyz/perps?watch=0xdae4df7207feb3b350e4284c8efe5f7dac37f637"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-mono text-slate-700 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Trasia 实盘链上数据</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs font-mono text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
              >
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'en' ? 'EN' : '中'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile menu sheet */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)}>
            <div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 border-t border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => handleNavClick('chart')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-900 font-medium"
                >
                  {t.nav.chart}
                </button>
                <button
                  onClick={() => handleNavClick('cycle-overlay')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-900 font-medium"
                >
                  {t.nav.overlay}
                </button>
                <button
                  onClick={() => handleNavClick('theory-steps')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-900 font-medium"
                >
                  {t.nav.steps}
                </button>
                <button
                  onClick={() => handleNavClick('faq')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-900 font-medium"
                >
                  {t.nav.faq}
                </button>
              </div>

              <a
                href="https://beta.trasia.xyz/perps?watch=0xdae4df7207feb3b350e4284c8efe5f7dac37f637"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono text-slate-700"
              >
                <span>查看 @Paulwei 链上实盘</span>
              </a>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 py-6 md:py-8 relative z-10">
          <div className="px-4 md:px-8 max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </main>
        
        {/* Research Footer */}
        <footer className="py-8 border-t border-slate-200/90 bg-white text-xs font-mono text-slate-500">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div>
              <span className="font-bold text-slate-800">BTC100.DAY RESEARCH DISPATCH</span>
              <span className="mx-2">•</span>
              <span>Theory founded by <a href="https://x.com/coolish" target="_blank" rel="noreferrer" className="text-slate-900 hover:underline font-semibold">@Paulwei</a></span>
              <span className="mx-2">•</span>
              <span>Engineering by <a href="https://x.com/WeWill_Rocky" target="_blank" rel="noreferrer" className="text-slate-900 hover:underline font-semibold">@Rocky</a></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Quantitative methodology for empirical cycle study. Not retail financial advice.
            </div>
          </div>
        </footer>
      </div>
    </DotBackground>
  );
};

const translations = {
  en: {
    nav: {
      chart: 'K-LINE TRAJECTORY',
      overlay: 'CYCLE OVERLAY',
      steps: 'METHODOLOGY',
      faq: 'RESEARCH FAQ',
    },
  },
  zh: {
    nav: {
      chart: '日线轨迹',
      overlay: '周期归一化',
      steps: '操作指南',
      faq: '研报与答疑',
    },
  }
};
