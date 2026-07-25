import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { WidgetBlockPlaceholder } from '../WidgetBlockPlaceholder.js';

describe('WidgetBlockPlaceholder', () => {
  it('renders correctly with default props', () => {
    render(<WidgetBlockPlaceholder id="block-1" onDelete={vi.fn()} />);

    expect(screen.getByText('AI Widget Container')).toBeInTheDocument();
    expect(screen.getByText('ID: unassigned')).toBeInTheDocument();
    expect(screen.getByText('Widget Sandbox Standby')).toBeInTheDocument();
  });

  it('renders correctly with widgetId', () => {
    render(
      <WidgetBlockPlaceholder
        id="block-1"
        properties={{ widgetId: 'test-widget' }}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('ID: test-widget')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDeleteMock = vi.fn();
    render(<WidgetBlockPlaceholder id="block-1" onDelete={onDeleteMock} />);

    const deleteBtn = screen.getByTitle('Delete Widget');
    fireEvent.click(deleteBtn);

    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });
});
