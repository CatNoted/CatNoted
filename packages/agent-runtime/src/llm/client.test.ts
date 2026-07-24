import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestLlmWidget, LLMConfig } from './client.js';

describe('requestLlmWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should use fetch API and return generated widget when API key is provided', async () => {
    const mockResponse = {
      choices: [
        {
          message: { content: '<div id="generated"></div>' }
        }
      ]
    };
    (global.fetch as any).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const config: LLMConfig = {
      provider: 'openai',
      apiKey: 'test-api-key',
      endpoint: 'https://custom.endpoint.com'
    };

    const promise = requestLlmWidget('create a cool widget', config);
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://custom.endpoint.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert AI Widget generator. Output only HTML code.' },
          { role: 'user', content: 'create a cool widget' }
        ]
      })
    });

    expect(result.code).toBe('<div id="generated"></div>');
    expect(result.text).toBe('Successfully generated widget using BYOK LLM key!');
  });

  it('should fallback to mock generator if fetch fails when API key is provided', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const config: LLMConfig = {
      provider: 'openai',
      apiKey: 'test-api-key'
    };

    const promise = requestLlmWidget('make a clock', config);
    // Use vi.runAllTimersAsync() or await vi.advanceTimersByTimeAsync(800) for async operations involving timers
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    expect(result.text).toContain('Space Agent (Mock Mode)');
    expect(result.code).toContain('id="clock-face"');
  });

  it('should use default endpoint if none is provided in config', async () => {
    const mockResponse = {
      choices: [
        {
          message: { content: '<div id="generated"></div>' }
        }
      ]
    };
    (global.fetch as any).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const config: LLMConfig = {
      provider: 'gemini',
      apiKey: 'test-api-key'
    };

    const promise = requestLlmWidget('create a cool widget', config);
    await promise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.any(Object));
  });

  it('should return analog clock template when prompt contains clock related keywords', async () => {
    const promise = requestLlmWidget('give me a clock');
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result.code).toContain('id="clock-face"');
    expect(result.text).toBe('Space Agent (Mock Mode): Successfully compiled a secure HTML/JS widget for "Analog Clock".');
  });

  it('should return calculator template when prompt contains calc related keywords', async () => {
    const promise = requestLlmWidget('I need a kalkulator');
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result.code).toContain('id="calc-display"');
    expect(result.text).toBe('Space Agent (Mock Mode): Successfully compiled a secure HTML/JS widget for "Mini Calculator".');
  });

  it('should return todo template as default when prompt has no specific keywords', async () => {
    const promise = requestLlmWidget('just a random widget');
    await vi.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result.code).toContain('id="todo-in"');
    expect(result.text).toBe('Space Agent (Mock Mode): Successfully compiled a secure HTML/JS widget for "Quick Tasks Todo".');
  });
});
