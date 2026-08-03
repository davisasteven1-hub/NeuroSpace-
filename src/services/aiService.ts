import { supabase } from '../lib/supabase';
import type { AIChat, AIMessage, SendAIMessageResult } from '../types/ai';

const CHAT_ENDPOINT = '/api/chat';

export async function fetchAIChats(userId: string): Promise<AIChat[]> {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAIMessages(userId: string, chatId: string): Promise<AIMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function renameAIChat(userId: string, chatId: string, title: string): Promise<AIChat> {
  const { data, error } = await supabase
    .from('ai_chats')
    .update({ title: title.trim().slice(0, 120), updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAIChat(userId: string, chatId: string): Promise<void> {
  const { error } = await supabase.from('ai_chats').delete().eq('id', chatId).eq('user_id', userId);
  if (error) throw error;
}

export async function sendAIMessage(
  accessToken: string,
  message: string,
  chatId?: string,
  documentIds?: string[],
): Promise<SendAIMessageResult> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ message, chatId, documentIds }),
  });

  const payload = await response.json().catch(() => ({})) as SendAIMessageResult & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? 'The AI assistant is unavailable right now. Please try again.');
  return payload;
}
