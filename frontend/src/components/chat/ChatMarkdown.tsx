import type { ReactNode } from "react";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-stone-100 px-1 py-0.5 text-[0.85em] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function ChatMarkdown({ content, className = "" }: ChatMarkdownProps) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc pl-5 space-y-1">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    flushList();

    if (!trimmed) {
      blocks.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    blocks.push(
      <p key={`line-${index}`} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
