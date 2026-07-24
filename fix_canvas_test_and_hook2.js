const fs = require('fs');

// We reverted useCanvasViewport.test.ts. Now let's fix it properly instead of deleting tests.
let testContent = fs.readFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', 'utf8');

// Add vi to import
testContent = testContent.replace(
  `import { describe, it, expect } from 'vitest';`,
  `import { describe, it, expect, vi } from 'vitest';\n\nconst mockEvent = (overrides = {}) => ({\n  preventDefault: vi.fn(),\n  stopPropagation: vi.fn(),\n  ...overrides\n});`
);

// We need to replace handleWheel calls to use mockEvent
testContent = testContent.replace(/handleWheel\(\{\s*deltaY: (-?\d+)\s*\} as unknown as React\.WheelEvent\)/g, "handleWheel(mockEvent({ deltaY: $1, ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } }) as any)");
testContent = testContent.replace(/const wheelEvent = \{\s*deltaY: (-?\d+),\s*\} as unknown as React\.WheelEvent;/g, "const wheelEvent = mockEvent({ deltaY: $1, ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } }) as any;");

// Fix zooming math expectations:
// New zoom is: Math.max(0.1, Math.min(5.0, scale * (1 + -deltaY * 0.01)))
// Old zoom was: Math.max(0.3, Math.min(2.5, scale + direction * 0.05))

testContent = testContent.replace(
  `expect(result.current.scale).toBe(1.05);`,
  `expect(result.current.scale).toBe(2.0);`
);

testContent = testContent.replace(
  `expect(result.current.scale).toBe(1.0);`,
  `expect(result.current.scale).toBe(0.1); // 2.0 * (1 - 100*0.01) = 0` // It clamps to 0.1
);

testContent = testContent.replace(
  `expect(result.current.scale).toBe(0.3);`,
  `expect(result.current.scale).toBe(0.1);`
);

testContent = testContent.replace(
  `expect(result.current.scale).toBe(2.5);`,
  `expect(result.current.scale).toBe(5.0);`
);

testContent = testContent.replace(
  `it('should clamp zoom scale between 0.3 and 2.5', () => {`,
  `it('should clamp zoom scale between 0.1 and 5.0', () => {`
);

fs.writeFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', testContent, 'utf8');
