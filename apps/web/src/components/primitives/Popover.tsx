import React, { useEffect, useRef } from 'react';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: PopoverPlacement;
  closeOnOutsideClick?: boolean;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  placement = 'bottom',
  closeOnOutsideClick = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, closeOnOutsideClick, onClose]);

  // Position classes relative to trigger container
  const getPlacementClasses = (place: PopoverPlacement) => {
    switch (place) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'top-start':
        return 'bottom-full left-0 mb-2';
      case 'top-end':
        return 'bottom-full right-0 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'bottom-start':
        return 'top-full left-0 mt-2';
      case 'bottom-end':
        return 'top-full right-0 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-40 min-w-[200px] rounded-xl border border-border bg-surface p-3 shadow-xl dark:border-border/80 dark:bg-surface text-slate-800 dark:text-zinc-200 transition-all ${getPlacementClasses(
            placement
          )} ${className}`}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      )}
    </div>
  );
};
