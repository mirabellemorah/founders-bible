import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, Share2, BookOpen, Loader2, ArrowRight } from "lucide-react";
import { fetchDailyScripture, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggle, isFavorite } = useFavorites();

  useEffect(() => {
    fetchDailyScripture().then((s) => {
      setScripture(s);
      setLoading(false);
    });
  }, []);

  const saved = scripture ? isFavorite(scripture.id) : false;

  const handleShare = async () => {
    if (!scripture) return;
    const text = `"${scripture.text}"\n— ${scripture.reference}\n\nvia Founder's Bible`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!scripture) {
    return (
      <div className="px-5 pt-6 text-center">
        <p className="text-muted-foreground font-body">No scripture available today.</p>
      </div>
    );
  }

  return (
    <div className="px-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 pb-2">
        <p className="text-xs font-body text-muted-foreground tracking-widest uppercase">{greeting()}</p>
        <h1 className="font-display text-3xl font-bold mt-1 text-foreground leading-tight">
          Today's <span className="italic text-primary">Word</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 bg-foreground rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Decorative element */}
        <div className="absolute top-4 right-4 text-[120px] font-display font-black text-background/5 leading-none select-none pointer-events-none">
          "
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="px-3 py-1 rounded-full bg-primary text-xs font-body font-medium text-primary-foreground tracking-wide">
            {scripture.theme}
          </span>
          <span className="px-3 py-1 rounded-full bg-background/10 text-xs font-body text-background/70">
            {scripture.translation}
          </span>
        </div>

        <blockquote className="font-display text-xl leading-relaxed text-background italic relative z-10">
          "{scripture.text}"
        </blockquote>

        <p className="mt-4 font-body text-sm font-semibold text-primary">— {scripture.reference}</p>

        <div className="my-5 h-px bg-background/10" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs font-body font-medium text-background/50 uppercase tracking-widest mb-1.5">Reflection</p>
            <p className="text-sm font-body leading-relaxed text-background/80">{scripture.reflection}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              toggle(scripture.id);
              toast.success(saved ? "Removed from saved" : "Saved to favorites");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium transition-colors ${
              saved ? "bg-primary text-primary-foreground" : "bg-background/10 text-background"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.5} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-background/10 text-background font-body text-sm font-medium"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            Share
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-foreground">Explore Themes</h2>
          <Link to="/library" className="text-xs font-body font-medium text-primary flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Leadership", "Fear", "Money", "Courage", "Negotiation", "Failure"].map((t) => (
            <Link
              key={t}
              to={`/library?theme=${t}`}
              className="px-4 py-2 rounded-full bg-card border border-border text-xs font-body font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            >
              {t}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
