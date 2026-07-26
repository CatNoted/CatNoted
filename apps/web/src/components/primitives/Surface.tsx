import React, { type ReactNode } from 'react';

type SurfaceProps = {
  className?: string;
  children: ReactNode;
};

export function Surface({ className, children }: SurfaceProps) {
  return (
    <div
      className={
        [
          'rounded-2xl border border-soft bg-surface dark:bg-surface',
          'shadow-sm',
          className || ''
        ].join(' ')
      }
    >
      {children}
    </div>
  );
}
