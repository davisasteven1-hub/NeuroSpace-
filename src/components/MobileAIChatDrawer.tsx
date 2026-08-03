import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AIChat } from '../types/ai';

export default function MobileAIChatDrawer({ open, onClose, chats, activeChatId, onSelectChat, onNewChat, onRename, onDelete }: { open: boolean; onClose: () => void; chats: AIChat[]; activeChatId: string | null; onSelectChat: (id: string) => void; onNewChat: () => void; onRename: (id: string) => void; onDelete: (id: string) => void; }) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside 
        className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-void border-r border-gray-800 p-3 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-expanded={open}
        aria-controls="drawer-content"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="drawer-title" className="uppercase text-[11px] font-bold text-white">Conversations</h3>
          <button 
            onClick={onClose} 
            aria-label="Close conversations drawer"
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-3">
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full border border-safe px-3 py-2 text-[11px] text-safe hover:bg-safe/10 transition-colors"
          >
            New chat
          </button>
        </div>
        <div id="drawer-content" className="overflow-y-auto max-h-[70vh] space-y-1">
          {chats.map((c) => (
            <div 
              key={c.id} 
              className={`flex items-center justify-between p-2 border transition-colors ${activeChatId === c.id ? 'border-safe/40 bg-safe/10 text-safe' : 'border-gray-800 hover:border-gray-700'}`}
            >
              <button 
                className="text-left truncate flex-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                onClick={() => { onSelectChat(c.id); onClose(); }}
              >
                {c.title}
              </button>
              <div className="flex gap-1">
                <button 
                  onClick={() => onRename(c.id)}
                  className="text-[11px] text-gray-400 hover:text-safe transition-colors"
                >
                  Rename
                </button>
                <button 
                  onClick={() => { if (confirm('Delete this conversation?')) onDelete(c.id); }}
                  className="text-[11px] text-gray-400 hover:text-panic transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
