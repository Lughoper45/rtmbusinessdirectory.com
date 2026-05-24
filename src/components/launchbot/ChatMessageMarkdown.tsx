import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessageMarkdownProps = {
  content: string;
  variant?: "ai" | "user";
};

const ChatMessageMarkdown = ({ content, variant = "ai" }: ChatMessageMarkdownProps) => {
  const isUser = variant === "user";

  return (
    <div
      className={`prose prose-sm max-w-none break-words ${
        isUser
          ? "prose-invert [&_a]:text-white [&_strong]:text-white"
          : "dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-primary prose-li:text-foreground/90"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 font-medium ${
                isUser ? "text-white hover:text-white/90" : "text-primary hover:text-accent"
              }`}
            >
              {children}
            </a>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => (
            <strong className={`font-semibold ${isUser ? "text-white" : "text-primary"}`}>
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessageMarkdown;
