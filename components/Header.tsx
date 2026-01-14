
import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  user: string | null;
  onLogout: () => void;
  onOpenHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, user, onLogout, onOpenHistory }) => {
  return (
    <header className="sticky top-0 z-[100] w-full py-4 px-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold font-header text-slate-900 dark:text-white tracking-tight leading-none transition-colors">HumanizaAI</h1>
              <span className="bg-indigo-600 text-[10px] font-black text-white px-1.5 py-0.5 rounded tracking-tighter uppercase shadow-lg shadow-indigo-500/20">Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] transition-colors">Anti-Detector</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onOpenHistory}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            title="Ver Histórico"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 transform hover:rotate-12"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.split('@')[0]}</span>
                <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Ativo
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
