import React from 'react';

interface PanelProps {
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl relative ${className}`}
    >
      {children}
    </div>
  );
};
