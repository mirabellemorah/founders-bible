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
    <div className="flex flex-col h-full absolute inset-0">
      {/* Header */}
      <div className="px-5 pt-safe md:pt-6 shrink-0">
        <div className="flex md:hidden items-center justify-between pt-3 pb-2 border-b-2 border-foreground">
          <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-foreground">
            Founder's Bible
          </p>
          <p className="font-body text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Chat
          </p>
        </div>
        <div className="pt-4 pb-3 flex flex-col items-center">
          <h1 className="font-display text-3xl font-black text-foreground leading-[0.9] tracking-tight">
            ASK <span className="italic text-primary">&</span> REFLECT
          </h1>
          <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">
            Share your struggle · Receive scripture & wisdom
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col flex-1">
          {messages.length === 0 &&
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 md:mt-12">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Try saying
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {prompts.map((p) =>
              <button
                key={p}
                onClick={() => send(p)}
                className="w-full text-left px-4 py-4 border border-border bg-card text-sm font-body text-foreground hover:border-primary hover:text-primary transition-all">
                
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
              className={`mt-4 md:mt-6 ${msg.role === "user" ? "flex justify-end" : ""}`}>
              
                <div
                className={`max-w-[85%] px-5 py-4 text-sm md:text-base font-body leading-relaxed ${
                msg.role === "user" ?
                "bg-foreground text-background rounded-2xl rounded-tr-sm" :
                "bg-transparent text-foreground"}`
                }>
                
                  {msg.role === "assistant" ?
                <div className="whitespace-pre-wrap flex gap-4">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-primary flex items-center justify-center mt-1">
                        <Sparkles className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div>
                        {msg.content.split(/(\*\*.*?\*\*|_".*?"_)/g).map((part, i) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
                          }
                          if (part.startsWith('_"') && part.endsWith('"_')) {
                            return <em key={i} className="block my-4 font-display text-lg md:text-xl leading-relaxed border-l-4 border-primary pl-4 py-1">"{part.slice(2, -2)}"</em>;
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                    </div> :

                msg.content
                }
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" &&
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 md:mt-6 flex gap-4">
              <div className="w-6 h-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="inline-flex gap-1.5 py-2">
                {[0, 1, 2].map((i) =>
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              )}
              </div>
            </motion.div>
          }
        </div>
      </div>

      {/* Input */}
      <div className="px-5 pb-24 md:pb-8 pt-4 bg-background border-t-2 border-border md:border-none flex justify-center shrink-0">
        <div className="w-full max-w-3xl flex items-center gap-2 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Share your struggle..."
            className="flex-1 bg-card border-2 border-border px-6 py-4 rounded-full text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors shadow-sm"
            disabled={isLoading} />
          
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-primary">
            
            <Send className="w-4 h-4 text-background -ml-0.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}