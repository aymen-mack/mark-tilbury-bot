"use client";

import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Chat } from "@/types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  messagesUsed: number;
  messageLimit: number;
}

function CreditCounter({ messagesUsed, messageLimit }: { messagesUsed: number; messageLimit: number }) {
  const remaining = messageLimit - messagesUsed;
  const pct = Math.min((messagesUsed / messageLimit) * 100, 100);
  const warnThreshold = Math.max(1, Math.floor(messageLimit * 0.2));
  const isWarning = remaining <= warnThreshold && remaining > 0;
  const isEmpty = remaining <= 0;

  const color = isEmpty ? "text-red-400" : isWarning ? "text-amber-400" : "text-gray-400";
  const barColor = isEmpty ? "bg-red-400" : isWarning ? "bg-amber-400" : "bg-yellow-400";

  return (
    <div className="px-3 pb-3 pt-2 border-t border-[#2a2a2a]">
      <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>
        <Zap size={12} className="shrink-0" />
        <span className="text-xs font-medium">
          {isEmpty
            ? "No messages left"
            : isWarning
            ? `${remaining} message${remaining === 1 ? "" : "s"} left`
            : `${remaining} / ${messageLimit} messages left`}
        </span>
      </div>
      <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  collapsed,
  onToggleCollapse,
  messagesUsed,
  messageLimit,
}: SidebarProps) {
  return (
    <>
      {/* Mobile: fixed overlay sidebar */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#0f0f0f] border-r border-[#2a2a2a] transition-transform duration-300 ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold text-sm truncate">Mark Tilbury AI</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-sm text-gray-300 hover:text-white transition-all"
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>
        </div>

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
                onClick={() => { onSelectChat(chat.id); onToggleCollapse(); }}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="text-sm truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
        </div>

        <CreditCounter messagesUsed={messagesUsed} messageLimit={messageLimit} />
      </div>

      {/* Desktop: inline sidebar */}
      <div
        className={`hidden md:flex flex-col bg-[#0f0f0f] border-r border-[#2a2a2a] transition-all duration-300 relative ${
          collapsed ? "w-0 overflow-hidden" : "w-64"
        }`}
      >
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
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-semibold text-sm truncate">Mark Tilbury AI</span>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-sm text-gray-300 hover:text-white transition-all"
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>
        </div>

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
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
        </div>

        <CreditCounter messagesUsed={messagesUsed} messageLimit={messageLimit} />
      </div>
    </>
  );
}
