import React from 'react';
import { Cpu, Trash2 } from 'lucide-react';

interface WidgetBlockPlaceholderProps {
  id: string;
  properties?: {
    widgetId?: string;
    [key: string]: any;
  };
  onDelete: () => void;
}

const WidgetBlockPlaceholderBase: React.FC<WidgetBlockPlaceholderProps> = ({
  properties,
  onDelete
}) => {
  const widgetId = properties?.widgetId || 'unassigned';

  return (
    <div className="w-full my-4 border border-border rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-2 text-accent">
          <Cpu className="w-4 h-4" />
          <span className="text-xs font-mono font-semibold">AI Widget Container</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-mono">
            ID: {widgetId}
          </span>
          <button 
            onClick={onDelete}
            title="Delete Widget"
            className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
          <span className="text-sm">🤖</span>
        </div>
        <p className="text-xs font-medium text-foreground">Widget Sandbox Standby</p>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
          The Space Agent runtime will dynamically inject sandbox iframe and compiled JS widget here.
        </p>
      </div>
    </div>
  );
};

export const WidgetBlockPlaceholder = React.memo(WidgetBlockPlaceholderBase);
