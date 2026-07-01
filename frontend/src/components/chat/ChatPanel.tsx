import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Copy, Loader2, RotateCcw, Send, User } from "lucide-react";
import { getToken } from "../../services/apiClient";
import {
  chatStorageKey,
  getSuggestedPrompts,
  loadStoredMessages,
  saveStoredMessages,
  type ChatMessage,
} from "../../utils/chatPrompts";
import ChatMarkdown from "./ChatMarkdown";

type ChatSocketMessage = {
  type: "CHAT_TOKEN" | "CHAT_DONE" | "CHAT_ERROR" | "CHAT_RESET_DONE";
  content?: string;
  message?: string;
};

export interface ChatPanelProps {
  projectId: string;
  projectName?: string;
  agentName?: string;
  runId?: string;
  embedded?: boolean;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const MAX_RECONNECT_ATTEMPTS = 5;

const getWsBase = () => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  let url = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  if (url.startsWith("/")) {
    url = `${window.location.origin}${url}`;
  }
  url = url.replace(/^https?:/, wsProtocol);
  const urlObj = new URL(url);
  return `${wsProtocol}//${urlObj.host}`;
};

const generateSessionId = () => {

  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function ChatPanel({
  projectId,
  projectName,
  agentName,
  runId,
  embedded = false,
  showHeader = true,
  title = "ConstructaIQ Assistant",
  subtitle,
  className = "",
}: ChatPanelProps) {
  const location = useLocation();
  const storageKey = chatStorageKey(projectId, agentName, runId);
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadStoredMessages(storageKey),
  );
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const sessionIdRef = useRef(generateSessionId());
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamingRef = useRef("");
  const reconnectTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const resolvedSubtitle =
    subtitle ??
    (projectId
      ? projectName || `Project ${projectId}`
      : "Select a project to chat");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    saveStoredMessages(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    setMessages(loadStoredMessages(storageKey));
    streamingRef.current = "";
    setStreamingContent("");
    setIsStreaming(false);
    sessionIdRef.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, [storageKey]);

  const connectWebSocket = useCallback(() => {
    if (!projectId) return;

    const token = getToken();
    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    wsRef.current?.close();
    setConnectionStatus("connecting");

    const query = new URLSearchParams({ token });
    const ws = new WebSocket(`${getWsBase()}/ws/chat/${projectId}?${query.toString()}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current || wsRef.current !== ws) return;
      setConnectionStatus("connected");
      setReconnectAttempt(0);
    };

    ws.onclose = () => {
      if (!mountedRef.current || wsRef.current !== ws) return;
      setConnectionStatus("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      if (!mountedRef.current || wsRef.current !== ws) return;
      setConnectionStatus("disconnected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatSocketMessage;
        if (data.type === "CHAT_TOKEN" && data.content) {
          streamingRef.current += data.content;
          setStreamingContent(streamingRef.current);
          return;
        }

        if (data.type === "CHAT_DONE") {
          const finalText = streamingRef.current.trim();
          if (finalText) {
            setMessages((prev) => [...prev, { role: "assistant", content: finalText }]);
          }
          streamingRef.current = "";
          setStreamingContent("");
          setIsStreaming(false);
          return;
        }

        if (data.type === "CHAT_RESET_DONE") {
          setMessages([]);
          streamingRef.current = "";
          setStreamingContent("");
          setIsStreaming(false);
          return;
        }

        if (data.type === "CHAT_ERROR") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.message || "Something went wrong. Please try again.",
            },
          ]);
          streamingRef.current = "";
          setStreamingContent("");
          setIsStreaming(false);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Received an invalid response from the assistant.",
          },
        ]);
        streamingRef.current = "";
        setStreamingContent("");
        setIsStreaming(false);
      }
    };
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!projectId) {
      wsRef.current?.close();
      wsRef.current = null;
      setConnectionStatus("disconnected");
      return () => {
        mountedRef.current = false;
      };
    }

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [projectId, connectWebSocket]);

  useEffect(() => {
    if (!projectId || connectionStatus !== "disconnected") return;
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) return;

    const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000);
    reconnectTimerRef.current = window.setTimeout(() => {
      setReconnectAttempt((prev) => prev + 1);
      connectWebSocket();
    }, delay);

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectionStatus, reconnectAttempt, projectId, connectWebSocket]);

  const sendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text || !projectId || isStreaming) return;

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Chat connection is not ready. Please wait a moment and retry.",
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      streamingRef.current = "";
      setStreamingContent("");
      setIsStreaming(true);

      ws.send(
        JSON.stringify({
          type: "CHAT_MESSAGE",
          content: text,
          session_id: sessionIdRef.current,
          ...(agentName ? { agent_name: agentName } : {}),
          ...(runId ? { run_id: runId } : {}),
        }),
      );
    },
    [projectId, isStreaming, agentName, runId],
  );

  const clearChat = useCallback(() => {
    const ws = wsRef.current;
    const previousSessionId = sessionIdRef.current;
    setMessages([]);
    streamingRef.current = "";
    setStreamingContent("");
    setIsStreaming(false);
    sessionIdRef.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    saveStoredMessages(storageKey, []);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "CHAT_RESET",
          session_id: previousSessionId,
        }),
      );
    }
  }, [storageKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Ignore clipboard failures
    }
  };

  const statusLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "connecting"
        ? "Connecting..."
        : reconnectAttempt >= MAX_RECONNECT_ATTEMPTS
          ? "Offline"
          : "Reconnecting...";

  const panelHeightClass = embedded
    ? "h-[400px]"
    : "h-[520px] max-h-[70vh]";

  return (
    <div
      className={`bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${panelHeightClass} ${className}`}
    >
      {showHeader && (
        <div className="bg-stone-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="w-5 h-5 text-[#F5C518] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">{title}</h3>
              <p className="text-[11px] text-stone-300 truncate">{resolvedSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearChat}
            disabled={!projectId || isStreaming}
            className="p-1 rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="px-4 py-2 text-[11px] text-stone-500 border-b border-stone-100 bg-stone-50 flex items-center justify-between gap-2">
        <span>{statusLabel}</span>
        {connectionStatus === "disconnected" && reconnectAttempt >= MAX_RECONNECT_ATTEMPTS && (
          <button
            type="button"
            onClick={() => {
              setReconnectAttempt(0);
              connectWebSocket();
            }}
            className="text-stone-700 underline"
          >
            Reconnect
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
        {!projectId ? (
          <div className="text-sm text-stone-500 text-center py-10 px-4">
            Open a project from Projects or Project Details to ask questions about
            budget, risks, schedule, permits, crew, and safety.
          </div>
        ) : messages.length === 0 && !streamingContent ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl text-sm max-w-[85%] bg-white border border-stone-200 text-stone-800">
                Hi! I can answer questions about{" "}
                <span className="font-semibold">{projectName || `Project ${projectId}`}</span>
                {agentName ? (
                  <>
                    {" "}
                    from the perspective of <span className="font-semibold">{agentName}</span>
                  </>
                ) : null}
                . Try one of the prompts below or ask your own question.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming || connectionStatus !== "connected"}
                  className="text-xs px-3 py-1.5 rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user"
                ? "bg-[#F5C518] text-stone-900"
                : "bg-stone-800 text-stone-100"
                }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`group relative p-3 rounded-xl text-sm max-w-[85%] ${msg.role === "user"
                ? "bg-[#F5C518]/10 border border-[#F5C518]/30 text-stone-900 whitespace-pre-wrap leading-relaxed"
                : "bg-white border border-stone-200 text-stone-800"
                }`}
            >
              {msg.role === "assistant" ? (
                <ChatMarkdown content={msg.content} />
              ) : (
                msg.content
              )}
              {msg.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => copyMessage(msg.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-stone-100"
                  aria-label="Copy answer"
                  title="Copy answer"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                </button>
              )}
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl text-sm max-w-[85%] bg-white border border-stone-200 text-stone-800">
              <ChatMarkdown content={streamingContent} />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl text-sm bg-white border border-stone-200 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              <span className="text-stone-500">Assistant is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-stone-200 bg-white shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              projectId
                ? "Ask about budget, risks, schedule..."
                : "Select a project first"
            }
            disabled={!projectId || isStreaming}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100"
          />
          <button
            type="submit"
            disabled={
              !projectId ||
              isStreaming ||
              !input.trim() ||
              connectionStatus !== "connected"
            }
            className="shrink-0 bg-stone-800 hover:bg-stone-900 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
