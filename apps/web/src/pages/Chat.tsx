import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Hash, Send, User, Sparkles } from "lucide-react";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useStore } from "../store/useStore";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    senderName: "Sanjay Balan",
    senderRole: "Admin",
    avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=SANJAY",
    content: "Hey everyone! Welcome to our project workspace 🎉 Feel free to use #general for team alignment and quick updates.",
    timestamp: "10:15 AM",
  },
  {
    id: "msg-2",
    senderName: "Alice Smith",
    senderRole: "Member",
    avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Alice",
    content: "Thanks Sanjay! Excited to collaborate on our tasks and boards.",
    timestamp: "10:18 AM",
  },
];

export function Chat() {
  const { role } = useRole();
  const perms = getProjectPermissions(role);
  const { members } = useStore();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("chat_channel_general_messages");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("chat_channel_general_messages", JSON.stringify(messages));
    } catch (e) {
      // ignore
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !perms.canCollaborate) return;

    const currentMember = members.find(m => String(m.id) === String(currentUser?.id)) || members[0];
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentMember?.name || currentUser?.name || "Sanjay Balan",
      senderRole: currentMember?.role || role || "Admin",
      avatarUrl: currentMember?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser?.name || "User"}`,
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#191919]">
      {/* Sidebar Channels */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#0a0a0a] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/80">
          <h2 className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Channels</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-gray-900 dark:text-gray-100 bg-gray-200/70 dark:bg-gray-800/80 rounded-lg font-medium text-left transition-colors shadow-2xs">
            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> general
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between px-6 flex-shrink-0 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.01em]">
            <Hash className="w-4 h-4 text-gray-500" /> general
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-2">Team discussion and general announcements</span>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          <div className="text-center py-8 border-b border-gray-100 dark:border-[#262626] mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center mx-auto mb-4">
              <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">Welcome to #general</h1>
            <p className="text-gray-500 text-sm mt-1.5 max-w-md mx-auto">This is the start of the #general channel. Ask questions, share updates, or collaborate with the team.</p>
          </div>

          <div className="space-y-4 flex-1">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3.5 group hover:bg-gray-50/60 dark:hover:bg-[#202020]/60 -mx-3 px-3 py-2 rounded-xl transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 mt-0.5">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt={msg.senderName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {msg.senderRole}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800/60 flex-shrink-0">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all bg-gray-50/50 dark:bg-gray-900/30">
            <textarea 
              disabled={!perms.canCollaborate}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent p-3.5 resize-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:opacity-60"
              placeholder={perms.canCollaborate ? "Message #general... (Press Enter to send, Shift+Enter for new line)" : "You are in read-only mode in this channel."}
              rows={2}
            />
            <div className="bg-white/60 dark:bg-gray-900/60 border-t border-gray-200/80 dark:border-gray-800/80 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Shift + Enter for new line</span>
              </div>
              <button 
                onClick={handleSend}
                disabled={!perms.canCollaborate || !input.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
