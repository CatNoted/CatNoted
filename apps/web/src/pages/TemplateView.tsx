import React from 'react';
import { useDocumentStore, ydoc, yblocks } from '@catnoted/editor';
import { FileSpreadsheet } from 'lucide-react';
import { BlockNode } from '@catnoted/shared';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  blocks: (pageId: string) => BlockNode[];
}

const TEMPLATES: Template[] = [
  {
    id: 'meeting',
    title: 'Meeting Notes',
    description: 'Structure agendas, document attendees, assign action items, and draft meeting summaries.',
    icon: '📝',
    category: 'Productivity',
    blocks: (pageId) => [
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Weekly Sync Agenda & Notes 📝', properties: { level: 1 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Attendees 👥', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Alex Smith (Product Owner)', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Jamie Doe (Lead Architect)', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Sarah Conner (UX Researcher)', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Agenda Items 📋', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Review roadmap updates and milestone timelines.', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Evaluate user research insights on the sidebar navigation.', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Action Items ✅', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'todo', content: 'Update the core layout Figma specs (Alex)', properties: { checked: false }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'todo', content: 'Resolve unused TypeScript type definitions (Jamie)', properties: { checked: false }, parentId: pageId },
    ]
  },
  {
    id: 'project',
    title: 'Project Roadmap',
    description: 'Track objectives, record core milestones, map risks, and layout an action Kanban timeline.',
    icon: '🚀',
    category: 'Productivity',
    blocks: (pageId) => [
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Project Launch Plan 🚀', properties: { level: 1 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Core Objectives 🎯', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'text', content: 'Provide users with a cohesive first-class workspace containing rich pages, dynamic canvas, and interactive journals.', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Milestones Timeline 📅', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Phase 1: Database schemas & Yjs offline persistence (Done)', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Phase 2: Kanban boards & flexible layout routing (In Progress)', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Phase 3: Beta program feedback loops & Storybook polish', parentId: pageId },
    ]
  },
  {
    id: 'personal',
    title: 'Personal Goal Tracker',
    description: 'Maintain and update your personal vision boards, habit checklists, and reflection diaries.',
    icon: '📔',
    category: 'Personal Life',
    blocks: (pageId) => [
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Personal Goal Tracker 📔', properties: { level: 1 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'My Core Focus Areas 🧘', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Mental Well-being: Daily writing and mindful breathing.', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'bullet', content: 'Professional growth: Learn state management and Rust systems compilation.', parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Active Habits Checklist ⚡', properties: { level: 2 }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'todo', content: 'Write 500 words reflection notes', properties: { checked: false }, parentId: pageId },
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'todo', content: '30-minute cardio exercise', properties: { checked: false }, parentId: pageId },
    ]
  },
  {
    id: 'kanban',
    title: 'Kanban Board Sprint',
    description: 'A pre-configured agile board with drag-and-drop columns for task and sprint management.',
    icon: '📋',
    category: 'Project Management',
    blocks: (pageId) => [
      { id: `block-${Math.random().toString(36).substring(2, 11)}`, type: 'heading', content: 'Active Tasks Kanban Board 📋', properties: { level: 1 }, parentId: pageId },
      {
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'kanban',
        content: 'Sprint Tasks Board',
        properties: {
          columns: [
            {
              id: 'col-todo',
              title: 'To Do 🎯',
              cards: [
                { id: 'card-1', title: 'Refactor editor layouts', description: 'Introduce cleaner container margins' },
                { id: 'card-2', title: 'Design low-contrast dark mode', description: 'Match neutral slate slate tokens' }
              ]
            },
            {
              id: 'col-progress',
              title: 'In Progress ⚙️',
              cards: [
                { id: 'card-3', title: 'Integrate workspace router', description: 'Handle pathnames natively' }
              ]
            },
            {
              id: 'col-done',
              title: 'Done 🎉',
              cards: [
                { id: 'card-4', title: 'Setup GitHub CI Runner', description: 'Run vitest automated tests suite' }
              ]
            }
          ]
        },
        parentId: pageId
      }
    ]
  }
];

interface TemplateViewProps {
  onNavigateToPage?: (id: string) => void;
}

export const TemplateView: React.FC<TemplateViewProps> = ({ onNavigateToPage }) => {
  const { createPage } = useDocumentStore();

  const handleUseTemplate = (template: Template) => {
    // 1. Create a new page
    const newPageId = createPage(template.title, template.icon);

    // 2. Resolve template blocks and insert them
    const tBlocks = template.blocks(newPageId);
    ydoc.transact(() => {
      yblocks.insert(yblocks.length, tBlocks);
    });

    // 3. Navigate
    onNavigateToPage?.(newPageId);
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#141416] p-6 md:p-8 overflow-y-auto select-text">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-850 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
              Template Library
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Kickstart your productivity with our elegant presets, designed to seed blocks for structured syncs, roadmaps, and tasks boards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-6 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 rounded-3xl flex flex-col gap-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/40 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl shrink-0 p-2 bg-slate-50 dark:bg-zinc-850 rounded-2xl">{tmpl.icon}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-slate-50 dark:bg-zinc-850 px-2 py-1 rounded-lg">
                  {tmpl.category}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tmpl.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleUseTemplate(tmpl)}
                className="mt-auto w-full py-2 bg-slate-950 hover:bg-slate-850 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Use this Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
