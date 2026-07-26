import React, { type ReactNode } from 'react';

type PanelProps = {
  className?: string;
  children: ReactNode;
};

export function Panel({ className, children }: PanelProps) {
  return (
    <div
      className={
        [
          'w-full max-w-[440px] flex flex-col overflow-hidden',
          'rounded-2xl border border-soft bg-surface dark:bg-surface',
          'shadow-2xl',
          className || ''
        ].join(' ')
      }
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
