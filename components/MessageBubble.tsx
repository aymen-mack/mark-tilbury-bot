"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isThinking?: boolean;
}

function formatContent(content: string) {
  // Split into lines and process
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading 1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-3 mb-1">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-2 mb-1">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      const startIdx = i;
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${startIdx}`} className="list-decimal list-inside space-y-1 my-2 ml-2">
          {listItems.map((item, j) => (
            <li key={j} className="text-gray-200">
              <InlineFormat text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const startIdx = i;
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${startIdx}`} className="list-disc list-inside space-y-1 my-2 ml-2">
          {listItems.map((item, j) => (
            <li key={j} className="text-gray-200">
              <InlineFormat text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-gray-200 leading-relaxed">
        <InlineFormat text={line} />
      </p>
    );
    i++;
  }

  return elements;
}

function InlineFormat({ text }: { text: string }) {
  // Handle **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="bg-[#2a2a2a] text-emerald-400 px-1 py-0.5 rounded text-sm font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function MessageBubble({ message, isStreaming, isThinking }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] bg-[#2a2a2a] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5">
        <img src="/mark-tilbury.jpg" alt="Mark Tilbury" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-sm font-medium text-yellow-400">Mark Tilbury</span>
          {/* Blue verified checkmark */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#FACC15"/>
            <path d="M4.5 8L6.8 10.5L11.5 5.5" stroke="#171717" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-sm space-y-1">
          {isThinking ? (
            <div className="flex items-center gap-1 py-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          ) : (
            <>
              {formatContent(message.content)}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-yellow-400 animate-pulse ml-0.5 align-middle" />
              )}
            </>
          )}
        </div>

        {/* Video cards */}
        {message.videos && message.videos.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Related videos</p>
            <div className="flex flex-col gap-2">
              {message.videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-xl p-2 transition-colors group/video"
                >
                  <div className="relative shrink-0 w-28 h-16 rounded-lg overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/video:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium line-clamp-2 leading-snug group-hover/video:text-white transition-colors">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Mark Tilbury · YouTube</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copy button */}
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy response</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
