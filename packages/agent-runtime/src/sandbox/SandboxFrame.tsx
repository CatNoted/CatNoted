import React, { useRef, useEffect } from 'react';
import { isValidSandboxMessage } from '@catnoted/shared';

interface SandboxFrameProps {
  srcDoc: string;
  theme?: 'light' | 'dark';
  height?: string;
  onStateChange?: (state: Record<string, any>) => void;
  onError?: (error: { message: string }) => void;
}

export const SandboxFrame: React.FC<SandboxFrameProps> = ({
  srcDoc,
  theme = 'dark',
  height = '180px',
  onStateChange,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const combinedSrcDoc = `
    <!DOCTYPE html>
    <html class="${theme}">
      <head>
        <meta charset="UTF-8" />
        <script>
          window.addEventListener('error', function(e) {
            window.parent.postMessage({
              type: 'sandbox_error',
              payload: { message: e.message || 'Unknown runtime error' }
            }, '*');
          });
          window.addEventListener('unhandledrejection', function(e) {
            window.parent.postMessage({
              type: 'sandbox_error',
              payload: { message: e.reason ? (e.reason.message || String(e.reason)) : 'Promise rejected' }
            }, '*');
          });
        </script>
        <style>
          :root {
            --background: ${theme === 'dark' ? '#09090b' : '#ffffff'};
            --foreground: ${theme === 'dark' ? '#f4f4f5' : '#0f172a'};
            --primary: ${theme === 'dark' ? '#818cf8' : '#4f46e5'};
            --border: ${theme === 'dark' ? '#27272a' : '#e2e8f0'};
          }
          body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 12px;
            overflow-x: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 24px);
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center;">
          ${srcDoc}
        </div>
      </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
        if (!isValidSandboxMessage(e.data)) {
          return;
        }

        if (e.data.type === 'state_change') {
          onStateChange?.(e.data.payload);
        } else if (e.data.type === 'sandbox_error') {
          onError?.(e.data.payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onStateChange, onError]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={combinedSrcDoc}
      sandbox="allow-scripts"
      style={{ width: '100%', height, border: 'none', borderRadius: '12px' }}
      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-colors duration-200"
    />
  );
};
