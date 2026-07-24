const fs = require('fs');
let content = fs.readFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', 'utf8');

// Replace the casts
content = content.replace(/as unknown as React.WheelEvent;/g, "as unknown as WheelEvent;");

fs.writeFileSync('packages/canvas/src/hooks/useCanvasViewport.test.ts', content, 'utf8');
