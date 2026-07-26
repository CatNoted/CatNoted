import React from 'react';

export interface OverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  zIndex?: string; // Optional custom z-index
  className?: string; // Additional classes for the backdrop
}

export const Overlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  children,
  zIndex = 'z-[100]',
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-slate-900/30 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 ${zIndex} ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
};
