import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Bot, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RATE_LIMIT_USER_MESSAGE } from "@/lib/edgeFunctionErrors";
import {
  sendLaunchBotMessage,
  type ChatTurn,
} from "@/services/directoryAssistant";
import { executeLaunchBotAction } from "@/services/launchBotActions";
import ChatMessageMarkdown from "@/components/launchbot/ChatMessageMarkdown";
import WorkflowStepper from "@/components/launchbot/WorkflowStepper";
import LaunchBotActionBar from "@/components/launchbot/LaunchBotActionBar";
import MasterProfileWizard from "@/components/grantpilot/MasterProfileWizard";
import type { LaunchBotAction, LaunchBotMessage, LaunchBotWorkflow } from "@/types/launchBot";

const WELCOME =
  "Hello! I'm **LaunchBot**, your RTM business coach. I can guide you through **grants**, **membership**, and **listing your business** — with one-click next steps below each reply.\n\nWhat would you like to do today?";

const WELCOME_ACTIONS: LaunchBotAction[] = [
  { id: "open_grants", label: "Browse grants", style: "primary" },
  { id: "membership_checkout", label: "Join RTM — $100/yr", style: "secondary" },
  { id: "auth_sign_in", label: "Sign in", style: "outline" },
];

const suggestedPrompts = [
  "Show me grants I qualify for",
  "How do I start processing a grant with RTM?",
  "How do I join RTM membership?",
];

const AIChatAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<LaunchBotMessage[]>([
    { id: "welcome", role: "ai", content: WELCOME, actions: WELCOME_ACTIONS },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<LaunchBotWorkflow | null>(null);
  const [profileWizardOpen, setProfileWizardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeWorkflow]);

  const toChatTurns = (allMessages: LaunchBotMessage[]): ChatTurn[] =>
    allMessages
      .filter((m) => m.id !== "welcome")
      .slice(-12)
      .map(({ role, content }) => ({
        role: role === "user" ? "user" : "assistant",
        content,
      }));

  const runAction = async (action: LaunchBotAction) => {
    await executeLaunchBotAction(action, {
      navigate,
      openProfileWizard: () => setProfileWizardOpen(true),
      onError: setErrorBanner,
      onActionStart: () => setActionBusy(true),
      onActionEnd: () => setActionBusy(false),
    });
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    const userMessage: LaunchBotMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setErrorBanner(null);

    const { reply, actions, workflow, error, isRateLimited } = await sendLaunchBotMessage(
      toChatTurns(nextMessages),
    );

    setIsLoading(false);

    if (error || !reply) {
      setErrorBanner(
        isRateLimited ? RATE_LIMIT_USER_MESSAGE : (error ?? "Something went wrong. Please try again."),
      );
      return;
    }

    if (workflow) setActiveWorkflow(workflow);

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: reply,
        actions: actions ?? [],
        workflow,
      },
    ]);
  };

  const latestAiMessage = [...messages].reverse().find((m) => m.role === "ai");

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full shadow-heavy flex items-center justify-center text-white hover:scale-110 transition-transform group"
        aria-label="Open LaunchBot"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />

        <div className="absolute right-full mr-3 bg-navy text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with LaunchBot
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-navy rotate-45" />
        </div>
      </button>
    );
  }

  return (
    <>
      <div
        className={`fixed z-50 transition-all duration-300 ${
          isMinimized
            ? "bottom-6 right-6 w-80"
            : "bottom-6 right-6 w-[min(100vw-2rem,420px)] max-w-[calc(100vw-2rem)]"
        }`}
      >
        <div className="bg-background rounded-2xl shadow-heavy border border-border overflow-hidden animate-scale-up flex flex-col max-h-[min(78vh,620px)]">
          <div className="bg-gradient-to-r from-navy to-primary p-4 text-white shrink-0 border-b-2 border-accent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">LaunchBot</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        Guided workflow coach
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
                >
                  {isMinimized ? (
                    <MessageCircle className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {activeWorkflow && <WorkflowStepper workflow={activeWorkflow} />}

              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-surface-light">
                {errorBanner && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {errorBanner}
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] p-3 rounded-2xl text-sm ${
                        message.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-background border border-border rounded-bl-md shadow-sm"
                      }`}
                    >
                      <ChatMessageMarkdown
                        content={message.content}
                        variant={message.role === "user" ? "user" : "ai"}
                      />
                      {message.role === "ai" &&
                        message.id === latestAiMessage?.id &&
                        message.actions &&
                        message.actions.length > 0 && (
                          <LaunchBotActionBar
                            actions={message.actions}
                            busy={actionBusy}
                            onAction={runAction}
                          />
                        )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-2xl rounded-bl-md p-3 flex gap-1">
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
                )}

                {messages.length <= 1 && !isLoading && (
                  <div className="space-y-2 pt-1">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        disabled={isLoading}
                        className="w-full text-left p-2.5 rounded-xl bg-background border border-border hover:border-primary/50 text-xs text-muted-foreground disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border bg-background shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask LaunchBot..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading || actionBusy}
                    className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                  <Button
                    variant="hero"
                    size="icon"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading || actionBusy}
                    className="h-12 w-12 rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {isMinimized && (
            <div className="p-3 bg-surface-light text-center">
              <p className="text-sm text-muted-foreground">Click to expand LaunchBot</p>
            </div>
          )}
        </div>
      </div>

      {profileWizardOpen && (
        <MasterProfileWizard
          onClose={() => setProfileWizardOpen(false)}
          onComplete={() => {
            setProfileWizardOpen(false);
            setErrorBanner(null);
          }}
        />
      )}
    </>
  );
};

export default AIChatAssistant;
