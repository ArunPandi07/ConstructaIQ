import { useState } from "react";
import { Cpu, Send, RefreshCw } from "lucide-react";

interface AutonomousAgent {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "idle" | "active" | "running";
  description: string;
  parameters: string[];
  mockPromptSample: string;
}

const agentsList: AutonomousAgent[] = [
  {
    id: "agent-1",
    name: "ContractAgent",
    role: "Legal & Liability Reviewer",
    icon: "📜",
    status: "idle",
    description:
      "Crawls subcontracts and master layouts to identify liquidated damages clauses, delay penalties, and retainage thresholds.",
    parameters: [
      "Liability cap: 10%",
      "FOB Point: Site",
      "Retainage: Capped at 10%",
    ],
    mockPromptSample:
      "Check if the master contract has an arbitration clause and summaries delay rules.",
  },
  {
    id: "agent-2",
    name: "BlueprintAgent",
    role: "Structural & Material Extractor",
    icon: "📐",
    status: "active",
    description:
      "Evaluates architectural DWG lines and PDFs to calculate concrete volumes, structural steel weight, and fire clearances.",
    parameters: [
      "Egress Code: IBC Sec 1005",
      "Load Limit: 120 PSF",
      "Seismic category: D",
    ],
    mockPromptSample:
      "Do our main exit clearances satisfy commercial IBC standards?",
  },
  {
    id: "agent-3",
    name: "PermitAgent",
    role: "Municipal Filing Coordinator",
    icon: "🏛️",
    status: "idle",
    description:
      "Manages state submittals for grading, sewers, foundations, and fire marshal seals.",
    parameters: [
      "Municipality: Austin Core",
      "Current Queue Stage: 2nd Review",
      "Filing Code: A52",
    ],
    mockPromptSample:
      "List the outstanding permits required before foundations pouring.",
  },
  {
    id: "agent-4",
    name: "ScheduleAgent",
    role: "Timeline & Logistics Planner",
    icon: "🗓️",
    status: "running",
    description:
      "Coordinates delivery sequences, ready-mix truck timings, curing intervals, and sub-framing handoffs.",
    parameters: [
      "Curing threshold: 7 days",
      "Buffer ratio: 15%",
      "Primary path: Concrete Grids",
    ],
    mockPromptSample:
      "Optimise my concrete truck intervals for 95 degrees weather.",
  },
  {
    id: "agent-5",
    name: "SupplierAgent",
    role: "Material & Freight Expeditor",
    icon: "🚚",
    status: "idle",
    description:
      "Interfaces with lumber distributors, quarries, steel fabrication yards to verify lead times.",
    parameters: [
      "Steel Fab lead: 14 Days",
      "Cement supply: Local Mix",
      "Lumber Grade: #2 SYP",
    ],
    mockPromptSample:
      "Find alternative local quarries with less than 3 days lead time.",
  },
  {
    id: "agent-6",
    name: "CrewAgent",
    role: "On-site Staffing & Mobilisation manager",
    icon: "👷",
    status: "idle",
    description:
      "Cross-checks union OSHA cards, certified heavy-lifting credentials, sub-crew rosters.",
    parameters: [
      "OSHA ratio: 100%",
      "Sling training: Certified",
      "Daily count goal: 28 workers",
    ],
    mockPromptSample:
      "Identify if any upcoming framing crew members are missing active safety credentials.",
  },
];

