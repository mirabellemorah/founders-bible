import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Share2, BookOpen, Loader2, ArrowRight, Image, X, ChevronDown } from "lucide-react";
import { fetchDailyScripture, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { fetchBiblePassage, buildExpandedReference, type BibleVerse } from "@/lib/bibleApi";

export default function HomePage() {
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggle, isFavorite } = useFavorites();
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [expandedVerses, setExpandedVerses] = useState<BibleVerse[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandLevel, setExpandLevel] = useState(0);

  useEffect(() => {
    const preferredVersion = (localStorage.getItem("fb-bible-version") || "kjv").toUpperCase();
    fetchDailyScripture(preferredVersion).then((s) => {
      setScripture(s);
      setLoading(false);
    });
  }, []);

  const saved = scripture ? isFavorite(scripture.id) : false;

  const handleShareText = async () => {
    if (!scripture) return;
    const text = `"${scripture.text}"\n— ${scripture.reference}\n\nvia Founder's Bible`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
    setShowShareOptions(false);
  };

  const handleShareImage = async (bg: "dark" | "cream") => {
    if (!scripture) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const w = 1080;
    const h = 1350;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = bg === "dark" ? "#1a1a1a" : "#f9f8f0";
    ctx.fillRect(0, 0, w, h);

    const textColor = bg === "dark" ? "#f9f8f0" : "#1a1a1a";
    const mutedColor = bg === "dark" ? "rgba(249,248,240,0.4)" : "rgba(26,26,26,0.4)";
    const accentColor = bg === "dark" ? "#e85d5d" : "#c44040";
    const badgeColor = bg === "dark" ? "#e85d5d" : "#d4736e";
    const badgeTextColor = bg === "dark" ? "#fff" : "#f9f8f0";

    // Accent bar
    ctx.fillStyle = accentColor;
    ctx.fillRect(80, 80, 6, 120);

    // Theme badge
    ctx.font = "bold 16px sans-serif";
    const badgeWidth = ctx.measureText(scripture.theme.toUpperCase()).width + 40;
    ctx.fillStyle = badgeColor;
    ctx.fillRect(110, 80, badgeWidth, 36);
    ctx.fillStyle = badgeTextColor;
    ctx.fillText(scripture.theme.toUpperCase(), 130, 104);

    // Quote
    ctx.fillStyle = textColor;
    ctx.font = "italic 44px Georgia, serif";
    const words = scripture.text.split(" ");
    let lines: string[] = [];
    let currentLine = "\u201C";
    for (const word of words) {
      const test = currentLine + word + " ";
      if (ctx.measureText(test).width > w - 200) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = test;
      }
    }
    lines.push(currentLine.trim() + "\u201D");
    
    let y = 200;
    for (const line of lines) {
      ctx.fillText(line, 110, y);
      y += 60;
    }

    // Reference
    ctx.fillStyle = accentColor;
    ctx.fillRect(110, y + 20, 60, 3);
    ctx.font = "bold 20px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText(scripture.reference.toUpperCase(), 190, y + 28);

    // Reflection
    ctx.fillStyle = mutedColor;
    ctx.font = "18px sans-serif";
    const refWords = scripture.reflection.split(" ");
    let refLines: string[] = [];
    let refLine = "";
    for (const word of refWords) {
      const test = refLine + word + " ";
      if (ctx.measureText(test).width > w - 220) {
        refLines.push(refLine.trim());
        refLine = word + " ";
      } else {
        refLine = test;
      }
    }
    refLines.push(refLine.trim());
    let ry = y + 80;
    for (const line of refLines) {
      ctx.fillText(line, 110, ry);
      ry += 28;
    }

    // Branding
    ctx.fillStyle = mutedColor;
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("FOUNDER'S BIBLE", 110, h - 80);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "founders-bible-verse.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `"${scripture.text}" — ${scripture.reference}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "founders-bible-verse.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded");
      }
      setShowShareOptions(false);
    }, "image/png");
  };

  const handleLoadMore = async () => {
    if (!scripture) return;
    setLoadingMore(true);
    const nextLevel = expandLevel + 1;
    const extra = nextLevel * 5;
    const ref = buildExpandedReference(scripture.book, scripture.chapter, scripture.verse_start, scripture.verse_end, extra);
    const passage = await fetchBiblePassage(ref);
    if (passage && passage.verses.length > 0) {
      setExpandedVerses(passage.verses);
      setExpandLevel(nextLevel);
    } else {
      toast("No more verses available in this range");
    }
    setLoadingMore(false);
  };

  const founderName = localStorage.getItem("fb-founder-name") || "Founder";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Morning";
    if (h < 17) return "Afternoon";
    return "Evening";
  };

  const dayNum = new Date().getDate().toString().padStart(2, "0");
  

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
      {/* Hero section with giant date */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 pb-2 relative">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Good {greeting()}, {founderName}
            </p>
            <h1 className="font-display text-5xl font-black mt-1 text-foreground leading-[0.9] tracking-tight">
              TODAY'S
              <br />
              <span className="italic text-primary">WORD</span>
            </h1>
          </div>
       {/* Giant decorative day number */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.08, x: 0 }}
            className="overflow-hidden sm:overflow-visible -mr-2 -mb-4 select-none pointer-events-none"
          >
            <p className="font-display text-[140px] font-black leading-none text-foreground">
              {dayNum}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Scripture card — editorial black */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-2 bg-foreground p-6 relative overflow-hidden border-l-4 border-primary"
      >
        {/* Giant decorative quote */}
        <div className="absolute -top-8 -right-4 text-[200px] font-display font-black text-background/[0.03] leading-none select-none pointer-events-none">
          "
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="px-3 py-1 bg-primary text-[10px] font-body font-bold uppercase tracking-wider text-primary-foreground">
            {scripture.theme}
          </span>
          <span className="px-3 py-1 border border-background/20 text-[10px] font-body font-bold uppercase tracking-wider text-background/50">
            {scripture.translation}
          </span>
        </div>

        <blockquote className="font-display text-xl leading-snug text-background italic relative z-10 font-medium">
          "{scripture.text}"
        </blockquote>


        {/* Expanded verses from Bible API */}
        <AnimatePresence>
          {expandedVerses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4 border-t border-background/10 pt-4"
            >
              <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/40 mb-3">
                Full Passage · {expandedVerses.length} verses
              </p>
              <div className="space-y-2">
                {expandedVerses.map((v) => (
                  <p key={v.verse} className="text-sm font-body leading-relaxed text-background/70">
                    <span className="text-[10px] font-bold text-primary mr-1.5">{v.verse}</span>
                    {v.text.trim()}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More button */}
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-background/15 text-background/50 font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50"
        >
          {loadingMore ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expandLevel === 0 ? "Load Full Passage" : "Load More Verses"}
        </button>

        <div className="mt-5 flex items-center gap-3">
          <div className="w-8 h-0.5 bg-primary" />
          <p className="font-body text-xs font-bold uppercase tracking-widest text-primary">
            {scripture.reference}
          </p>
        </div>

        <div className="my-6 h-px bg-background/10" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-body font-bold text-background/40 uppercase tracking-[0.2em] mb-1.5">
              Founder's Reflection
            </p>
            <p className="text-sm font-body leading-relaxed text-background/75">{scripture.reflection}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => {
              toggle(scripture.id);
              toast.success(saved ? "Removed from saved" : "Saved to favorites");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-body text-xs font-bold uppercase tracking-wider transition-all ${
              saved
                ? "bg-primary text-primary-foreground"
                : "border border-background/20 text-background hover:border-primary hover:text-primary"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} strokeWidth={2} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => setShowShareOptions(prev => !prev)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-background/20 text-background font-body text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
          >
            <Share2 className="w-4 h-4" strokeWidth={2} />
            Share
          </button>
        </div>

        {/* Share options */}
        <AnimatePresence>
          {showShareOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-background/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/40">Share as</p>
                  <button onClick={() => setShowShareOptions(false)} className="text-background/40 hover:text-background">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareText}
                    className="flex-1 py-3 border border-background/20 text-background font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                  >
                    Text
                  </button>
                  <button
                    onClick={() => handleShareImage("cream")}
                    className="flex-1 py-3 bg-[#f9f8f0] text-[#1a1a1a] border border-background/20 font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary transition-all"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Image
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Themes section — editorial grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 mb-6"
      >
        <div className="flex items-center justify-between mb-4 border-b-2 border-foreground pb-2">
          <h2 className="font-display text-xs font-black uppercase tracking-[0.2em] text-foreground">Explore Themes</h2>
          <Link to="/library" className="text-[10px] font-body font-bold uppercase tracking-wider text-primary flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Leadership", "Fear", "Money", "Courage", "Negotiation", "Failure"].map((t, i) => (
            <Link
              key={t}
              to={`/library?theme=${t}`}
              className={`px-4 py-2.5 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-2 ${
                i === 0
                  ? "bg-foreground text-background border-foreground hover:bg-primary hover:border-primary"
                  : "bg-transparent text-foreground border-foreground/20 hover:border-primary hover:text-primary"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Decorative bottom element */}
      <div className="mb-4 overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap py-2 border-t border-border">
          {Array(4).fill("SCRIPTURE · WISDOM · COURAGE · FAITH · PURPOSE · ").map((t, i) => (
            <span key={i} className="font-body text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30 mx-4">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
