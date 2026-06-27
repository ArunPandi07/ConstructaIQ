import { useEffect, useState, useRef } from "react";

export interface GpuMetrics {
  gpu_utilization_avg: number;
  vram_peak_mb: number;
  timestamp: string;
}

const getWsUrl = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let url = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  if (url.startsWith('/')) url = `${window.location.origin}${url}`;
  url = url.replace(/^https?:/, wsProtocol);
  const urlObj = new URL(url);
  return `${wsProtocol}//${urlObj.host}`;
};

export function useGpuTelemetry() {
  const [metrics, setMetrics] = useState<GpuMetrics | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(`${wsUrl}/ws/telemetry`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);
          setHistory(prev => {
            const next = [...prev, data.gpu_utilization_avg];
            if (next.length > 20) return next.slice(-20);
            return next;
          });
        } catch (err) {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { metrics, history };
}
