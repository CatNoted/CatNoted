import React from 'react';

export interface PanelProps {
  children: React.ReactNode;
  className?: string; // Optional override/addition for default styles
}

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl relative transition-all ${className}`}>
      {children}
    </div>
  );
};
