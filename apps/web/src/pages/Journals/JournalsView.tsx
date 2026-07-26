import React, { useState, useEffect } from 'react';
import {
  DocumentEditor,
  useDocumentStore,
  createJournalPage
} from '@catnoted/editor';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Settings,
  BookOpen,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const JournalsView: React.FC = () => {
  // Setup date strings
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Onboarding state
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('catnoted_journal_onboarded') === 'true';
    }
    return false;
  });

  // Default Template setting
  const [defaultTemplate, setDefaultTemplate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('catnoted_journal_template') || 'reflection';
    }
    return 'reflection';
  });

  // Access the pages state from useDocumentStore to look up journal items and detect duplicates
  const { pages } = useDocumentStore();

  // Parse initial route parameter or update whenever URL parameters change
  useEffect(() => {
    const parseQueryDate = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const queryDate = searchParams.get('date');
      if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
        setSelectedDate(queryDate);
        const parsedDate = new Date(queryDate);
        if (parsedDate.toString() !== 'Invalid Date') {
          setCurrentMonth(parsedDate);
        }
      }
    };

    parseQueryDate();

    // Listen for custom pushstate/popstate events to stay reactive
    const handleUrlChange = () => {
      parseQueryDate();
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Update localStorage when settings change
  const handleSelectTemplateSetting = (templateId: string) => {
    setDefaultTemplate(templateId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catnoted_journal_template', templateId);
    }
  };

  // Helper to check what journal pages exist for a date
  const getJournalPagesForDate = (dateStr: string) => {
    return (pages || []).filter((p: any) => {
      // Direct match
      if (p.journalDate === dateStr) return true;
      if (p.id === `journal-${dateStr}`) return true;

      // Title exact or formatted match
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      if (p.title === dateStr || p.title === formattedDate) return true;

      return false;
    });
  };

  // Check if a journal page actually exists for a date
  const hasJournalForDate = (dateStr: string) => {
    return getJournalPagesForDate(dateStr).length > 0;
  };

  // Check for duplicate conflicts
  const hasConflictForDate = (dateStr: string) => {
    return getJournalPagesForDate(dateStr).length > 1;
  };

  // Handle opening or creating a journal page
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);

    // Update route dynamically
    const newUrl = `/journals?date=${dateStr}`;
    window.history.pushState({}, '', newUrl);

    // Create journal if not exists
    const pagesForDate = getJournalPagesForDate(dateStr);
    if (pagesForDate.length === 0) {
      createJournalPage(dateStr, defaultTemplate);
    }
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateClick(todayStr);
  };

  // Onboarding action
  const handleCompleteOnboarding = (selectedOnboardingTemplate: string) => {
    handleSelectTemplateSetting(selectedOnboardingTemplate);
    setIsOnboarded(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catnoted_journal_onboarded', 'true');
    }
    // Create today's note using the chosen template
    createJournalPage(todayStr, selectedOnboardingTemplate);
    handleDateClick(todayStr);
  };

  // Calendar days grid generator
  const generateCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

    const endOfMonth = new Date(year, month + 1, 0);
    const totalDays = endOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

    // Previous month padding
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthEnd - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: false, key });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: true, key });
    }

    // Next month padding
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, isCurrentMonth: false, key });
    }

    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const currentMonthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Render Onboarding Screen
  if (!isOnboarded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-[#141416] p-6 overflow-y-auto">
        <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm mb-2">
            <CalendarIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Welcome to Journals 📅
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md">
              Start your daily journaling practice in CatNoted. Choose a default template structure to guide your writing:
            </p>
          </div>

          {/* Template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
            {/* Daily Reflection */}
            <button
              onClick={() => handleCompleteOnboarding('reflection')}
              className="group p-5 rounded-2xl border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-left hover:border-indigo-500 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Daily Reflection</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Focus on daily highlights, areas for growth, and gratitude elements.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Select <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            {/* Gratitude Journal */}
            <button
              onClick={() => handleCompleteOnboarding('gratitude')}
              className="group p-5 rounded-2xl border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-left hover:border-indigo-500 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Gratitude Journal</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Start and end your day on a positive note of constructive affirmation.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Select <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            {/* Empty Note */}
            <button
              onClick={() => handleCompleteOnboarding('empty')}
              className="group p-5 rounded-2xl border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-left hover:border-indigo-500 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-zinc-400 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Blank slate</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  An empty canvas designed for full structural freedom and direct drafting.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 mt-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Select <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeJournalPageId = `journal-${selectedDate}`;
  const activeConflict = hasConflictForDate(selectedDate);

  return (
    <div className="h-full w-full flex bg-slate-50 dark:bg-[#141416] overflow-hidden">
      {/* Sidebar Navigation Panel (Calendar sidebar) */}
      <aside className="w-80 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#16161a] shrink-0 flex flex-col h-full select-none">
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#18181c] shrink-0">
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
            Journals Calendar
          </span>
          <button
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-500/10 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Calendar Navigation Controller */}
        <div className="p-4 flex flex-col gap-4 border-b border-slate-100 dark:border-zinc-800/40">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              {currentMonthLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-500 dark:text-zinc-400"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-500 dark:text-zinc-400"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {/* Days of week */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                {day}
              </span>
            ))}

            {/* Cells */}
            {calendarDays.map((cell) => {
              const isSelected = cell.key === selectedDate;
              const hasJournal = hasJournalForDate(cell.key);
              const isToday = cell.key === todayStr;
              const isConflict = hasConflictForDate(cell.key);

              return (
                <button
                  key={cell.key}
                  onClick={() => handleDateClick(cell.key)}
                  className={`relative w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all ${
                    !cell.isCurrentMonth
                      ? 'text-slate-300 dark:text-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                      : 'text-slate-700 dark:text-zinc-300'
                  } ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/15'
                      : isToday
                        ? 'border border-indigo-400 dark:border-indigo-500/50'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{cell.date.getDate()}</span>

                  {/* Indicators */}
                  <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                    {/* Conflict Indicator */}
                    {isConflict && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Duplication Conflict" />
                    )}
                    {/* Existing Note Indicator */}
                    {hasJournal && !isConflict && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Quick Settings */}
        <div className="p-4 mt-auto border-t border-slate-150 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
            <Settings className="w-3.5 h-3.5" />
            <span>Template Settings</span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            {[
              { id: 'reflection', label: 'Daily Reflection' },
              { id: 'gratitude', label: 'Gratitude Journal' },
              { id: 'empty', label: 'Blank Slate' }
            ].map((tmpl) => {
              const isSelected = tmpl.id === defaultTemplate;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplateSetting(tmpl.id)}
                  className={`w-full px-3 py-2 text-left rounded-lg flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{tmpl.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden select-text">
        {/* Editor Wrapper Container */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {/* Duplication Warning Banner */}
          {activeConflict && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300">Journal Duplication Conflict</h5>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                  Multiple journal notes exist for {selectedDate}. Changes might sync or display inconsistently across lists.
                </p>
              </div>
            </div>
          )}

          {/* Render the standard Document Editor focusing on the active journal note page */}
          <DocumentEditor activePage={activeJournalPageId} />
        </div>
      </div>
    </div>
  );
};
