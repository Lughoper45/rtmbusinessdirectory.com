import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RATE_LIMIT_USER_MESSAGE } from "@/lib/edgeFunctionErrors";
import { sendDirectoryAssistantMessage, type ChatTurn } from "@/services/directoryAssistant";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME =
  "Hi! I'm your RTM Directory AI assistant. I can help you find businesses, discover grants, or answer questions about growing your business. How can I help you today?";

const quickActions = [
  { label: "Find grants for my business", icon: "💰" },
  { label: "How do I list my business?", icon: "📝" },
  { label: "Restaurant grants in Toronto", icon: "🍽️" },
  { label: "World Cup 2026 opportunities", icon: "⚽" },
];

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toChatTurns = (allMessages: Message[]): ChatTurn[] =>
    allMessages
      .filter((m) => m.id !== "welcome")
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setErrorBanner(null);

    const { reply, error, isRateLimited } = await sendDirectoryAssistantMessage(
      toChatTurns(nextMessages),
    );

    setIsLoading(false);

    if (error || !reply) {
      setErrorBanner(isRateLimited ? RATE_LIMIT_USER_MESSAGE : (error ?? "Something went wrong. Please try again."));
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full shadow-heavy flex items-center justify-center text-white hover:scale-110 transition-transform group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />

        <div className="absolute right-full mr-3 bg-navy text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with AI Assistant
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-navy rotate-45" />
        </div>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 w-80"
          : "bottom-6 right-6 w-[400px] max-w-[calc(100vw-2rem)]"
      }`}
    >
      <div className="bg-background rounded-2xl shadow-heavy border border-border overflow-hidden animate-scale-up">
        <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">RTM Directory AI</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      Online
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-lg">{isMinimized ? "↑" : "↓"}</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-surface-light">
              {errorBanner && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {errorBanner}
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-background border border-border rounded-bl-md"
                    }`}
                  >
                    <p
                      className={`text-sm whitespace-pre-wrap ${
                        message.role === "assistant" ? "text-foreground" : ""
                      }`}
                    >
                      {message.content}
                    </p>
                    <span
                      className={`text-[10px] mt-1 block ${
                        message.role === "user" ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-background border border-border rounded-2xl rounded-bl-md p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 border-t border-border bg-background">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(action.label)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-surface-light border border-border rounded-full text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                  className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <Button
                  variant="hero"
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="h-12 w-12 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="p-3 bg-surface-light text-center">
            <p className="text-sm text-muted-foreground">Click to expand chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatAssistant;
