import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { ConnectorLine } from '../ConnectorLine.js';

describe('ConnectorLine Component Tests', () => {
  it('should render standard bezier line correctly with defaults', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ConnectorLine
          startX={100}
          startY={100}
          endX={200}
          endY={200}
          label="Custom Link"
        />
      );
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    // The main connector path should be present
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2); // invisible hover path + main connector path

    // Label should be rendered
    const labelText = container.querySelector('text');
    expect(labelText).not.toBeNull();
    expect(labelText?.textContent).toBe('Custom Link');

    document.body.removeChild(container);
  });

  it('should support straight curve type', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ConnectorLine
          startX={100}
          startY={100}
          endX={200}
          endY={200}
          type="straight"
        />
      );
    });

    const paths = container.querySelectorAll('path');
    // Ensure one of the paths starts with "M 100 100 L 200 200"
    let hasStraightPath = false;
    paths.forEach(p => {
      const d = p.getAttribute('d');
      if (d && d.includes('M 100 100 L 200 200')) {
        hasStraightPath = true;
      }
    });
    expect(hasStraightPath).toBe(true);

    document.body.removeChild(container);
  });

  it('should support stepped curve type', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ConnectorLine
          startX={100}
          startY={100}
          endX={300}
          endY={200}
          type="stepped"
        />
      );
    });

    const paths = container.querySelectorAll('path');
    let hasSteppedPath = false;
    paths.forEach(p => {
      const d = p.getAttribute('d');
      // Horizontal midX = (100 + 300) / 2 = 200. Path: M 100 100 L 200 100 L 200 200 L 300 200
      if (d && d.includes('M 100 100 L 200 100 L 200 200 L 300 200')) {
        hasSteppedPath = true;
      }
    });
    expect(hasSteppedPath).toBe(true);

    document.body.removeChild(container);
  });

  it('should apply start and end arrowheads when configured', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ConnectorLine
          startX={100}
          startY={100}
          endX={200}
          endY={200}
          arrowStart={true}
          arrowEnd={true}
        />
      );
    });

    const paths = container.querySelectorAll('path');
    let hasMarkers = false;
    paths.forEach(p => {
      const markerStart = p.getAttribute('marker-start');
      const markerEnd = p.getAttribute('marker-end');
      if (markerStart === 'url(#arrow)' && markerEnd === 'url(#arrow)') {
        hasMarkers = true;
      }
    });
    expect(hasMarkers).toBe(true);

    document.body.removeChild(container);
  });

  it('should trigger onClick when clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const handleClick = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ConnectorLine
          startX={100}
          startY={100}
          endX={200}
          endY={200}
          onClick={handleClick}
        />
      );
    });

    // Invisible thick path handles the click
    const hoverPath = container.querySelector('path[stroke="transparent"]');
    expect(hoverPath).not.toBeNull();

    await act(async () => {
      hoverPath?.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(handleClick).toHaveBeenCalledTimes(1);

    document.body.removeChild(container);
  });
});
