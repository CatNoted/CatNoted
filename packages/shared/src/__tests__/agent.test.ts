import { describe, it, expect } from 'vitest';
import { isValidSandboxMessage } from '../agent.js';

describe('isValidSandboxMessage Schema Validation Tests', () => {
  it('validates a correct state_change message', () => {
    const message = {
      type: 'state_change',
      payload: {
        score: 100,
        name: 'Player 1',
        active: true,
        items: ['sword', 'shield'],
        stats: {
          hp: 50,
          mp: 20
        },
        none: null
      }
    };
    expect(isValidSandboxMessage(message)).toBe(true);
  });

  it('validates a correct sandbox_error message', () => {
    const message = {
      type: 'sandbox_error',
      payload: {
        message: 'Something went wrong'
      }
    };
    expect(isValidSandboxMessage(message)).toBe(true);
  });

  it('rejects a state_change message with invalid or malformed state values', () => {
    const messageWithFunction = {
      type: 'state_change',
      payload: {
        score: 100,
        run: () => {}
      }
    };
    expect(isValidSandboxMessage(messageWithFunction)).toBe(false);

    const messageWithSymbol = {
      type: 'state_change',
      payload: {
        sym: Symbol('foo')
      }
    };
    expect(isValidSandboxMessage(messageWithSymbol)).toBe(false);
  });

  it('rejects messages with prototype pollution', () => {
    const maliciousMessage = {
      type: 'state_change',
      payload: JSON.parse('{"__proto__": {"polluted": true}}')
    };
    expect(isValidSandboxMessage(maliciousMessage)).toBe(false);
  });

  it('rejects state_change with non-object payload', () => {
    const message = {
      type: 'state_change',
      payload: 'not-an-object'
    };
    expect(isValidSandboxMessage(message)).toBe(false);
  });

  it('rejects sandbox_error with non-string message', () => {
    const message = {
      type: 'sandbox_error',
      payload: {
        message: 123
      }
    };
    expect(isValidSandboxMessage(message)).toBe(false);
  });

  it('rejects unknown message types', () => {
    const message = {
      type: 'unknown_type',
      payload: { foo: 'bar' }
    };
    expect(isValidSandboxMessage(message)).toBe(false);
  });

  it('rejects non-object messages safely', () => {
    expect(isValidSandboxMessage(null)).toBe(false);
    expect(isValidSandboxMessage(undefined)).toBe(false);
    expect(isValidSandboxMessage('string')).toBe(false);
    expect(isValidSandboxMessage(123)).toBe(false);
    expect(isValidSandboxMessage([])).toBe(false);
  });
});
