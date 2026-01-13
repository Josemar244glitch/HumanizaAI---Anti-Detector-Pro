
import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  user: string | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, user, onLogout }) => {
  return (
    <header className="py-4 md:py-6 px-4 mb-4 md:mb-8 sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-2xl font-bold font-header text-slate-800 dark:text-white tracking-tight leading-none">HumanizaAI</h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium italic">Anti-Detector de ia Pro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2 md:gap-4 ml-2">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{user.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400">Plano Premium</p>
              </div>
              <button 
                onClick={onLogout}
                className="px-3 md:px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all shadow-sm"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
