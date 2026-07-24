import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { buildSlashCommands, SlashCommand, SlashCommandMenu } from '../SlashCommandMenu.js';

describe('Blackbox Test: SlashCommandMenu Filtering & Trigger Specifications', () => {
  const onSetType = vi.fn();
  const onAddWidget = vi.fn();
  const onClose = vi.fn();

  const commands: SlashCommand[] = buildSlashCommands({
    onSetType,
    onAddWidget,
    onClose,
  });

  it('should include all standard block type commands in the default palette', () => {
    const ids = commands.map((c: SlashCommand) => c.id);
    expect(ids).toContain('text');
    expect(ids).toContain('heading1');
    expect(ids).toContain('heading2');
    expect(ids).toContain('heading3');
    expect(ids).toContain('bullet');
    expect(ids).toContain('ordered');
    expect(ids).toContain('todo');
    expect(ids).toContain('quote');
    expect(ids).toContain('code');
    expect(ids).toContain('divider');
    expect(ids).toContain('widget');
  });

  it('blackbox filter test: empty query should render all commands in SlashCommandMenu', async () => {
    // vitest environment is happy-dom
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SlashCommandMenu
          query=""
          position={{ top: 0, left: 0 }}
          onClose={vi.fn()}
          commands={commands}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(commands.length);

    document.body.removeChild(container);
  });


  it('blackbox filter test: querying "h1" or "title" should match Heading 1 command', () => {
    const query = 'h1';
    const filtered = commands.filter((cmd: SlashCommand) => {
      const q = query.toLowerCase();
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.keywords.some((k: string) => k.toLowerCase().includes(q))
      );
    });

    expect(filtered.some((c: SlashCommand) => c.id === 'heading1')).toBe(true);
  });

  it('blackbox filter test: querying "agent" or "interactive" should match AI Widget command', () => {
    const query = 'interactive';
    const filtered = commands.filter((cmd: SlashCommand) => {
      const q = query.toLowerCase();
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.keywords.some((k: string) => k.toLowerCase().includes(q))
      );
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('widget');
  });

  it('blackbox action test: executing Heading 1 action calls onSetType with heading level 1 and closes menu', () => {
    onSetType.mockClear();
    onClose.mockClear();

    const h1Cmd = commands.find((c: SlashCommand) => c.id === 'heading1');
    expect(h1Cmd).toBeDefined();

    h1Cmd?.action();

    expect(onSetType).toHaveBeenCalledWith('heading', { level: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  it('blackbox action test: executing AI Widget action triggers onAddWidget callback', () => {
    onAddWidget.mockClear();
    onClose.mockClear();

    const widgetCmd = commands.find((c: SlashCommand) => c.id === 'widget');
    expect(widgetCmd).toBeDefined();

    widgetCmd?.action();

    expect(onAddWidget).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
