import React from 'react';

interface OverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const Overlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  className = '',
  children,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${className}`}
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
};
