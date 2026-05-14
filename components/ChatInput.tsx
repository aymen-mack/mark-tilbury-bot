"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { ArrowUp, Square, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

const SUGGESTED_PROMPTS = [
  "What exactly is the Digital Architect model?",
  "How do I get my first client with no experience?",
  "What skill should I pick to start?",
  "How do I price my service and what should I charge?",
];

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) onSend();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      onChange((finalTranscript || interim).trim());
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Suggested prompts shown only when empty */}
      {!value && !disabled && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onChange(prompt)}
              className="text-left text-xs text-gray-400 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-xl px-3 py-2.5 transition-colors line-clamp-2"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="relative flex items-end bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden focus-within:border-[#3a3a3a] transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening..."
              : "Ask Mark anything about making money online..."
          }
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm px-4 py-3.5 resize-none focus:outline-none max-h-[200px] scrollbar-none"
        />

        <div className="flex items-center gap-1 px-3 py-3 shrink-0">
          {/* Mic button */}
          {supported && !isStreaming && (
            <button
              onClick={toggleVoice}
              title={isListening ? "Stop listening" : "Voice input"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-[#2a2a2a] hover:bg-[#353535] text-gray-400 hover:text-white"
              }`}
            >
              {isListening ? (
                <MicOff size={14} className="text-white" />
              ) : (
                <Mic size={14} />
              )}
            </button>
          )}

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Square size={14} className="text-black fill-black" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowUp size={16} className="text-black" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-700 mt-2">
        Mark Tilbury AI · Digital Architect model · For entertainment purposes only ·{" "}
        <a
          href="https://www.thewealthportal.com/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-500 transition-colors"
        >
          Terms of Service
        </a>
      </p>
    </div>
  );
}
