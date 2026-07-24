import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestLlmWidget } from '../client.js';

describe('Whitebox Test: requestLlmWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should generate widget successfully using BYOK LLM key', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '<div>Mock Widget</div>'
            }
          }
        ]
      })
    };

    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

    const promise = requestLlmWidget('make a widget', { provider: 'openai', apiKey: 'test-key' });
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      code: '<div>Mock Widget</div>',
      text: 'Successfully generated widget using BYOK LLM key!'
    });
  });

  it('should fallback to mock generator when LLM API call fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const promise = requestLlmWidget('make a todo widget', { provider: 'openai', apiKey: 'test-key' });

    // Let microtasks clear so the setTimeout is registered
    await Promise.resolve();
    await Promise.resolve();

    // Fast forward the 800ms mock delay
    await vi.advanceTimersByTimeAsync(800);

    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('LLM API call failed, falling back to mock generator:', expect.any(Error));
    expect(result.code).toContain('id="todo-list"');
    expect(result.text).toContain('Space Agent (Mock Mode)');
  });

  it('should use mock generator directly when no config is provided', async () => {
    vi.spyOn(global, 'fetch');

    const promise = requestLlmWidget('make a clock');

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.code).toContain('id="clock-face"');
    expect(result.text).toContain('Space Agent (Mock Mode): Successfully compiled a secure HTML/JS widget for "Analog Clock".');
  });

  it('should use calculator mock for math-related prompts', async () => {
    vi.spyOn(global, 'fetch');

    const promise = requestLlmWidget('calc 1+1');

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result.code).toContain('id="calc-display"');
    expect(result.text).toContain('Mini Calculator');
  });
});
