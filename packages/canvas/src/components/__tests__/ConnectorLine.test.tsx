import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { ConnectorLine } from '../ConnectorLine.js';

describe('ConnectorLine', () => {
  it('renders a connector SVG line correctly', () => {
    const { container } = render(
      <svg>
        <ConnectorLine
          startX={0}
          startY={0}
          endX={100}
          endY={100}
        />
      </svg>
    );

    // Should render a path inside the svg
    expect(container.querySelector('path')).toBeInTheDocument();
  });
});
