import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

type ChannelType = "pipeline" | "chat" | "dashboard";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface WebSocketContextValue {
  subscribe: (channel: ChannelType, projectId?: string) => void;
  unsubscribe: (channel: ChannelType, projectId?: string) => void;
  lastMessages: Record<string, WebSocketMessage | null>;
  sendMessage: (channel: ChannelType, payload: any, projectId?: string) => void;
  connectionStatuses: Record<string, "connecting" | "connected" | "disconnected">;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

const getWsUrl = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use VITE_API_BASE_URL if available, else derive from window.location or fallback
  let url = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  if (url.startsWith('/')) {
    // Relative path, prepend window.location.origin
    url = `${window.location.origin}${url}`;
  }
  url = url.replace(/^https?:/, wsProtocol);
  const urlObj = new URL(url);
  return `${wsProtocol}//${urlObj.host}`;
};

const WS_BASE = getWsUrl();

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastMessages, setLastMessages] = useState<Record<string, WebSocketMessage | null>>({});
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, "connecting" | "connected" | "disconnected">>({});
  
  const sockets = useRef<Record<string, WebSocket>>({});

  const getSocketKey = (channel: string, projectId?: string) => {
    return projectId ? `${channel}-${projectId}` : channel;
  };

  const getPath = (channel: string, projectId?: string) => {
    if (channel === 'dashboard') return '/ws/dashboard';
    return `/ws/${channel}/${projectId}`;
  };

  const subscribe = useCallback((channel: ChannelType, projectId?: string) => {
    const key = getSocketKey(channel, projectId);
    if (sockets.current[key]) return; // Already subscribed

    setConnectionStatuses(prev => ({ ...prev, [key]: "connecting" }));
    const ws = new WebSocket(`${WS_BASE}${getPath(channel, projectId)}`);
    sockets.current[key] = ws;

    ws.onopen = () => {
      setConnectionStatuses(prev => ({ ...prev, [key]: "connected" }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        setLastMessages(prev => ({ ...prev, [key]: data }));
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    ws.onclose = () => {
      setConnectionStatuses(prev => ({ ...prev, [key]: "disconnected" }));
      delete sockets.current[key];
    };

    ws.onerror = () => {
      setConnectionStatuses(prev => ({ ...prev, [key]: "disconnected" }));
    };
  }, []);

  const unsubscribe = useCallback((channel: ChannelType, projectId?: string) => {
    const key = getSocketKey(channel, projectId);
    if (sockets.current[key]) {
      sockets.current[key].close();
      delete sockets.current[key];
      setConnectionStatuses(prev => ({ ...prev, [key]: "disconnected" }));
    }
  }, []);

  const sendMessage = useCallback((channel: ChannelType, payload: any, projectId?: string) => {
    const key = getSocketKey(channel, projectId);
    const ws = sockets.current[key];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.warn(`WebSocket ${key} is not open`);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, lastMessages, sendMessage, connectionStatuses }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (channel: ChannelType, projectId?: string) => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within a WebSocketProvider");

  // Destructure stable callbacks so they — not the whole context object — are deps.
  // subscribe/unsubscribe are useCallback([]) so their references never change,
  // which prevents the infinite re-render loop that occurs when `context` (which
  // includes the mutable lastMessages/connectionStatuses state) is listed as a dep.
  const { subscribe, unsubscribe } = context;

  useEffect(() => {
    subscribe(channel, projectId);
    return () => {
      unsubscribe(channel, projectId);
    };
  }, [channel, projectId, subscribe, unsubscribe]);

  const key = projectId ? `${channel}-${projectId}` : channel;

  return {
    lastMessage: context.lastMessages[key] ?? null,
    status: context.connectionStatuses[key] ?? "disconnected",
    sendMessage: (payload: any) => context.sendMessage(channel, payload, projectId),
  };
};
