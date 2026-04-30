"use client";

import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Chat } from "@/types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <div
      className={`flex flex-col bg-[#0f0f0f] border-r border-[#2a2a2a] transition-all duration-300 relative ${
        collapsed ? "w-0 overflow-hidden" : "w-64"
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-gray-400" />
        ) : (
          <ChevronLeft size={12} className="text-gray-400" />
        )}
      </button>

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-semibold text-sm truncate">
            Mark Tilbury AI
          </span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-sm text-gray-300 hover:text-white transition-all"
        >
          <Plus size={16} />
          <span>New chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin">
        {chats.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-8 px-2">
            No chats yet. Start a new conversation!
          </p>
        )}
        {chats
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                activeChatId === chat.id
                  ? "bg-[#252525] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="text-sm truncate flex-1">{chat.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
