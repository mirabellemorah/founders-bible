import { motion } from "framer-motion";
import { Bookmark, Share2, BookOpen } from "lucide-react";
import { getDailyScripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

export default function HomePage() {
  const scripture = getDailyScripture();
  const { toggle, isFavorite } = useFavorites();
  const saved = isFavorite(scripture.id);

  const handleShare = async () => {
    const text = `"${scripture.text}"\n— ${scripture.reference}\n\nvia Founders Bible`;
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

  return (
    <div className="px-5 pt-safe">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-6 pb-2"
      >
        <p className="text-xs font-body text-muted-foreground tracking-widest uppercase">
          {greeting()}
        </p>
        <h1 className="font-display text-2xl font-semibold mt-1 text-foreground">
          Today's Word
        </h1>
      </motion.div>

      {/* Daily Scripture Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 bg-card rounded-2xl p-6 border border-border"
      >
        {/* Theme badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="px-3 py-1 rounded-full bg-scripture text-xs font-body font-medium text-gold-dark tracking-wide">
            {scripture.theme}
          </span>
        </div>

        {/* Scripture text */}
        <blockquote className="font-display text-xl leading-relaxed text-foreground italic">
          "{scripture.text}"
        </blockquote>

        <p className="mt-4 font-body text-sm font-medium text-gold-dark">
          — {scripture.reference}
        </p>

        {/* Divider */}
        <div className="my-5 h-px bg-border" />

        {/* Reflection */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-scripture flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
              Reflection
            </p>
            <p className="text-sm font-body leading-relaxed text-foreground/80">
              {scripture.reflection}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              toggle(scripture.id);
              toast.success(saved ? "Removed from saved" : "Saved to favorites");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium transition-colors ${
              saved
                ? "bg-gold/10 text-gold-dark"
                : "bg-scripture text-foreground"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.5} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-scripture text-foreground font-body text-sm font-medium"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            Share
          </button>
        </div>
      </motion.div>

      {/* Quick themes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 mb-6"
      >
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Explore Themes
        </h2>
        <div className="flex gap-2 flex-wrap">
          {["Leadership", "Courage", "Faith", "Wisdom"].map((t) => (
            <a
              key={t}
              href={`/library?theme=${t}`}
              className="px-4 py-2 rounded-full bg-card border border-border text-xs font-body font-medium text-foreground hover:bg-scripture transition-colors"
            >
              {t}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
