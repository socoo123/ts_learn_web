import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MermaidBlock from "./MermaidBlock";

function Pre({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0];
  if (isValidElement(child)) {
    const className = String((child.props as { className?: string }).className ?? "");
    const text = String((child.props as { children?: unknown }).children ?? "");
    if (className.includes("language-mermaid")) {
      return <MermaidBlock chart={text} />;
    }
  }
  return <pre>{children}</pre>;
}

export default function MarkdownView({ children }: { children: string }) {
  return (
    <div className="tutorial">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{ pre: Pre }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
