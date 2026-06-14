import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardHat } from "lucide-react";

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
                    <>
                      {message}
                      <StatusDots />
                    </>
                  )}
                </p>
              ) : null}
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
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F5C518] via-[#FCD34D] to-[#E2B30D] z-[99] origin-left shadow-glow"
        />
      )}
    </AnimatePresence>
  );
}
