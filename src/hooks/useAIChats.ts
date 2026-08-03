import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteAIChat, fetchAIChats, fetchAIMessages, renameAIChat } from '../services/aiService';
import type { AIChat, AIMessage } from '../types/ai';

export function useAIChats() {
  const { user, session } = useAuth();
  const [chats, setChats] = useState<AIChat[]>([]);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setMessages([]);
      setActiveChatId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAIChats(user.id)
      .then((nextChats) => {
        setChats(nextChats);
        setActiveChatId((current) => current && nextChats.some((chat) => chat.id === current) ? current : nextChats[0]?.id ?? null);
      })
      .catch(() => setError('Unable to load your conversations.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }
    void fetchAIMessages(user.id, activeChatId).then(setMessages).catch(() => setError('Unable to load this conversation.'));
  }, [activeChatId, user]);

  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string, documentId?: string) => {
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
    setSending(true);
    setError(null);
    try {
      const body = JSON.stringify({ message: content, chatId: activeChatId ?? undefined, documentId });
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body });
      const payload = await response.json().catch(() => ({})) as any;
      if (!response.ok) throw new Error(payload.error ?? 'The AI assistant is unavailable right now. Please try again.');
      const result = payload as { chat: any; userMessage: any; assistantMessage: any };
      setActiveChatId(result.chat.id);
      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);
      setChats((current) => [result.chat, ...current.filter((chat) => chat.id !== result.chat.id)]);
      return result as any;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to contact the AI assistant.';
      setError(message);
      throw cause;
    } finally {
      setSending(false);
    }
  }, [activeChatId, session?.access_token]);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    if (!user || !title.trim()) return;
    const updated = await renameAIChat(user.id, chatId, title);
    setChats((current) => current.map((chat) => chat.id === chatId ? updated : chat));
  }, [user]);

  const removeChat = useCallback(async (chatId: string) => {
    if (!user) return;
    await deleteAIChat(user.id, chatId);
    setChats((current) => current.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) startNewChat();
  }, [activeChatId, startNewChat, user]);

  return { chats, messages, activeChatId, setActiveChatId, loading, sending, error, startNewChat, sendMessage, renameChat, removeChat };
}
