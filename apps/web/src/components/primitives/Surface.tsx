import { type ReactNode } from 'react';

type SurfaceProps = {
  className?: string;
  children: ReactNode;
};

export function Surface({ className, children }: SurfaceProps) {
  return (
    <div
      className={
        [
          'rounded-2xl border border-border bg-card',
          'shadow-sm',
          className || ''
        ].join(' ')
      }
    >
      {children}
    </div>
  );
}
