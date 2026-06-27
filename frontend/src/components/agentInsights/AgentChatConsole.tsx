import ChatPanel from "../chat/ChatPanel";

interface AgentChatConsoleProps {
  agentName: string;
  projectId: string;
  runId?: string;
  projectName?: string;
}

/** @deprecated Prefer ChatPanel directly. Thin wrapper for backward compatibility. */
export default function AgentChatConsole({
  agentName,
  projectId,
  runId,
  projectName,
}: AgentChatConsoleProps) {
  return (
    <ChatPanel
      embedded
      projectId={projectId}
      projectName={projectName}
      agentName={agentName}
      runId={runId}
      title={`${agentName} Assistant`}
    />
  );
}
