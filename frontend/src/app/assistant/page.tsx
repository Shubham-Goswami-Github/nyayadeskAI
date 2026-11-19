
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  Send,
  Plus,
  Scale,
  MessageSquare,
  FileText,
  LoaderCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { aiAPI, caseAPI } from "@/lib/api";

interface CaseItem {
  id: number;
  case_number: string;
  case_title: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  model?: string;
}

type ChatMode = "general" | "case";

export default function AssistantPage() {
  const [mode, setMode] = useState<ChatMode>("general");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I am NyayaDesk AI. I can help you understand legal matters, analyse case records and answer questions based on uploaded documents.\n\nHow can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const data = await caseAPI.getAll();
        setCases(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load cases. Please check the backend.");
      }
    };

    loadCases();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Hello! I am NyayaDesk AI. How can I assist you today?",
      },
    ]);
    setInput("");
    setError("");
  };

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    if (mode === "case" && !selectedCase) {
      setError("Please select a case before sending your message.");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const result =
        mode === "case"
          ? await aiAPI.chatAboutCase(Number(selectedCase), message)
          : await aiAPI.chat(message);

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.response,
        model: result.model,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to connect to NyayaDesk AI.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f9f7] text-slate-800">

      {/* Header */}
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#174b35] text-white">
            <Scale size={24} />
          </div>

          <div>
            <h1 className="font-bold text-slate-900">
              NyayaDesk AI
            </h1>
            <p className="text-xs text-slate-500">
              Legal Case Intelligence Assistant
            </p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-green-50 disabled:opacity-50"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </header>

      {/* Chat controls */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">

        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => {
                setMode("general");
                setError("");
              }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                mode === "general"
                  ? "bg-white text-[#174b35] shadow-sm"
                  : "text-slate-600"
              }`}
            >
              <MessageSquare size={17} />
              General Chat
            </button>

            <button
              onClick={() => {
                setMode("case");
                setError("");
              }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                mode === "case"
                  ? "bg-white text-[#174b35] shadow-sm"
                  : "text-slate-600"
              }`}
            >
              <FileText size={17} />
              Case Chat
            </button>
          </div>

          {mode === "case" && (
            <select
              value={selectedCase}
              onChange={(event) => {
                setSelectedCase(event.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700 sm:max-w-sm"
            >
              <option value="">Select a case</option>

              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.case_number} - {item.case_title}
                </option>
              ))}
            </select>
          )}
        </div>

        {mode === "case" && selectedCase && (
          <p className="mx-auto mt-2 max-w-4xl text-xs text-green-800">
            AI will use the selected case records and active uploaded documents.
          </p>
        )}
      </div>

      {/* Messages */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">

        <div className="mx-auto max-w-4xl space-y-6">

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#174b35] text-white">
                  <Bot size={20} />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 sm:max-w-[80%] ${
                  message.role === "user"
                    ? "bg-[#174b35] text-white"
                    : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {message.content}
                </p>

                {message.model && (
                  <p className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-400">
                    Powered by {message.model}
                  </p>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                  <User size={19} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#174b35] text-white">
                <Bot size={20} />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <LoaderCircle size={17} className="animate-spin" />
                NyayaDesk AI is thinking...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8">

        <div className="mx-auto max-w-4xl">

          <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-100">

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                mode === "case"
                  ? "Ask something about the selected case..."
                  : "Ask NyayaDesk anything..."
              }
              rows={1}
              disabled={loading}
              className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-60"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              title="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#174b35] text-white transition hover:bg-[#103d2b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={19} />
            </button>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-2 text-[11px] text-slate-400 sm:flex-row sm:items-center">
            <p>Enter to send · Shift + Enter for new line</p>
            <p>AI-generated assistance · Human review required</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
