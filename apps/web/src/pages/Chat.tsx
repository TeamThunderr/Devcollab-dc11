import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Hash, Send, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useStore } from "../store/useStore";
import { useAuth } from "../context/AuthContext";
import { useChat, useSendMessage } from "../hooks/useChat";

const CHANNELS = ["general", "engineering", "design", "random"];

export function Chat() {
  const { projectId, channel: routeChannel } = useParams();
  const numericProjectId = Number(projectId);
  const { role } = useRole();
  const perms = getProjectPermissions(role);
  const { currentUser } = useAuth();

  const [activeChannel, setActiveChannel] = useState(routeChannel || "general");

  // Update active channel if route changes
  useEffect(() => {
    if (routeChannel && routeChannel !== activeChannel) {
      setActiveChannel(routeChannel);
    }
  }, [routeChannel]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, error } = useChat(numericProjectId, activeChannel);
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChannel]);

  const handleSend = async () => {
    if (!input.trim() || !perms.canCollaborate || !numericProjectId) return;
    const contentToSend = input.trim();
    setInput("");
    try {
      await sendMessageMutation.mutateAsync({
        projectId: numericProjectId,
        channel: activeChannel,
        content: contentToSend,
      });
    } catch (err: any) {
      console.error("Failed to send chat message", err);
      alert(err?.response?.data?.message || err?.message || "Failed to send message. You may not have access to this project.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const navigate = useNavigate();

  return (
    <div className="flex h-full bg-white dark:bg-[#191919]">
      {/* Sidebar Channels */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#0a0a0a] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/80">
          <h2 className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Channels</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setActiveChannel(ch);
                navigate(`/projects/${numericProjectId}/chat/${ch}`);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg font-medium text-left transition-colors ${
                activeChannel === ch
                  ? "text-gray-900 dark:text-gray-100 bg-gray-200/70 dark:bg-gray-800/80 shadow-2xs"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/50"
              }`}
            >
              <Hash className={`w-4 h-4 shrink-0 ${activeChannel === ch ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between px-6 flex-shrink-0 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.01em]">
            <Hash className="w-4 h-4 text-gray-500" /> {activeChannel}
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-2">Team discussion and updates for #{activeChannel}</span>
          </div>
        </div>

        {/* Messages Feed */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Access Restricted</h2>
            <p className="text-sm text-gray-500 max-w-md mt-1">
              {(error as any)?.response?.data?.message || "You do not have permission to view or participate in this project's chat."}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            <div className="text-center py-8 border-b border-gray-100 dark:border-[#262626] mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center mx-auto mb-4">
                <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">Welcome to #{activeChannel}</h1>
              <p className="text-gray-500 text-sm mt-1.5 max-w-md mx-auto">This is the start of the #{activeChannel} channel for this project. Ask questions, share updates, or collaborate with the team.</p>
            </div>

            <div className="space-y-4 flex-1">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3.5 group hover:bg-gray-50/60 dark:hover:bg-[#202020]/60 -mx-3 px-3 py-2 rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 mt-0.5">
                    {msg.avatarUrl ? (
                      <img src={msg.avatarUrl} alt={msg.senderName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
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
                        {formatTimestamp(msg.createdAt)}
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
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800/60 flex-shrink-0">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all bg-gray-50/50 dark:bg-gray-900/30">
            <textarea 
              disabled={!perms.canCollaborate || !!error || sendMessageMutation.isPending}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent p-3.5 resize-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:opacity-60"
              placeholder={perms.canCollaborate && !error ? `Message #${activeChannel}... (Press Enter to send, Shift+Enter for new line)` : "Read-only access."}
              rows={2}
            />
            <div className="bg-white/60 dark:bg-gray-900/60 border-t border-gray-200/80 dark:border-gray-800/80 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Shift + Enter for new line</span>
              </div>
              <button 
                onClick={handleSend}
                disabled={!perms.canCollaborate || !input.trim() || !!error || sendMessageMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:shadow-sm"
              >
                {sendMessageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
