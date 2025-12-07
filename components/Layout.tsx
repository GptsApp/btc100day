import React, { ReactNode, useState } from 'react';
import { Sparkles, BarChart2, BookOpen, Languages, Command, Menu, X, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import Aurora from './Aurora';

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
      const offset = 80; // height of sticky header
      const rootElement = document.getElementById('root');

      if (rootElement) {
        // Since body is fixed, we need to scroll the root element
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
    <div className="min-h-screen flex flex-col font-sans text-white relative overflow-x-hidden" style={{ backgroundColor: 'rgb(6, 0, 16)' }}>
      <div className="fixed inset-0 z-0" style={{ height: '150vh' }}>
        <div className="hidden md:block w-full h-full">
          <Aurora
            colorStops={["#7cff67", "#b19eef", "#5227ff"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        <div className="md:hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20 w-full h-full min-h-screen"></div>
      </div>
      {/* Top Navigation Bar (Fixed) */}
      <header className="fixed top-0 left-0 right-0 h-[68px] bg-black/60 backdrop-blur-2xl z-50 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] supports-[backdrop-filter]:bg-black/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3">
             {/* Mobile Menu Button */}
             <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-white hover:text-[#7cff67] hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

             <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
               const rootElement = document.getElementById('root');
               if (rootElement) {
                 rootElement.scrollTo({ top: 0, behavior: 'smooth' });
               }
             }}>
                <div className="w-12 h-12 border-2 border-white/60 rounded-full flex items-center justify-center text-white shadow-sm hover:shadow-md transition-shadow">
                   <span className="font-mono font-black text-lg flex items-center justify-center gap-1"><span className="mt-[1px]">1</span><span className="inline-block -rotate-90 text-2xl">B</span></span>
                </div>
                <span className="font-bold text-lg text-white tracking-tight">BTC100.DAY</span>
             </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-20">
            <button onClick={() => scrollToSection('chart')} className="text-sm font-medium text-white/90 hover:text-[#7cff67] transition-colors text-shadow">{t.nav.chart}</button>
            <button onClick={() => scrollToSection('theory-steps')} className="text-sm font-medium text-white/90 hover:text-[#7cff67] transition-colors text-shadow">{t.nav.steps}</button>
            <button onClick={() => scrollToSection('insight')} className="text-sm font-medium text-white/90 hover:text-[#7cff67] transition-colors text-shadow">{t.nav.ai}</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-white/90 hover:text-[#7cff67] transition-colors text-shadow">{t.nav.faq}</button>
            <a href="https://wsnb.online/" target="_blank" rel="dofollow" className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors text-shadow">{t.nav.bitmex}</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
             <span className="text-xs text-white/60 font-mono">v1.3.5</span>
             <button
               onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
               className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white/90 hover:text-[#7cff67] hover:border-[#7cff67] hover:bg-white/20 transition-all cursor-pointer shadow-sm text-shadow"
             >
               <Languages className="w-3.5 h-3.5" />
               <span>{lang === 'en' ? 'English' : '中文'}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Bottom Sheet */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-200" onClick={() => setIsMenuOpen(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl rounded-t-3xl p-6 transform translate-y-0 transition-transform duration-300 border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] supports-[backdrop-filter]:bg-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6"></div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => handleNavClick('chart')} className="flex items-center gap-2 p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
                <BarChart2 className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white text-shadow">{t.nav.chart}</span>
              </button>
              <button onClick={() => handleNavClick('theory-steps')} className="flex items-center gap-2 p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
                <BookOpen className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white text-shadow">{t.nav.steps}</span>
              </button>
              <button onClick={() => handleNavClick('insight')} className="flex items-center gap-2 p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white text-shadow">{t.nav.ai}</span>
              </button>
              <button onClick={() => handleNavClick('faq')} className="flex items-center gap-2 p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
                <Command className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white text-shadow">{t.nav.faq}</span>
              </button>
            </div>

            <a
              href="https://wsnb.online/"
              target="_blank"
              rel="dofollow"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl border border-orange-400/30 hover:from-orange-500/30 hover:to-yellow-500/30 transition-all"
            >
              <ExternalLink className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-medium text-orange-400 text-shadow">{t.nav.bitmex}</span>
            </a>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-[72px] pb-12 relative z-10">
        <div className="p-4 md:px-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
        
      <footer className="py-8 bg-black/20 backdrop-blur-2xl border-t border-white/10 relative z-10">
         <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-3">
            <p className="text-xs font-semibold text-white text-shadow">2025 © BTC100.DAY. All rights reserved.</p>
            <p className="text-xs text-white/70 text-shadow">Theory from <a href="https://x.com/coolish" target="_blank" rel="noreferrer" className="hover:text-[#7cff67] hover:underline font-medium">@Paulwei</a> • Built with ❤️ by <a href="https://x.com/WeWill_Rocky" target="_blank" rel="noreferrer" className="hover:text-[#7cff67] hover:underline font-medium">@Rocky</a></p>
         </div>
      </footer>
    </div>
  );
};

const NavItem = ({ onClick, icon, label, active = false }: { onClick: () => void, icon: React.ReactNode, label: string, active?: boolean }) => (
  <button 
    onClick={onClick} 
    className={`
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left
      ${active ? 'bg-white/20 backdrop-blur-sm text-[#7cff67] border border-white/30' : 'text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/20'}
    `}
  >
    {icon}
    {label}
  </button>
);

const translations = {
  en: {
    nav: { chart: 'Chart & Data', steps: 'Methodology', ai: 'AI Analyst', faq: 'FAQ', bitmex: 'Bitmex Dashboard' },
  },
  zh: {
    nav: { chart: '市场数据', steps: '操作指南', ai: 'AI 分析', faq: '常见问题', bitmex: 'Bitmex实盘看板' },
  }
};