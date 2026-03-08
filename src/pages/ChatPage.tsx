import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { streamChat } from "@/lib/chatApi";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const prompts = [
"I feel overwhelmed building my startup.",
"I need strength to keep going today.",
"How do I handle fear of failure?",
"Help me negotiate with wisdom.",
"I need wisdom about money & stewardship.",
"I feel alone in my entrepreneurial journey."];


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        }
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="px-5 pt-safe">
        <div className="flex items-center justify-between pt-3 pb-2 border-b-2 border-foreground">
          <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-foreground">
            Founder's Bible
          </p>
          <p className="font-body text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Chat
          </p>
        </div>
        <div className="pt-4 pb-3">
          <h1 className="font-display text-3xl font-black text-foreground leading-[0.9] tracking-tight">
            ASK <span className="italic text-primary">&</span> REFLECT
          </h1>
          <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">
            Share your struggle · Receive scripture & wisdom
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4">
        {messages.length === 0 &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Try saying
              </p>
            </div>
            <div className="space-y-1">
              {prompts.map((p) =>
            <button
              key={p}
              onClick={() => send(p)}
              className="w-full text-left px-4 py-3.5 border-b border-border text-sm font-body text-foreground hover:bg-foreground hover:text-background transition-all">
              
                  "{p}"
                </button>
            )}
            </div>
          </motion.div>
        }

        <AnimatePresence>
          {messages.map((msg) =>
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 ${msg.role === "user" ? "flex justify-end" : ""}`}>
            
              <div
              className={`max-w-[85%] px-4 py-3 text-sm font-body leading-relaxed ${
              msg.role === "user" ?
              "bg-foreground text-background" :
              "bg-card border-l-4 border-primary text-foreground"}`
              }>
              
                {msg.role === "assistant" ?
              <div className="whitespace-pre-wrap">
                    {msg.content.split(/(\*\*.*?\*\*|_".*?"_)/g).map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('_"') && part.endsWith('"_')) {
                    return <em key={i} className="block my-2 font-display text-base leading-relaxed">{part.slice(1, -1)}</em>;
                  }
                  return <span key={i}>{part}</span>;
                })}
                  </div> :

              msg.content
              }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            <div className="inline-flex gap-1.5 bg-card border-l-4 border-primary px-4 py-3">
              {[0, 1, 2].map((i) =>
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />

            )}
            </div>
          </motion.div>
        }
      </div>

      {/* Input */}
      <div className="px-5 pb-24 pt-2 bg-background border-t-2 border-foreground">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="How are you feeling today?"
            className="flex-1 bg-card border-2 border-foreground/10 px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            disabled={isLoading} />
          
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-primary">
            
            <Send className="w-4 h-4 text-background" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>);

}