const fallbackAnswers: Record<string, string> = {
  "agent-1":
    "Contract Analysis confirms that Liquidated Damages clause (Sec 14.2) begins exactly 30 calendar days past scheduled substantial completion.",
  "agent-2":
    "Under standard IBC commercial standards, staircase exits require clear egress width of at least 44 inches. Recommending structural adjustment to 48 inches.",
  "agent-3":
    "Foundation safety permits are currently stuck on Stage 3 routing queue due to outstanding geotechnical compactions certifications.",
  "agent-4":
    "For 95-degree hot weather concrete pours, we must introduce hydration retarders (ASTM C494 Type D) to prevent premature flashing.",
  "agent-5":
    "Material Expediters verify that local steel mills are experiencing a 12-day custom rolling hold. Sourcing pre-rolled ASTM A992 grade beams from Houston.",
  "agent-6":
    "Framing crews must show completed OSHA Form 300 logs alongside direct sling certificates for crane operations.",
};

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<AutonomousAgent>(
    agentsList[0],
  );
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Record<string, { sender: "user" | "agent"; text: string }[]>
  >({
    "agent-1": [
      {
        sender: "agent",
        text: "Greetings, I am ContractAgent. I have crawled the master project contract. Retainage is currently set to 10% with a $5k/day late liquidated damage clause. Ask me anything!",
      },
    ],
  });
  const [isReplying, setIsReplying] = useState(false);

  const activeChat = chatHistory[selectedAgent.id] || [
    {
      sender: "agent",
      text: `ConstructaIQ Terminal Online. Loaded ${selectedAgent.name}. Status: ${selectedAgent.status.toUpperCase()}.`,
    },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const query = userInput;
    setUserInput("");
    const updatedHistory = [
      ...activeChat,
      { sender: "user" as const, text: query },
    ];
    setChatHistory((prev) => ({ ...prev, [selectedAgent.id]: updatedHistory }));
    setIsReplying(true);
    setTimeout(() => {
      setChatHistory((prev) => ({
        ...prev,
        [selectedAgent.id]: [
          ...updatedHistory,
          {
            sender: "agent",
            text:
              fallbackAnswers[selectedAgent.id] ||
              "Instruction verified by autonomous construct loops. Site metrics balanced.",
          },
        ],
      }));
      setIsReplying(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <h3
          className="text-sm font-bold tracking-tight pl-1 mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Workspace Autonomous Agents ({agentsList.length})
        </h3>
        {agentsList.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-4 cursor-pointer transition flex justify-between items-start ${isSelected ? "shadow-sm" : ""}`}
              style={
                isSelected
                  ? {
                      border: "2px solid var(--blue-primary)",
                      background: "var(--blue-bg)",
                      borderRadius: 12,
                    }
                  : {
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      borderRadius: 12,
                    }
              }
            >
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: "var(--bg3)" }}
                >
                  {agent.icon}
                </div>
                <div>
                  <h4
                    className="text-xs font-black leading-none"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {agent.name}
                  </h4>
                  <p
                    className="text-[10px] font-bold mt-1 font-mono tracking-wide"
                    style={{ color: "#2e2ec3" }}
                  >
                    {agent.role}
                  </p>
                  <p
                    className="text-[11px] line-clamp-2 mt-1.5 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {agent.description}
                  </p>
                </div>
              </div>
              <span
                className={`status-badge text-[8px] uppercase tracking-widest ${agent.status === "running" ? "animate-pulse" : ""}`}
                style={
                  agent.status === "running"
                    ? {
                        background: "var(--blue-bg)",
                        color: "var(--blue-primary)",
                      }
                    : agent.status === "active"
                      ? {
                          background: "var(--green-bg)",
                          color: "var(--green-primary)",
                        }
                      : { background: "var(--bg3)", color: "var(--text-muted)" }
                }
              >
                {agent.status}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="lg:col-span-2 p-6 flex flex-col justify-between min-h-120"
        style={{
          background: "#242445",
          color: "#fff",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="flex justify-between items-center pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: "var(--blue-primary)", color: "#fff" }}
            >
              {selectedAgent.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-none flex items-center gap-2">
                {selectedAgent.name}
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "var(--green-primary)" }}
                ></span>
              </h3>
              <p
                className="text-[10px] font-mono mt-1"
                style={{ color: "var(--blue-primary)" }}
              >
                {selectedAgent.role}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 text-[10px] font-mono"
            style={{ color: "var(--sidebar-text)" }}
          >
            <Cpu
              className="w-3.5 h-3.5"
              style={{ color: "var(--text-muted)" }}
            />
            <span>LOOP_STATE_OK</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-4 max-h-95 pr-2">
          {activeChat.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 max-w-[85%] text-xs leading-relaxed ${msg.sender === "user" ? "font-medium rounded-tr-none" : "rounded-tl-none space-y-2"}`}
                style={
                  msg.sender === "user"
                    ? {
                        background: "var(--green-primary)",
                        color: "#fff",
                        borderRadius: 12,
                      }
                    : {
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "var(--sidebar-text-active)",
                        borderRadius: 12,
                      }
                }
              >
                {msg.sender === "agent" && (
                  <div
                    className="text-[9px] font-mono uppercase tracking-wider mb-1 font-bold"
                    style={{ color: "var(--blue-primary)" }}
                  >
                    🤖 {selectedAgent.name} response
                  </div>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isReplying && (
            <div className="flex justify-start">
              <div
                className="p-4 text-xs space-y-2 font-mono flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  color: "var(--sidebar-text)",
                }}
              >
                <RefreshCw
                  className="w-4 h-4 animate-spin"
                  style={{ color: "var(--blue-primary)" }}
                />
                <span>Computing zoning guidelines via Gemini model...</span>
              </div>
            </div>
          )}
        </div>

        <div
          className="pt-4 space-y-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-widest pl-1"
            style={{ color: "var(--sidebar-text)" }}
          >
            Suggested inquiries for this agent
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setUserInput(selectedAgent.mockPromptSample)}
              className="px-2.5 py-1 text-[10px] transition text-left"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                color: "var(--sidebar-text)",
              }}
            >
              💡 "{selectedAgent.mockPromptSample}"
            </button>
          </div>
          <form onSubmit={handleSend} className="flex gap-2.5 pt-3">
            <input
              type="text"
              placeholder={`Coordinate with ${selectedAgent.name}...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 px-4 py-3 text-white text-xs focus:outline-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
              }}
              disabled={isReplying}
            />
            <button
              type="submit"
              disabled={isReplying || !userInput.trim()}
              className="px-4 py-3 transition font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1 shrink-0"
              style={
                isReplying || !userInput.trim()
                  ? {
                      background: "var(--text-muted)",
                      color: "#fff",
                      borderRadius: 12,
                    }
                  : {
                      background: "var(--green-primary)",
                      color: "#fff",
                      borderRadius: 12,
                    }
              }
            >
              <Send className="w-3.5 h-3.5" /> Coordinate
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
