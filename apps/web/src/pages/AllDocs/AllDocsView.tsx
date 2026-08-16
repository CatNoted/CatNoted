import React from "react";
import { Plus, Settings, Sparkles, Filter, ChevronDown, ListFilter, FileText } from "lucide-react";

export const AllDocsView: React.FC = () => {
  return (
    <div className="flex-1 min-w-0 flex overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6 h-full">
            <h1 className="text-sm font-medium text-foreground relative h-full flex items-center after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground">
              Docs
            </h1>
            <h1 className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors h-full flex items-center">
              Collections
            </h1>
            <h1 className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors h-full flex items-center">
              Tags
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Filter documents" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button aria-label="Sort documents" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
              <ListFilter className="w-4 h-4" />
            </button>
            <button aria-label="Document settings" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button aria-label="Create new document" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Document List Container */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-6">
            <h2 className="text-3xl font-semibold text-foreground mb-8">All docs</h2>

            {/* List Group: Jul 26, 2026 */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jul 26, 2026</span>
              </div>

              <div className="space-y-1">
                {/* Doc Item */}
                <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted rounded-lg group cursor-pointer border border-transparent hover:border-border transition-colors min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">Getting Started with Affine</span>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                    10:45 AM
                  </span>
                </div>
                {/* Doc Item */}
                <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted rounded-lg group cursor-pointer border border-transparent hover:border-border transition-colors min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">Project Roadmap Q3</span>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                    09:30 AM
                  </span>
                </div>
              </div>
            </div>

            {/* List Group: Never Updated */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Never Updated</span>
              </div>

              <div className="space-y-1">
                {/* Doc Item */}
                <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted rounded-lg group cursor-pointer border border-transparent hover:border-border transition-colors min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">Untitled Document</span>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                    -
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-foreground">Calendar</h3>
            <div className="flex gap-1">
               <button aria-label="Calendar settings" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
          </div>
          {/* Mock Calendar */}
          <div className="bg-background rounded-lg border border-border p-3 text-center text-sm text-muted-foreground">
             <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-medium">
               <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
             </div>
             <div className="grid grid-cols-7 gap-1 text-xs">
                {/* Mock days */}
                <div className="p-1 text-muted-foreground/50">28</div>
                <div className="p-1 text-muted-foreground/50">29</div>
                <div className="p-1 text-muted-foreground/50">30</div>
                <div className="p-1 text-muted-foreground/50">31</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer">1</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer">2</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer">3</div>
                {/* ... */}
                <div className="p-1 hover:bg-muted rounded cursor-pointer">4</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer">5</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer">6</div>
                <div className="p-1 hover:bg-muted rounded cursor-pointer text-accent font-medium">7</div>
             </div>
          </div>
        </div>

        <div className="p-4 flex-1 min-w-0">
          <div className="bg-muted/50 rounded-xl p-4 border border-border text-center">
             <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
               <Sparkles className="w-5 h-5" />
             </div>
             <h4 className="text-sm font-medium text-foreground mb-1">Set a Template</h4>
             <p className="text-xs text-muted-foreground mb-4">
               Create a standard layout for your daily journals.
             </p>
             <button className="w-full py-1.5 bg-background border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors text-foreground">
               Choose Template
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
