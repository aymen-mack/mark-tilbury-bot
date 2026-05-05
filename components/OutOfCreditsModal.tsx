"use client";

import { useState } from "react";
import { MESSAGE_LIMIT } from "@/lib/constants";

const MESSAGES = [
  {
    headline: "You've been putting AI Mark to work.",
    body: "That tells me you're serious about building something real. If you want the full depth — Mark's complete roadmap, live coaching, and a community of people actually building — that's what the Wealth Portal is for.",
  },
  {
    headline: "Most people leave the webinar and do nothing.",
    body: "You're clearly not that person. You've asked real questions and dug in. The Wealth Portal is built for people like you — the ones who take action.",
  },
  {
    headline: "AI Mark has done his part.",
    body: "Now it's time for the real thing. The Wealth Portal gives you Mark's full coaching, Tom as your head coach, and a community of Digital Architects who are already building. You're ready for the next step.",
  },
  {
    headline: "You've gotten more out of this than most people ever will.",
    body: "If you're ready to go all in, the Wealth Portal is where serious people build real income. The door is open — and the first step is just one click away.",
  },
];

interface OutOfCreditsModalProps {
  show: boolean;
}

export default function OutOfCreditsModal({ show }: OutOfCreditsModalProps) {
  const [msgIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));

  if (!show) return null;

  const msg = MESSAGES[msgIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Card */}
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
        {/* Glow ring around photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-5 ring-2 ring-yellow-400/40 shadow-lg shadow-yellow-400/10">
          <img
            src="/mark-tilbury.jpg"
            alt="Mark Tilbury"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Headline */}
        <h2 className="text-lg font-bold text-white mb-3 leading-snug">
          {msg.headline}
        </h2>

        {/* Body */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {msg.body}
        </p>

        {/* CTA button */}
        <a
          href="https://event.thewealthportal.com/join"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-bold py-3.5 px-6 rounded-xl transition-colors text-sm tracking-wide"
        >
          Join the Wealth Portal →
        </a>

        {/* Footer note */}
        <p className="text-gray-600 text-xs mt-4">
          You've used all {MESSAGE_LIMIT} of your free messages
        </p>
      </div>
    </div>
  );
}
