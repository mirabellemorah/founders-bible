import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { scriptures } from "@/data/scriptures";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const prompts = [
  "I feel overwhelmed building my startup.",
  "I need strength today.",
  "I feel discouraged.",
  "Help me find purpose.",
];

function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  let scripture;
  if (lower.includes("overwhelm") || lower.includes("stress") || lower.includes("burn")) {
    scripture = scriptures.find((s) => s.theme === "Patience") || scriptures[7];
  } else if (lower.includes("discourage") || lower.includes("fail") || lower.includes("give up")) {
    scripture = scriptures.find((s) => s.theme === "Perseverance") || scriptures[3];
  } else if (lower.includes("strength") || lower.includes("strong") || lower.includes("weak")) {
    scripture = scriptures.find((s) => s.theme === "Courage") || scriptures[0];
  } else if (lower.includes("purpose") || lower.includes("meaning") || lower.includes("why")) {
    scripture = scriptures.find((s) => s.theme === "Purpose") || scriptures[1];
  } else if (lower.includes("wisdom") || lower.includes("decision") || lower.includes("confused")) {
    scripture = scriptures.find((s) => s.theme === "Wisdom") || scriptures[6];
  } else if (lower.includes("lead") || lower.includes("team") || lower.includes("manage")) {
    scripture = scriptures.find((s) => s.theme === "Leadership") || scriptures[4];
  } else {
    scripture = scriptures.find((s) => s.theme === "Faith") || scriptures[2];
  }

  return `📖 **${scripture.reference}**\n\n_"${scripture.text}"_\n\n${scripture.reflection}\n\n✨ Remember — you are not alone on this journey. Every great builder walks by faith, one step at a time.`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="px-5 pt-safe">
        <div className="pt-6 pb-3">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            AI Reflection
          </h1>
          <p className="text-xs font-body text-muted-foreground mt-1">
            Share how you're feeling. Receive scripture & encouragement.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-widest">
                Try saying
              </p>
            </div>
            <div className="space-y-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground hover:bg-scripture transition-colors"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 ${msg.role === "user" ? "flex justify-end" : ""}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="whitespace-pre-wrap">
                    {msg.content.split(/(\*\*.*?\*\*|_".*?"_)/g).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i} className="text-gold-dark">{part.slice(2, -2)}</strong>;
                      }
                      if (part.startsWith('_"') && part.endsWith('"_')) {
                        return <em key={i} className="block my-2 font-display text-base leading-relaxed">{part.slice(1, -1)}</em>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <div className="inline-flex gap-1.5 bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gold"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-24 pt-2 bg-background">
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="How are you feeling today?"
            className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
