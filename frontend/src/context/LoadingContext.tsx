/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type LoaderType = "fullscreen" | "content" | "bar";

interface LoaderEntry {
  type: LoaderType;
  message?: string;
}

interface LoadingContextValue {
  setLoading: (key: string, loading: boolean, config?: Partial<LoaderEntry>) => void;
  activeLoaders: Map<string, LoaderEntry>;
  routeTransition: boolean;
  hasFullscreenLoader: boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeLoaders, setActiveLoaders] = useState<Map<string, LoaderEntry>>(new Map());
  const [routeTransition, setRouteTransition] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const setLoading = useCallback(
    (key: string, loading: boolean, config?: Partial<LoaderEntry>) => {
      setActiveLoaders((prev) => {
        const next = new Map(prev);
        if (loading) {
          next.set(key, { type: config?.type ?? "fullscreen", message: config?.message });
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setRouteTransition(true);
      const timer = setTimeout(() => setRouteTransition(false), 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const hasFullscreenLoader = Array.from(activeLoaders.values()).some(
    (e) => e.type === "fullscreen",
  );

  return (
    <LoadingContext.Provider
      value={{ setLoading, activeLoaders, routeTransition, hasFullscreenLoader }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside <LoadingProvider>");
  return ctx;
}
