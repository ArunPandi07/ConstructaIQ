export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_PROMPTS = [
  "Summarize budget risks",
  "What permits are pending?",
  "Who is assigned to the crew?",
];

export function getSuggestedPrompts(pathname: string, search: string): string[] {
  const tab = new URLSearchParams(search).get("tab")?.toLowerCase() ?? "";

  if (pathname.startsWith("/ai-insights")) {
    return [
      "Summarize latest pipeline run",
      "What is the biggest budget risk?",
      "Which agents flagged compliance issues?",
    ];
  }

  if (tab === "schedule") {
    return [
      "What's on the critical path?",
      "Any delayed phases?",
      "What is the next milestone?",
    ];
  }

  if (tab === "materials") {
    return [
      "Which materials lack pricing?",
      "Top supplier risks?",
      "Highest-cost materials?",
    ];
  }

  if (tab === "budget") {
    return [
      "Summarize budget breakdown",
      "Where is contingency allocated?",
      "Any cost overrun risks?",
    ];
  }

  if (tab === "safety") {
    return [
      "Summarize safety risks",
      "Any crane or weather constraints?",
      "What inspections are pending?",
    ];
  }

  if (pathname.match(/^\/projects\/\d+/)) {
    return DEFAULT_PROMPTS;
  }

  return DEFAULT_PROMPTS;
}

export function chatStorageKey(projectId: string, agentName?: string, runId?: string): string {
  const parts = ["constructaiq-chat", projectId];
  if (agentName) parts.push(agentName);
  if (runId) parts.push(runId);
  return parts.join(":");
}

export function loadStoredMessages(key: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    );
  } catch {
    return [];
  }
}

export function saveStoredMessages(key: string, messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(messages.slice(-40)));
  } catch {
    // Ignore quota errors
  }
}
