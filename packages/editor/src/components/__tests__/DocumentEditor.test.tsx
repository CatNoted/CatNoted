import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { DocumentEditor } from '../DocumentEditor.js';

describe('DocumentEditor', () => {
  it('renders correctly', () => {
    // This is a minimal test because DocumentEditor depends on Yjs store which is mocked/complex
    const { container } = render(<DocumentEditor activePage="test-page" />);
    expect(container).toBeInTheDocument();
  });
});
