import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardHat } from "lucide-react";
import { Skeleton } from "./Skeleton";

const statusMessages = [
  "Initializing agent pipelines",
  "Analyzing contract documents",
  "Reviewing blueprints",
  "Assessing permit requirements",
  "Planning project schedules",
  "Evaluating supplier networks",
  "Optimizing crew allocation",
  "Finalizing intelligence report",
];

export function RingSpinner({ size = 72 }: { size?: number }) {
  const outerR = (size - 8) / 2;
  const midR = (size - 24) / 2;
  const innerR = (size - 40) / 2;
  const outerC = 2 * Math.PI * outerR;
  const midC = 2 * Math.PI * midR;
  const innerC = 2 * Math.PI * innerR;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 animate-spin" viewBox={`0 0 ${size} ${size}`} style={{ animationDuration: "1.8s" }}>
        <defs>
          <linearGradient id="loader-outer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5C518" />
            <stop offset="100%" stopColor="#E2B30D" />
          </linearGradient>
          <linearGradient id="loader-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F5C518" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={outerR} fill="none" stroke="url(#loader-glow)" strokeWidth="3" strokeLinecap="round" strokeDasharray={outerC * 0.6} strokeDashoffset={outerC * 0.15} opacity="0.3" />
        <circle cx={size / 2} cy={size / 2} r={outerR} fill="none" stroke="url(#loader-outer)" strokeWidth="3" strokeLinecap="round" strokeDasharray={outerC * 0.65} strokeDashoffset={outerC * 0.25} />
      </svg>
      <svg className="absolute inset-0 animate-spin" viewBox={`0 0 ${size} ${size}`} style={{ animationDirection: "reverse", animationDuration: "2.8s" }}>
        <circle cx={size / 2} cy={size / 2} r={midR} fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeDasharray={midC * 0.4} strokeDashoffset={midC * 0.1} opacity="0.5" />
      </svg>
      <svg className="absolute inset-0 animate-spin" viewBox={`0 0 ${size} ${size}`} style={{ animationDuration: "1.2s" }}>
        <circle cx={size / 2} cy={size / 2} r={innerR} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeDasharray={innerC * 0.3} strokeDashoffset={innerC * 0.05} opacity="0.15" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <HardHat className="text-[#E2B30D]" style={{ width: size * 0.3, height: size * 0.3 }} strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function StatusDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => setDots((p) => (p.length >= 3 ? "" : p + ".")), 400);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

export function RotatingMessage({ messages = statusMessages, interval = 3000 }: { messages?: string[]; interval?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => setIdx((p) => (p + 1) % messages.length), interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="block"
      >
        {messages[idx]}
        <StatusDots />
      </motion.span>
    </AnimatePresence>
  );
}

export function FullscreenLoader({
  show,
  message,
  rotateMessages,
}: {
  show: boolean;
  message?: string;
  rotateMessages?: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-radial from-[#F5C518]/8 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-radial from-[#E2B30D]/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -ml-40 -mb-40" />

          <div className="flex flex-col items-center gap-6 relative z-10">
            <RingSpinner size={72} />
            <div className="text-center space-y-1.5">
              {message || rotateMessages ? (
                <p className="text-sm font-semibold text-stone-600 min-h-[20px]">
                  {rotateMessages ? (
                    <RotatingMessage messages={statusMessages} />
                  ) : (
                    <span>{message}<StatusDots /></span>
                  )}
                </p>
              ) : null}
              <p className="text-[10px] text-stone-400 font-mono font-medium">ConstructaIQ · v1.0</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LoadingBar({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 right-0 z-[110] h-1 overflow-hidden"
          role="progressbar"
          aria-label="Page loading"
        >
          <motion.div
            className="h-full w-full bg-gradient-to-r from-[#FCD34D] via-[#F5C518] to-[#E2B30D]"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContentSkeleton({ variant = "card", count = 1 }: { variant?: "card" | "kpi" | "text"; count?: number }) {
  if (variant === "kpi") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="kpi-card p-4 space-y-3">
            <Skeleton style={{ height: 12, width: "40%" }} />
            <Skeleton style={{ height: 28, width: "60%" }} />
            <Skeleton style={{ height: 10, width: "80%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} style={{ height: 12, width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center gap-3">
            <Skeleton rounded="lg" style={{ width: 40, height: 40 }} />
            <div className="flex-1 space-y-2">
              <Skeleton style={{ height: 14, width: "50%" }} />
              <Skeleton style={{ height: 10, width: "30%" }} />
            </div>
          </div>
          <div className="space-y-2.5">
            <Skeleton style={{ height: 10 }} />
            <Skeleton style={{ height: 10, width: "85%" }} />
            <Skeleton style={{ height: 10, width: "65%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
