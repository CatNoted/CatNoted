const fs = require('fs');

let testContent = fs.readFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', 'utf8');
testContent = testContent.replace(
  `      const wheelEvent = {
        deltaY: -100, // scrolling up, should zoom in
      } as unknown as React.WheelEvent;`,
  `      const wheelEvent = mockEvent({
        deltaY: -100, // scrolling up, should zoom in
        ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
      }) as unknown as React.WheelEvent;`
);

testContent = testContent.replace(
  `      const wheelEvent = {
        deltaY: 100, // scrolling down, should zoom out
      } as unknown as React.WheelEvent;`,
  `      const wheelEvent = mockEvent({
        deltaY: 100, // scrolling down, should zoom out
        ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
      }) as unknown as React.WheelEvent;`
);

fs.writeFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', testContent, 'utf8');
