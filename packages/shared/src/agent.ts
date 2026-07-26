export interface WidgetSpec {
  id: string;
  srcDoc: string;
  state: Record<string, any>;
  theme: 'light' | 'dark';
}

export type AgentMessageType = 
  | 'widget_init' 
  | 'widget_update' 
  | 'widget_state_change'
  | 'agent_request' 
  | 'agent_response' 
  | 'error';

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  payload: any;
  timestamp: number;
}

export type SandboxMessageType = 'state_change' | 'sandbox_error';

export interface SandboxStateChangeMessage {
  type: 'state_change';
  payload: Record<string, any>;
}

export interface SandboxErrorMessage {
  type: 'sandbox_error';
  payload: {
    message: string;
  };
}

export type SandboxMessage = SandboxStateChangeMessage | SandboxErrorMessage;

export function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidStateValue(val: unknown): boolean {
  if (val === null) return true;
  const t = typeof val;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (t === 'object') {
    if (Array.isArray(val)) {
      return val.every(isValidStateValue);
    }
    if (isRecord(val)) {
      for (const key of Object.keys(val)) {
        if (key === '__proto__' || key === 'constructor') {
          return false;
        }
        if (!isValidStateValue(val[key])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

export function isValidStateRecord(payload: unknown): payload is Record<string, any> {
  if (!isRecord(payload)) return false;
  for (const key of Object.keys(payload)) {
    if (key === '__proto__' || key === 'constructor') {
      return false;
    }
    if (!isValidStateValue(payload[key])) {
      return false;
    }
  }
  return true;
}

export function isValidSandboxMessage(data: unknown): data is SandboxMessage {
  if (!isRecord(data)) return false;

  const { type, payload } = data;

  if (type === 'state_change') {
    return isValidStateRecord(payload);
  }

  if (type === 'sandbox_error') {
    if (!isRecord(payload)) return false;
    return typeof payload.message === 'string';
  }

  return false;
}
