"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import type { Message, GoalsPageData } from "@/lib/types";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import GoalCard from "@/components/patient/GoalCard";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [goalData, setGoalData] = useState<GoalsPageData | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load initial messages and goals
  useEffect(() => {
    Promise.all([
      apiGet<{ messages: Message[] }>("/api/patient/chat/messages"),
      apiGet<GoalsPageData>("/api/patient/goals").catch(() => null),
    ])
      .then(([chatData, goals]) => {
        setMessages(chatData.messages || []);
        if (goals) setGoalData(goals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Set up SSE
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const es = new EventSource(
      `${API_BASE_URL}/api/patient/chat/stream?token=${token}`
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some((m) => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          setSending(false);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistic UI: add patient message immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      content_html: text,
      created_at: new Date().toISOString(),
      exercise_videos: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const response = await apiPost<{ messages: Message[] }>(
        "/api/patient/chat/send",
        { message: text }
      );

      // Replace all messages with the full list from the server
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error("Send failed:", err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInput(text); // Restore input
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border bg-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text">Health Coach</h1>
              <p className="text-xs text-text-faint">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto py-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-dark">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
                </svg>
              </div>
              <h2 className="font-semibold text-text mb-1">Start a Conversation</h2>
              <p className="text-sm text-text-muted max-w-sm">
                Say hello to your AI health coach. Ask about exercises, track progress, or get motivated.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                <path d="m21.854 2.147-10.94 10.939" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar - Goal & Exercises */}
      <div className="hidden lg:block w-[300px] border-l border-border bg-white overflow-y-auto flex-shrink-0">
        <div className="p-5 space-y-5">
          <h2 className="text-xs font-semibold text-text-faint uppercase tracking-wider">
            Your Progress
          </h2>

          {/* Goal */}
          {goalData?.goal && <GoalCard goal={goalData.goal} />}

          {!goalData?.goal && (
            <div className="rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-text-faint">
                No goal set yet. Ask your coach to help you set one.
              </p>
            </div>
          )}

          {/* Adherence */}
          {goalData?.adherence && (
            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-text mb-3">Adherence</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-semibold text-success">
                  {goalData.adherence.adherence_pct}%
                </span>
                <span className="text-xs text-text-faint">
                  {goalData.adherence.streak} day streak
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${goalData.adherence.adherence_pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Weekly activity */}
          {goalData?.week_days && (
            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-text mb-3">This Week</h3>
              <div className="flex items-center justify-between">
                {goalData.week_days.map((day) => (
                  <div key={day.label} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        day.completed
                          ? "bg-success text-white"
                          : day.is_today
                          ? "border-2 border-accent-dark text-accent-dark"
                          : "bg-surface text-text-faint"
                      }`}
                    >
                      {day.completed ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        day.label.charAt(0)
                      )}
                    </div>
                    <span className="text-[10px] text-text-faint">{day.label.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
