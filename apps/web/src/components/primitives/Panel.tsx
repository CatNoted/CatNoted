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
      className={`bg-card border border-border/80 dark:border-border rounded-2xl relative ${className}`}
    >
      {children}
    </div>
  );
};
