import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { SandboxFrame } from '../SandboxFrame.js';

describe('SandboxFrame', () => {
  it('renders iframe with correct srcdoc', () => {
    const { container } = render(
      <SandboxFrame
        srcDoc="console.log('test');"
      />
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.srcdoc).toContain('console.log(\'test\');');
  });
});
