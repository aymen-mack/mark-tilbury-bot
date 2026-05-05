"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUser, UserButton } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import { Chat, Message } from "@/types";
import { Menu } from "lucide-react";
import { MESSAGE_LIMIT } from "@/lib/constants";

const OUT_OF_CREDITS_MESSAGES = [
  "You've been putting AI Mark to work — you're clearly serious about this.",
  "Most people leave the event and do nothing. You're not that person.",
  "AI Mark has done his part. Ready for the real thing?",
  "You've gotten more out of this than most people ever will.",
];

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    const opts = [
      `Good morning ${firstName}! Ready to make some money today?`,
      `Morning ${firstName}, what are we building today?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (hour >= 12 && hour < 17) {
    const opts = [
      `Hey ${firstName}, what's on your mind?`,
      `Afternoon ${firstName}! What do you want to tackle?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (hour >= 17 && hour < 22) {
    const opts = [
      `Evening ${firstName}, what do you want help with today?`,
      `Hey ${firstName}, what's on your mind this evening?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  const opts = [
    `Still up ${firstName}? What are you working on?`,
    `Late night grind ${firstName}? What can I help with?`,
  ];
  return opts[Math.floor(Math.random() * opts.length)];
}

function storageKey(userId: string) {
  return `mark-tilbury-chats-${userId}`;
}

function loadChats(userId: string): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(userId: string, chats: Chat[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(chats));
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 40) + "...";
}

export default function Home() {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const firstName = user?.firstName ?? "there";
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  const messagesUsed = (user?.publicMetadata?.messagesUsed as number) ?? 0;

  // Stable random message picked once on mount
  const [outOfCreditsMessage] = useState(
    () => OUT_OF_CREDITS_MESSAGES[Math.floor(Math.random() * OUT_OF_CREDITS_MESSAGES.length)]
  );

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Always-fresh ref so sendMessage never reads stale chat history
  const chatsRef = useRef<Chat[]>([]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // Check on initial user load only (returning users who are already at limit)
  useEffect(() => {
    if (user?.id && messagesUsed >= MESSAGE_LIMIT) {
      setOutOfCredits(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load from localStorage once we know the userId
  useEffect(() => {
    if (!userId) return;
    const stored = loadChats(userId);
    setChats(stored);
  }, [userId]);

  // Persist chats to localStorage
  useEffect(() => {
    if (!userId) return;
    if (chats.length > 0) saveChats(userId, chats);
  }, [chats, userId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      userScrolledUpRef.current = distanceFromBottom > 100;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (userScrolledUpRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId, isThinking]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: uuidv4(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput("");
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) setActiveChatId(null);
    },
    [activeChatId]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // Client-side credit check
    if (messagesUsed >= MESSAGE_LIMIT) {
      setOutOfCredits(true);
      return;
    }

    // Track before sending so we know if this is the final allowed message
    const isFinalMessage = messagesUsed + 1 >= MESSAGE_LIMIT;

    // ── 1. Resolve or create a chat ──────────────────────────────
    let chatId = activeChatId;
    const isNewChat = !chatId;
    if (isNewChat) chatId = uuidv4();

    // ── 2. Build message history from always-fresh ref
    const previousMessages = chatsRef.current.find((c) => c.id === chatId)?.messages ?? [];

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const apiMessages = [...previousMessages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    // ── 3. Update UI state ───────────────────────────────────────
    if (isNewChat) {
      const newChat: Chat = {
        id: chatId!,
        title: generateTitle(trimmed),
        messages: [userMessage, assistantMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, userMessage, assistantMessage], updatedAt: Date.now() }
            : c
        )
      );
    }

    setInput("");
    setIsStreaming(true);
    setIsThinking(true);
    userScrolledUpRef.current = false;
    setStreamingMessageId(assistantMessageId);

    // ── 4. Stream the response ───────────────────────────────────
    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 402) {
        setOutOfCredits(true);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.filter(
                (m) => m.id !== assistantMessageId && m.id !== userMessage.id
              ),
            };
          })
        );
        setInput(trimmed);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to API");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.videos) {
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== chatId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, videos: parsed.videos } : m
                    ),
                  };
                })
              );
            }
            if (parsed.text) {
              setIsThinking(false);
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== chatId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + parsed.text }
                        : m
                    ),
                  };
                })
              );
            }
          } catch {
            // ignore individual parse errors
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setIsThinking(false);
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: "Sorry, something went wrong. Please try again." }
                : m
            ),
          };
        })
      );
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
      await user?.reload();
      if (isFinalMessage) setOutOfCredits(true);
    }
  }, [input, isStreaming, activeChatId, messagesUsed, user]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="flex h-screen bg-[#171717] overflow-hidden">
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={createNewChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={deleteChat}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        messagesUsed={messagesUsed}
        messageLimit={MESSAGE_LIMIT}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Menu size={18} />
            </button>
          )}
          <h1 className="text-sm font-medium text-gray-300 flex-1 truncate">
            {activeChat?.title ?? "Mark Tilbury AI"}
          </h1>
          <UserButton />
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-1">{greeting}</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                  Ask me anything about making money online, investing, side hustles, or building long-term wealth.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
              {activeChat.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && message.id === streamingMessageId}
                  isThinking={isThinking && message.id === streamingMessageId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {outOfCredits ? (
          <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-3">
            <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-gray-400 flex-1 leading-snug">{outOfCreditsMessage}</p>
              <a
                href="https://event.thewealthportal.com/join"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Join the Wealth Portal →
              </a>
            </div>
          </div>
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            disabled={false}
          />
        )}
      </div>
    </div>
  );
}
