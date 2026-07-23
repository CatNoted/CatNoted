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
