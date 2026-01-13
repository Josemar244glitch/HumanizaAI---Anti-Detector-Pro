
import React from 'react';
import { MODES } from '../constants';
import { HumanizationMode } from '../types';

interface ModeSelectorProps {
  activeMode: HumanizationMode;
  onSelect: (mode: HumanizationMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelect }) => {
  return (
    <div className="flex overflow-x-auto pb-4 md:pb-0 no-scrollbar md:flex-wrap gap-3 mb-12 px-2 justify-start md:justify-center">
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-inner">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-500 text-xs font-black uppercase tracking-widest
              ${activeMode === mode.id 
                ? `bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-premium dark:shadow-premium-dark border border-slate-100 dark:border-slate-700 scale-105` 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }
            `}
          >
            <span className={`text-base transition-transform duration-500 ${activeMode === mode.id ? 'scale-125' : 'grayscale opacity-50'}`}>{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
