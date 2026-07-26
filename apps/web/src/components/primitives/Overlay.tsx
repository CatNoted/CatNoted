import { type ReactNode } from 'react';

type OverlayProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function Overlay({ open, onOpenChange, children, className }: OverlayProps) {
  if (!open) return null;

  return (
    <div
      className={
        [
          'fixed inset-0 z-[100] flex items-center justify-center p-4',
          'bg-overlay/40 dark:bg-overlay/60 backdrop-blur-[2px]',
          className || ''
        ].join(' ')
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange?.(false);
        }
      }}
    >
      {children}
    </div>
  );
}
