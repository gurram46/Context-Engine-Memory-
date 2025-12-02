import React from 'react';
import type { Conversation } from '../../utils/storage';

interface MemoryCardProps {
  conversation: Conversation;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onCopy: (e: React.MouseEvent) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ conversation, onClick, onDelete, onCopy }) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1]?.content || "No content";
  const date = new Date(conversation.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Icon based on platform
  const PlatformIcon = () => {
    if (conversation.platform === 'chatgpt') {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
      );
    }
    if (conversation.platform === 'claude') {
      return (
        <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
          <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
        <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group relative p-3 rounded-xl bg-surface-2 border border-border-muted hover:border-zinc-600 hover:bg-surface-3 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <PlatformIcon />
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-text-primary line-clamp-1 leading-none mb-1">
              {conversation.title || 'Untitled Memory'}
            </h3>
            <span className="text-[10px] text-text-secondary font-medium">
              {timeString} • {conversation.messages.length} msgs
            </span>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onCopy}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-md transition-colors"
            title="Copy content"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed pl-8.5">
        {lastMessage}
      </p>
    </div>
  );
};
