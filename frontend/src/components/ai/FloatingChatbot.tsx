"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { aiAPI, caseAPI } from "@/lib/api";

interface CaseItem {
  id: number;
  case_number: string;
  case_title: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: string;
}

type ChatMode = "general" | "case";

const welcomeMessage =
  "Hello! I am NyayaDesk AI. I can help you understand legal matters, analyse case records and answer questions based on uploaded documents.\n\nHow can I help you today?";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("general");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || mode !== "case" || cases.length > 0) return;

    caseAPI
      .getAll()
      .then((data) => setCases(Array.isArray(data) ? data : []))
      .catch(() => setError("Unable to load cases. Please check the backend."));
  }, [isOpen, mode, cases.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, error]);

  const sendMessage = async () => {
    const userMessage = message.trim();
    if (!userMessage || loading) return;
    if (mode === "case" && !selectedCase) {
      setError("Please select a case before sending your message.");
      return;
    }

    setMessages((previous) => [...previous, { role: "user", content: userMessage }]);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const result = mode === "case"
        ? await aiAPI.chatAboutCase(Number(selectedCase), userMessage)
        : await aiAPI.chat(userMessage);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: result.response, model: result.model },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to NyayaDesk AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-xl transition hover:scale-105 hover:bg-green-800"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] flex h-[550px] max-h-[80vh] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-green-800 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2"><Bot size={22} /></div>
              <div>
                <h3 className="font-semibold">NyayaDesk AI</h3>
                <p className="text-xs text-green-100"><Sparkles size={11} className="mr-1 inline" />Legal Case Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 transition hover:bg-white/15" aria-label="Close chatbot"><X size={20} /></button>
          </div>

          <div className="flex gap-1 border-b border-gray-200 bg-white p-2">
            <button
              onClick={() => { setMode("general"); setError(""); }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${mode === "general" ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50"}`}
            ><MessageCircle size={14} />General Chat</button>
            <button
              onClick={() => { setMode("case"); setError(""); }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${mode === "case" ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50"}`}
            ><FileText size={14} />Case Chat</button>
          </div>

          {mode === "case" && (
            <div className="border-b border-gray-200 bg-white px-3 py-2">
              <select
                value={selectedCase}
                onChange={(event) => { setSelectedCase(event.target.value); setError(""); }}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:border-green-600"
              >
                <option value="">Select a case</option>
                {cases.map((item) => <option key={item.id} value={item.id}>{item.case_number} - {item.case_title}</option>)}
              </select>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, index) => (
              <div key={`${index}-${msg.role}`} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800"><Bot size={17} /></div>}
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-sm bg-green-700 text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"}`}>
                  {msg.content}
                  {msg.model && <p className="mt-2 border-t border-gray-200 pt-1.5 text-[10px] text-gray-400">Powered by {msg.model}</p>}
                </div>
                {msg.role === "user" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><User size={17} /></div>}
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={17} className="animate-spin" />NyayaDesk AI is thinking...</div>}
            {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:border-green-600">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage(); } }}
                placeholder={mode === "case" ? "Ask about the selected case..." : "Ask NyayaDesk anything..."}
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button onClick={sendMessage} disabled={!message.trim() || loading} className="rounded-lg bg-green-700 p-2 text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={17} /></button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">AI-generated assistance. Human review required.</p>
          </div>
        </div>
      )}
    </>
  );
}
