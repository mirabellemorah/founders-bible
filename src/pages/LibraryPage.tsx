import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, ArrowRight, Search, X, Share2, ChevronDown, BookOpen, Image } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { fetchBiblePassage, type BiblePassage } from "@/lib/bibleApi";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const positiveThemes = ["Leadership", "Courage", "Faith", "Patience", "Discipline", "Purpose", "Wisdom", "Perseverance", "Hope", "Love", "Humility", "Gratitude", "Trust", "Strength", "Peace", "Integrity"];
const realThemes = ["Fear", "Money", "Negotiation", "Anxiety", "Failure", "Anger", "Jealousy", "Loneliness", "Doubt", "Greed", "Pride", "Suffering"];

const SCRIPTURES_PER_PAGE = 5;

// Common bible books for quick access
const popularBooks = ["Genesis", "Psalms", "Proverbs", "Isaiah", "Matthew", "John", "Romans", "Philippians", "James", "Revelation"];

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get("theme") as Theme) || null;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(initialTheme);
  const [filteredScriptures, setFilteredScriptures] = useState<Scripture[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "positive" | "real">("all");
  const [visibleCount, setVisibleCount] = useState(SCRIPTURES_PER_PAGE);
  const { toggle, isFavorite } = useFavorites();
  const stickyRef = useRef<HTMLDivElement>(null);

  // Bible tab state
  const [activeTab, setActiveTab] = useState<"themes" | "bible">("themes");
  const [bibleSearch, setBibleSearch] = useState("");
  const [bibleResult, setBibleResult] = useState<BiblePassage | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState("");

  // Highlight state
  const [highlightedText, setHighlightedText] = useState("");
  const [highlightRef, setHighlightRef] = useState("");
  const [showHighlightBar, setShowHighlightBar] = useState(false);

  useEffect(() => {
    if (selectedTheme) {
      setLoadingTheme(true);
      setVisibleCount(SCRIPTURES_PER_PAGE);
      fetchScripturesByTheme(selectedTheme).then((s) => {
        setFilteredScriptures(s);
        setLoadingTheme(false);
      });
    } else {
      setFilteredScriptures([]);
    }
  }, [selectedTheme]);

  const displayThemes = activeCategory === "all"
    ? themes
    : activeCategory === "positive"
      ? themes.filter(t => positiveThemes.includes(t))
      : themes.filter(t => realThemes.includes(t));

  const visibleScriptures = filteredScriptures.slice(0, visibleCount);
  const hasMore = visibleCount < filteredScriptures.length;

  const handleBibleSearch = async () => {
    if (!bibleSearch.trim()) return;
    setBibleLoading(true);
    setBibleError("");
    setBibleResult(null);
    const result = await fetchBiblePassage(bibleSearch.trim());
    if (result) {
      setBibleResult(result);
    } else {
      setBibleError("Could not find that reference. Try something like \"John 3:16\" or \"Psalm 23\".");
    }
    setBibleLoading(false);
  };

  // Handle text selection for highlighting
  const handleTextSelection = useCallback((reference: string) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 5) {
      setHighlightedText(text);
      setHighlightRef(reference);
      setShowHighlightBar(true);
    }
  }, []);

  const handleShareHighlight = async (mode: "text" | "dark" | "cream") => {
    if (!highlightedText) return;

    if (mode === "text") {
      const shareText = `"${highlightedText}"\n${highlightRef}\n\nvia Founder's Bible`;
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard");
      }
    } else {
      // Generate image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const w = 1080, h = 1350;
      canvas.width = w;
      canvas.height = h;

      const isDark = mode === "dark";
      ctx.fillStyle = isDark ? "#1a1a1a" : "#f9f8f0";
      ctx.fillRect(0, 0, w, h);

      const textColor = isDark ? "#f9f8f0" : "#1a1a1a";
      const accentColor = isDark ? "#e85d5d" : "#c44040";
      const mutedColor = isDark ? "rgba(249,248,240,0.4)" : "rgba(26,26,26,0.4)";

      // Accent bar
      ctx.fillStyle = accentColor;
      ctx.fillRect(80, 80, 6, 120);

      // Quote text
      ctx.fillStyle = textColor;
      ctx.font = "italic 44px Georgia, serif";
      const words = highlightedText.split(" ");
      const lines: string[] = [];
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
      ctx.fillText(highlightRef.toUpperCase(), 190, y + 28);

      // Branding
      ctx.fillStyle = mutedColor;
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("FOUNDER'S BIBLE", 110, h - 80);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "founders-bible-highlight.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "founders-bible-highlight.png";
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Image downloaded");
        }
      }, "image/png");
    }

    setShowHighlightBar(false);
    setHighlightedText("");
  };

  return (
    <div className="px-5">
      {/* Hero header */}
      <div className="pt-6 pb-4 relative">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute -top-2 -right-2 font-display text-[100px] font-black text-foreground leading-none select-none pointer-events-none"
        >
          LIB
        </motion.p>
        <h1 className="font-display text-5xl font-black text-foreground leading-[0.9] tracking-tight relative z-10">
          THE
          <br />
          <span className="italic text-primary">LIBRARY</span>
        </h1>
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-muted-foreground mt-3">
          {themes.length} themes · Browse scripture
        </p>
      </div>

      {/* Main tabs: Themes / Bible */}
      <div className="flex gap-0 mb-5 border-b-2 border-foreground">
        {[
          { key: "themes" as const, label: "Themes" },
          { key: "bible" as const, label: "Popular Books" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Highlight action bar */}
      <AnimatePresence>
        {showHighlightBar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-0 left-0 right-0 z-50 bg-foreground p-4 shadow-lg"
          >
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/60">
                  Selected text
                </p>
                <button onClick={() => { setShowHighlightBar(false); setHighlightedText(""); }}>
                  <X className="w-4 h-4 text-background/60" />
                </button>
              </div>
              <p className="text-xs font-body text-background/80 italic line-clamp-2 mb-3">
                "{highlightedText}"
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleShareHighlight("text")}
                  className="flex-1 py-2.5 border border-background/20 text-background font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Text
                </button>
                <button
                  onClick={() => handleShareHighlight("dark")}
                  className="flex-1 py-2.5 bg-[hsl(var(--card))] text-foreground border border-background/20 font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary transition-all flex items-center justify-center gap-1.5"
                >
                  <Image className="w-3.5 h-3.5" /> Dark
                </button>
                <button
                  onClick={() => handleShareHighlight("cream")}
                  className="flex-1 py-2.5 bg-background text-foreground border border-background/20 font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary transition-all flex items-center justify-center gap-1.5"
                >
                  <Image className="w-3.5 h-3.5" /> Cream
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === "themes" && (
        <>
          {/* Category tabs */}
          <div className="flex gap-1 mb-5">
            {[
              { key: "all" as const, label: "All" },
              { key: "positive" as const, label: "Virtues" },
              { key: "real" as const, label: "Real Talk" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveCategory(key); setSelectedTheme(null); }}
                className={`px-4 py-2 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-2 ${
                  activeCategory === key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-transparent hover:border-foreground/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Theme list */}
          <div className="space-y-0">
            {displayThemes.map((theme, i) => (
              <div key={theme}>
                <button
                  onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                  className={`w-full flex items-center justify-between px-4 py-4 transition-all border-b ${
                    selectedTheme === theme
                      ? "bg-foreground text-background border-foreground sticky top-0 z-30"
                      : "bg-transparent border-border hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-display text-[10px] font-bold ${selectedTheme === theme ? "text-primary" : "text-muted-foreground"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`font-display text-base font-bold tracking-tight ${selectedTheme === theme ? "" : "text-foreground"}`}>
                      {theme}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: selectedTheme === theme ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight
                      className={`w-4 h-4 ${selectedTheme === theme ? "text-primary" : "text-muted-foreground"}`}
                      strokeWidth={2}
                    />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {selectedTheme === theme && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-secondary/50"
                    >
                      {loadingTheme ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : filteredScriptures.length === 0 ? (
                        <p className="text-sm text-muted-foreground font-body py-6 text-center">
                          No scriptures for this theme yet.
                        </p>
                      ) : (
                        <div className="py-3 px-4 space-y-3">
                          {visibleScriptures.map((s, si) => (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: si * 0.05 }}
                              className="bg-card border-l-4 border-primary p-4"
                              onMouseUp={() => handleTextSelection(s.reference)}
                              onTouchEnd={() => setTimeout(() => handleTextSelection(s.reference), 300)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                                  {s.translation}
                                </span>
                              </div>
                              <p className="font-display text-sm italic leading-relaxed text-foreground select-text">
                                "{s.text}"
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-0.5 bg-primary" />
                                  <p className="text-[10px] font-body font-bold uppercase tracking-widest text-primary">{s.reference}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    toggle(s.id);
                                    toast.success(isFavorite(s.id) ? "Removed" : "Saved");
                                  }}
                                >
                                  <Bookmark
                                    className={`w-4 h-4 ${isFavorite(s.id) ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                    strokeWidth={2}
                                  />
                                </button>
                              </div>
                              <p className="mt-2 text-xs font-body text-muted-foreground leading-relaxed">
                                {s.reflection}
                              </p>
                            </motion.div>
                          ))}

                          {/* Load More button */}
                          {hasMore && (
                            <button
                              onClick={() => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE)}
                              className="w-full flex items-center justify-center gap-2 py-3 border border-border text-muted-foreground font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                              Load More ({filteredScriptures.length - visibleCount} remaining)
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "bible" && (
        <div>
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={bibleSearch}
                onChange={(e) => setBibleSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBibleSearch()}
                placeholder='Search e.g. "John 3:16" or "Psalm 23"'
                className="w-full pl-10 pr-4 py-3 bg-secondary text-foreground font-body text-sm border-2 border-transparent focus:border-primary outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={handleBibleSearch}
              disabled={bibleLoading}
              className="px-5 py-3 bg-foreground text-background font-body text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50"
            >
              {bibleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
            </button>
          </div>

          {/* Quick access books */}
          <div className="flex gap-2 flex-wrap mb-6">
            {popularBooks.map((book) => (
              <button
                key={book}
                onClick={() => { setBibleSearch(`${book} 1`); }}
                className="px-3 py-1.5 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
              >
                {book}
              </button>
            ))}
          </div>

          {bibleError && (
            <div className="text-center py-8">
              <p className="text-sm font-body text-muted-foreground">{bibleError}</p>
            </div>
          )}

          {bibleResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 mb-4 border-b-2 border-foreground pb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">{bibleResult.reference}</h2>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground ml-auto">
                  {bibleResult.translation_name || "WEB"}
                </span>
              </div>

              <div
                className="space-y-2 select-text"
                onMouseUp={() => handleTextSelection(bibleResult.reference)}
                onTouchEnd={() => setTimeout(() => handleTextSelection(bibleResult.reference), 300)}
              >
                {bibleResult.verses.map((v) => (
                  <p key={`${v.book_id}-${v.chapter}-${v.verse}`} className="text-sm font-body leading-relaxed text-foreground">
                    <span className="text-[10px] font-bold text-primary mr-1.5 align-super">{v.verse}</span>
                    {v.text.trim()}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {!bibleResult && !bibleError && !bibleLoading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-foreground flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-display text-xl font-black text-foreground tracking-tight">
                SEARCH THE <span className="italic text-primary">BIBLE</span>
              </p>
              <p className="text-xs text-muted-foreground font-body mt-2 max-w-[260px] mx-auto">
                Enter any book, chapter, or verse reference to read the full text.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
