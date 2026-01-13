
import React from 'react';
import { MODES } from '../constants';
import { HumanizationMode } from '../types';

interface ModeSelectorProps {
  activeMode: HumanizationMode;
  onSelect: (mode: HumanizationMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onSelect }) => {
  return (
    <div className="flex overflow-x-auto pb-4 md:pb-0 no-scrollbar md:flex-wrap gap-2 md:gap-3 mb-6 md:mb-10 px-2 justify-start md:justify-center">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`
            flex-shrink-0 flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-2xl border-2 transition-all duration-200 text-xs md:text-sm font-semibold
            ${activeMode === mode.id 
              ? `${mode.bgColor} ${mode.borderColor} ${mode.color} scale-105 shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-slate-100 dark:ring-slate-800` 
              : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }
          `}
        >
          <span className="text-lg md:text-xl">{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
