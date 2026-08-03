export type AIMessageRole = 'user' | 'assistant';

export interface AIChat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: AIMessageRole;
  content: string;
  created_at: string;
}

export interface SendAIMessageResult {
  chat: AIChat;
  userMessage: AIMessage;
  assistantMessage: AIMessage;
}
