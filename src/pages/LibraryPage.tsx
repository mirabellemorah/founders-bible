import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, ArrowRight, ChevronDown, BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { fetchBibleChapter, type BiblePassage } from "@/lib/bibleApi";
import { fetchThemeVerses, hydrateVerse, type ThemeVerse } from "@/lib/themeVersesApi";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import VerseActionBar from "@/components/VerseActionBar";

// Smooth transitions
const smoothSpring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 };
const gentleEase = { duration: 0.4, ease: "easeOut" as const };
const exitEase = { duration: 0.25, ease: "easeIn" as const };
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: gentleEase,
};
const slideRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: smoothSpring,
};
const slideLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: smoothSpring,
};

const positiveThemes = ["Leadership", "Courage", "Faith", "Patience", "Discipline", "Purpose", "Wisdom", "Perseverance", "Hope", "Love", "Humility", "Gratitude", "Trust", "Strength", "Peace", "Integrity"];
const realThemes = ["Fear", "Money", "Negotiation", "Anxiety", "Failure", "Anger", "Jealousy", "Loneliness", "Doubt", "Greed", "Pride", "Suffering"];

// Popular books including deuterocanonical
const popularBooks = [
  { name: "Genesis", chapters: 50 },
  { name: "Exodus", chapters: 40 },
  { name: "Psalms", chapters: 150 },
  { name: "Proverbs", chapters: 31 },
  { name: "Isaiah", chapters: 66 },
  { name: "Matthew", chapters: 28 },
  { name: "Mark", chapters: 16 },
  { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 },
  { name: "Acts", chapters: 28 },
  { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 },
  { name: "Philippians", chapters: 4 },
  { name: "James", chapters: 5 },
  { name: "Revelation", chapters: 22 },
  // Deuterocanonical
  { name: "Tobit", chapters: 14 },
  { name: "Judith", chapters: 16 },
  { name: "Wisdom of Solomon", chapters: 19 },
  { name: "Sirach", chapters: 51 },
  { name: "Baruch", chapters: 6 },
  { name: "1 Maccabees", chapters: 16 },
  { name: "2 Maccabees", chapters: 15 },
];

const SCRIPTURES_PER_PAGE = 5;

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get("theme") as Theme) || null;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(initialTheme);
  const [filteredScriptures, setFilteredScriptures] = useState<Scripture[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "positive" | "real">("all");
  const [visibleCount, setVisibleCount] = useState(SCRIPTURES_PER_PAGE);
  const { toggle, isFavorite } = useFavorites();

  // AI-expanded theme verses
  const [aiVerses, setAiVerses] = useState<ThemeVerse[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Main tab state
  const [activeTab, setActiveTab] = useState<"themes" | "books">("themes");

  // Book browser state
  const [selectedBook, setSelectedBook] = useState<{ name: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState("");
  const [chapterDirection, setChapterDirection] = useState<1 | -1>(1);
  const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Verse selection
  const [selectedVerse, setSelectedVerse] = useState<{ text: string; reference: string; id?: string } | null>(null);
  const [selectedBibleVerse, setSelectedBibleVerse] = useState<{ text: string; verse: number } | null>(null);

  const preferredVersion = (localStorage.getItem("fb-bible-version") || "kjv").toUpperCase();

  // Theme scriptures loading
  useEffect(() => {
    if (selectedTheme) {
      setLoadingTheme(true);
      setVisibleCount(SCRIPTURES_PER_PAGE);
      setAiVerses([]);
      fetchScripturesByTheme(selectedTheme).then((s) => {
        const filtered = s.filter(sc => sc.translation === preferredVersion);
        if (filtered.length > 0) {
          setFilteredScriptures(filtered);
        } else {
          const fallbackVersion = s.length > 0 ? s[0].translation : preferredVersion;
          const fallbackFiltered = s.filter(sc => sc.translation === fallbackVersion);
          const grouped = new Map<string, Scripture>();
          fallbackFiltered.forEach(sc => {
            if (!grouped.has(sc.reference)) grouped.set(sc.reference, sc);
          });
          setFilteredScriptures(Array.from(grouped.values()));
        }
        setLoadingTheme(false);
      });
    } else {
      setFilteredScriptures([]);
    }
  }, [selectedTheme, preferredVersion]);

  // Load more AI verses for a theme
  const loadMoreAiVerses = useCallback(async () => {
    if (!selectedTheme || loadingAi) return;
    setLoadingAi(true);
    const verses = await fetchThemeVerses(selectedTheme);
    const hydrated = await Promise.all(verses.map(v => hydrateVerse(v)));
    const existingRefs = new Set([
      ...filteredScriptures.map(s => s.reference.toLowerCase()),
      ...aiVerses.map(v => v.reference.toLowerCase())
    ]);
    const newVerses = hydrated.filter(v => !existingRefs.has(v.reference.toLowerCase()));
    setAiVerses(prev => [...prev, ...newVerses]);
    setLoadingAi(false);
    if (newVerses.length === 0) {
      toast.info("No new verses found. Try again for more!");
    }
  }, [selectedTheme, loadingAi, filteredScriptures, aiVerses]);

  // User theme prefs
  const userThemes = (() => {
    const saved = localStorage.getItem("fb-selected-themes");
    return saved ? JSON.parse(saved) as string[] : [...themes];
  })();
  const activeThemes = themes.filter(t => userThemes.includes(t));
  const displayThemes = activeCategory === "all"
    ? activeThemes
    : activeCategory === "positive"
      ? activeThemes.filter(t => positiveThemes.includes(t))
      : activeThemes.filter(t => realThemes.includes(t));

  const visibleScriptures = filteredScriptures.slice(0, visibleCount);
  const hasMore = visibleCount < filteredScriptures.length;

  // Book chapter loading - always use "web" translation for reliability
  const handleLoadChapter = async (book: { name: string; chapters: number }, chapter: number) => {
    setBookLoading(true);
    setBookError("");
    setSelectedChapter(chapter);
    setSelectedBibleVerse(null);
    
    // Use WEB translation for reliability (works with all books including deuterocanonical)
    const result = await fetchBibleChapter(book.name, chapter);
    
    if (result && result.verses && result.verses.length > 0) {
      setPassage(result);
    } else {
      setBookError(`Could not load ${book.name} ${chapter}. Please try again.`);
      setPassage(null);
    }
    setBookLoading(false);
  };

  const navigateChapter = async (direction: -1 | 1) => {
    if (!selectedBook || !selectedChapter) return;
    const next = selectedChapter + direction;
    if (next < 1 || next > selectedBook.chapters) {
      toast.info(direction === 1 ? "End of book" : "Already at chapter 1");
      return;
    }
    setChapterDirection(direction);
    await handleLoadChapter(selectedBook, next);
  };

  const jumpToChapter = async (ch: number) => {
    if (!selectedBook) return;
    setChapterDirection(ch > (selectedChapter || 1) ? 1 : -1);
    setChapterDropdownOpen(false);
    await handleLoadChapter(selectedBook, ch);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setChapterDropdownOpen(false);
      }
    };
    if (chapterDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chapterDropdownOpen]);

  const handleVerseSelect = (s: Scripture) => {
    setSelectedVerse(selectedVerse?.id === s.id ? null : { text: s.text, reference: s.reference, id: s.id });
  };

  const handleBibleVerseSelect = (v: { verse: number; text: string }) => {
    setSelectedBibleVerse(selectedBibleVerse?.verse === v.verse ? null : v);
  };

  // ─── Chapter floating selector ───
  const renderChapterSelector = () => {
    if (!selectedBook || !selectedChapter) return null;
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setChapterDropdownOpen(!chapterDropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-body font-bold uppercase tracking-wider bg-secondary text-foreground border border-border hover:border-primary transition-colors duration-200 ease-out rounded-sm"
        >
          Ch. {selectedChapter}
          <motion.div animate={{ rotate: chapterDropdownOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeOut" as const }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>
        <AnimatePresence>
          {chapterDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="fixed left-1/2 -translate-x-1/2 top-auto mt-2 z-50 bg-card border border-border shadow-lg rounded-sm p-3 w-[min(280px,90vw)] max-h-[240px] overflow-y-auto"
              style={{ top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : undefined }}
            >
              <p className="text-[9px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-2">{selectedBook.name} · Jump to chapter</p>
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <motion.button
                    key={ch}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => jumpToChapter(ch)}
                    className={`py-1.5 text-xs font-body font-bold rounded-sm transition-colors duration-150 ease-out ${
                      selectedChapter === ch
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-foreground hover:bg-primary/20 border border-border"
                    }`}
                  >
                    {ch}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ─── Chapter navigation bar ───
  const renderChapterNav = (position: "top" | "bottom") => {
    if (!selectedBook || !selectedChapter) return null;
    const isTop = position === "top";
    return (
      <div className={`flex items-center justify-between ${isTop ? "mb-4" : "mt-6 pt-4 border-t border-border"}`}>
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigateChapter(-1)}
          disabled={bookLoading || selectedChapter <= 1}
          className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider transition-colors duration-200 ease-out disabled:opacity-30 ${
            isTop ? "border border-border text-muted-foreground hover:border-primary hover:text-primary" : "bg-foreground text-background hover:bg-primary"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </motion.button>
        {isTop ? renderChapterSelector() : (
          <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
            {selectedChapter} / {selectedBook.chapters}
          </span>
        )}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigateChapter(1)}
          disabled={bookLoading || selectedChapter >= selectedBook.chapters}
          className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider transition-colors duration-200 ease-out disabled:opacity-30 ${
            isTop ? "border border-border text-muted-foreground hover:border-primary hover:text-primary" : "bg-foreground text-background hover:bg-primary"
          }`}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    );
  };

  // ─── Render helpers ───
  const renderScriptureCard = (s: Scripture, index: number, isMobile = false) => (
    <div key={s.id}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" as const }}
        onClick={() => handleVerseSelect(s)}
        className={`bg-card border-l-4 border-primary ${isMobile ? "p-4" : "p-6"} cursor-pointer transition-all ${
          selectedVerse?.id === s.id ? "ring-2 ring-primary/30 shadow-md" : "hover:bg-secondary"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">{s.translation}</span>
        </div>
        <p className={`font-display ${isMobile ? "text-sm" : "text-lg"} italic leading-relaxed text-foreground ${
          selectedVerse?.id === s.id ? "underline decoration-dotted decoration-primary underline-offset-4" : ""
        }`}>
          "{s.text}"
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <p className="text-[10px] font-body font-bold uppercase tracking-widest text-primary">{s.reference}</p>
          </div>
          <Bookmark className={`w-4 h-4 ${isFavorite(s.id) ? "text-primary fill-primary" : "text-muted-foreground"}`} strokeWidth={2} />
        </div>
        <p className="mt-2 text-xs font-body text-muted-foreground leading-relaxed">{s.reflection}</p>
      </motion.div>
      <AnimatePresence>
        {selectedVerse?.id === s.id && (
          <div className={isMobile ? "" : "mt-2"}>
            <VerseActionBar verseText={s.text} reference={s.reference} scriptureId={s.id} onClose={() => setSelectedVerse(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderBibleVerses = (passageData: BiblePassage, book: string, chapter: number) => (
    <div className="space-y-1">
      {passageData.verses.map((v) => {
        const isSelected = selectedBibleVerse?.verse === v.verse;
        return (
          <div key={`${v.book_id}-${v.chapter}-${v.verse}`}>
            <p
              onClick={() => handleBibleVerseSelect(v)}
              className={`text-sm font-body leading-relaxed text-foreground py-1 px-2 -mx-2 cursor-pointer rounded transition-all ${
                isSelected ? "bg-primary/10 underline decoration-dotted decoration-primary underline-offset-4" : "hover:bg-secondary"
              }`}
            >
              <span className="text-[10px] font-bold text-primary mr-1.5 align-super">{v.verse}</span>
              {v.text.trim()}
            </p>
            <AnimatePresence>
              {isSelected && (
                <VerseActionBar
                  verseText={v.text.trim()}
                  reference={`${book} ${chapter}:${v.verse}`}
                  onClose={() => setSelectedBibleVerse(null)}
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  const renderAiVerseCard = (v: ThemeVerse, vi: number, isMobile: boolean) => (
    <motion.div key={`ai-${vi}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: vi * 0.08 }}
      className={`bg-card border-l-4 border-accent ${isMobile ? "p-4" : "p-6"}`}>
      <p className={`${isMobile ? "text-[10px]" : "text-xs"} font-body font-bold uppercase tracking-wider text-primary mb-2`}>{v.reference}</p>
      {v.passage ? (
        <p className={`font-display ${isMobile ? "text-sm" : "text-lg"} italic leading-relaxed text-foreground`}>
          "{v.passage.text.trim()}"
        </p>
      ) : (
        <p className={`${isMobile ? "text-xs" : "text-sm"} font-body text-muted-foreground italic`}>Could not load verse text</p>
      )}
      <p className={`mt-2 ${isMobile ? "text-xs" : "text-sm"} font-body text-muted-foreground leading-relaxed`}>{v.reason}</p>
    </motion.div>
  );

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
          THE<br /><span className="italic text-primary">LIBRARY</span>
        </h1>
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-muted-foreground mt-3">
          Themes · Popular Books
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-0 mb-5 border-b-2 border-foreground">
        {[
          { key: "themes" as const, label: "Themes" },
          { key: "books" as const, label: "Popular Books" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedVerse(null); setSelectedBibleVerse(null); }}
            className={`flex-1 py-3 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════ THEMES TAB ═══════════════ */}
      {activeTab === "themes" && (
        <div className="flex flex-col md:flex-row md:gap-8 md:items-start relative pb-6">
          {/* Left Column: Themes */}
          <div className="md:w-72 md:shrink-0 md:sticky md:top-20">
            <div className="flex gap-1 mb-5 flex-wrap">
              {[
                { key: "all" as const, label: "All" },
                { key: "positive" as const, label: "Virtues" },
                { key: "real" as const, label: "Real Talk" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveCategory(key); setSelectedTheme(null); setSelectedVerse(null); }}
                  className={`px-4 py-2 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-2 ${
                    activeCategory === key ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-transparent hover:border-foreground/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-0 border-t border-b md:border-b-0 border-border">
              {displayThemes.map((theme, i) => (
                <div key={theme}>
                  <button
                    onClick={() => { setSelectedTheme(selectedTheme === theme ? null : theme); setSelectedVerse(null); }}
                    className={`w-full flex items-center justify-between px-4 py-4 md:py-3 transition-all border-b md:border-b-0 ${
                      selectedTheme === theme
                        ? "bg-foreground text-background border-foreground sticky top-0 z-30 md:static md:bg-primary md:text-primary-foreground md:border-transparent"
                        : "bg-transparent border-border hover:bg-secondary md:border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4 md:gap-3">
                      <span className={`font-display text-[10px] font-bold ${selectedTheme === theme ? "text-primary md:text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={`font-display text-base md:text-sm font-bold tracking-tight ${selectedTheme === theme ? "" : "text-foreground"}`}>
                        {theme}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: selectedTheme === theme ? 90 : 0 }} transition={{ duration: 0.2 }} className="md:hidden">
                      <ArrowRight className={`w-4 h-4 ${selectedTheme === theme ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />
                    </motion.div>
                  </button>

                  {/* Mobile expansion */}
                  <AnimatePresence>
                    {selectedTheme === theme && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-secondary/50 md:hidden"
                      >
                        {loadingTheme ? (
                          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                        ) : (
                          <div className="py-3 px-4 space-y-3">
                            {filteredScriptures.length === 0 && aiVerses.length === 0 && (
                              <p className="text-sm text-muted-foreground font-body py-2 text-center">No pre-seeded scriptures for this theme.</p>
                            )}
                            {visibleScriptures.map((s, si) => renderScriptureCard(s, si, true))}
                            
                            {/* AI Verses */}
                            {aiVerses.length > 0 && (
                              <div className="space-y-3 mt-2">
                                <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-[10px] font-body font-bold uppercase tracking-wider text-primary">Discovered from the Bible</span>
                                </div>
                                {aiVerses.map((v, vi) => renderAiVerseCard(v, vi, true))}
                              </div>
                            )}

                            {/* Unified discover more button */}
                            <button onClick={hasMore ? () => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE) : loadMoreAiVerses} disabled={loadingAi}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/30 text-primary font-body text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all mt-2 disabled:opacity-50">
                              {loadingAi ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding verses...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" /> Discover More
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop right column */}
          <div className="hidden md:block flex-1 bg-card border border-border p-8 min-h-[600px]">
            {selectedTheme ? (
              loadingTheme ? (
                <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-display text-3xl font-black mb-6 text-foreground border-b border-border pb-4">{selectedTheme}</h3>
                  
                  {filteredScriptures.length === 0 && aiVerses.length === 0 && (
                    <p className="text-muted-foreground font-body py-8 text-center">No pre-seeded scriptures for this theme.</p>
                  )}

                  <div className="space-y-6">
                    {visibleScriptures.map((s, si) => renderScriptureCard(s, si, false))}
                  </div>

                  {/* AI Verses */}
                  {aiVerses.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 pb-3 mb-6 border-b border-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-body font-bold uppercase tracking-wider text-primary">Discovered from the Bible</span>
                      </div>
                      <div className="space-y-6">
                        {aiVerses.map((v, vi) => renderAiVerseCard(v, vi, false))}
                      </div>
                    </div>
                  )}

                  {/* Unified discover more button */}
                  <button onClick={hasMore ? () => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE) : loadMoreAiVerses} disabled={loadingAi}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary/10 border border-primary/30 text-primary font-body text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all mt-6 disabled:opacity-50">
                    {loadingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Finding verses across the Bible...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Discover More
                      </>
                    )}
                  </button>
                </motion.div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-40">
                <BookOpen className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-body text-sm uppercase tracking-widest font-bold">Select a theme to explore</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ POPULAR BOOKS TAB ═══════════════ */}
      {activeTab === "books" && (
        <div className="pb-6">
          {/* ── MOBILE: Step-based navigation ── */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              {/* STEP 3: Reading view */}
              {passage && selectedBook && selectedChapter && !bookLoading ? (
                <motion.div key={`reading-${selectedChapter}`}
                  initial={{ opacity: 0, x: chapterDirection * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: chapterDirection * -30 }}
                  transition={smoothSpring}
                >
                  <motion.button
                    whileHover={{ x: -3 }}
                    onClick={() => { setPassage(null); setSelectedChapter(null); setBookError(""); setChapterDropdownOpen(false); }}
                    className="flex items-center gap-2 mb-4 text-[11px] font-body font-bold uppercase tracking-wider text-primary"
                  >
                    <ChevronLeft className="w-4 h-4" /> {selectedBook.name}
                  </motion.button>

                  <div className="flex items-center gap-3 mb-4 border-b-2 border-foreground pb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-bold text-foreground">{selectedBook.name} {selectedChapter}</h2>
                    <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground ml-auto">
                      {passage.translation_name || "WEB"}
                    </span>
                  </div>

                  {renderChapterNav("top")}
                  {renderBibleVerses(passage, selectedBook.name, selectedChapter)}
                  {renderChapterNav("bottom")}
                </motion.div>

              ) : bookLoading ? (
                <motion.div key="loading" {...fadeUp}>
                  {selectedBook && (
                    <button onClick={() => { setBookLoading(false); setSelectedChapter(null); setBookError(""); }}
                      className="flex items-center gap-2 mb-4 text-[11px] font-body font-bold uppercase tracking-wider text-primary">
                      <ChevronLeft className="w-4 h-4" /> {selectedBook.name}
                    </button>
                  )}
                  <div className="flex justify-center py-16">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Loader2 className="w-6 h-6 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>

              ) : bookError ? (
                <motion.div key="error" {...fadeUp}>
                  <button onClick={() => { setBookError(""); setSelectedChapter(null); }}
                    className="flex items-center gap-2 mb-4 text-[11px] font-body font-bold uppercase tracking-wider text-primary">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="text-center py-16">
                    <p className="text-sm font-body text-destructive">{bookError}</p>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => selectedBook && selectedChapter && handleLoadChapter(selectedBook, selectedChapter)}
                      className="mt-4 px-4 py-2 text-[10px] font-body font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200">
                      Try Again
                    </motion.button>
                  </div>
                </motion.div>

              ) : selectedBook ? (
                /* STEP 2: Chapter grid */
                <motion.div key="chapters" {...slideRight}>
                  <motion.button whileHover={{ x: -3 }}
                    onClick={() => { setSelectedBook(null); setSelectedChapter(null); setPassage(null); setBookError(""); }}
                    className="flex items-center gap-2 mb-4 text-[11px] font-body font-bold uppercase tracking-wider text-primary">
                    <ChevronLeft className="w-4 h-4" /> All Books
                  </motion.button>
                  <h2 className="font-display text-2xl font-black text-foreground mb-1">{selectedBook.name}</h2>
                  <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-5">
                    {selectedBook.chapters} chapters · Select one to read
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch, idx) => (
                      <motion.button key={ch}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.012, duration: 0.25, ease: "easeOut" as const }}
                        whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLoadChapter(selectedBook, ch)}
                        className="py-3 text-sm font-body font-bold bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 ease-out border border-border rounded-sm">
                        {ch}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

              ) : (
                /* STEP 1: Book list */
                <motion.div key="books" {...fadeUp}>
                  <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Select a book to read
                  </p>
                  <div className="space-y-0 border-t border-border">
                    {popularBooks.map((book, idx) => (
                      <motion.button key={book.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.3, ease: "easeOut" as const }}
                        whileTap={{ scale: 0.98, backgroundColor: "hsl(var(--secondary))" }}
                        onClick={() => { setSelectedBook(book); setSelectedChapter(null); setPassage(null); setBookError(""); }}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-body font-bold text-foreground border-b border-border hover:bg-secondary transition-colors duration-200 ease-out">
                        <span>{book.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-body text-muted-foreground">{book.chapters} ch</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── DESKTOP: Side-by-side layout ── */}
          <div className="hidden md:flex md:gap-6 md:items-start">
            {/* Book list + chapter grid */}
            <div className="w-64 shrink-0 sticky top-20">
              <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                Select a book to read
              </p>
              <div className="max-h-[70vh] overflow-y-auto border-t border-border">
                {popularBooks.map((book) => (
                  <div key={book.name}>
                    <button
                      onClick={() => { 
                        if (selectedBook?.name === book.name) {
                          setSelectedBook(null); setSelectedChapter(null); setPassage(null); setBookError("");
                        } else {
                          setSelectedBook(book); setSelectedChapter(null); setPassage(null); setBookError("");
                        }
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-body font-bold transition-colors duration-200 ease-out border-b border-border ${
                        selectedBook?.name === book.name ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span>{book.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-body ${selectedBook?.name === book.name ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{book.chapters} ch</span>
                          <motion.div animate={{ rotate: selectedBook?.name === book.name ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeOut" as const }}>
                            <ChevronDown className={`w-4 h-4 ${selectedBook?.name === book.name ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </motion.div>
                        </div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {selectedBook?.name === book.name && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" as const }}
                          className="overflow-hidden bg-secondary/50 border-b border-border"
                        >
                          <div className="p-3">
                            <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Chapter</p>
                            <div className="grid grid-cols-8 gap-1.5">
                              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
                                <motion.button key={ch}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleLoadChapter(book, ch)}
                                  className={`py-2 text-xs font-body font-bold transition-colors duration-150 ease-out ${
                                    selectedChapter === ch ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-primary/20 border border-border"
                                  }`}>
                                  {ch}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Passage display */}
            <div className="flex-1 bg-card border border-border p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                {bookLoading ? (
                  <motion.div key="desk-loading" {...fadeUp} className="flex justify-center py-16">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Loader2 className="w-6 h-6 text-primary" />
                    </motion.div>
                  </motion.div>
                ) : bookError ? (
                  <motion.div key="desk-error" {...fadeUp} className="text-center py-16">
                    <p className="text-sm font-body text-destructive">{bookError}</p>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => selectedBook && selectedChapter && handleLoadChapter(selectedBook, selectedChapter)}
                      className="mt-4 px-4 py-2 text-[10px] font-body font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200">
                      Try Again
                    </motion.button>
                  </motion.div>
                ) : passage && selectedBook && selectedChapter ? (
                  <motion.div key={`desk-reading-${selectedChapter}`}
                    initial={{ opacity: 0, x: chapterDirection * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: chapterDirection * -20 }}
                    transition={smoothSpring}
                  >
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-foreground pb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h2 className="font-display text-lg font-bold text-foreground">{selectedBook.name} {selectedChapter}</h2>
                      <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground ml-auto">
                        {passage.translation_name || "WEB"}
                      </span>
                    </div>
                    {renderChapterNav("top")}
                    {renderBibleVerses(passage, selectedBook.name, selectedChapter)}
                    {renderChapterNav("bottom")}
                  </motion.div>
                ) : (
                  <motion.div key="desk-empty" {...fadeUp} className="text-center py-16">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" as const }}
                      className="w-16 h-16 bg-foreground flex items-center justify-center mx-auto mb-4"
                    >
                      <BookOpen className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </motion.div>
                    <p className="font-display text-xl font-black text-foreground tracking-tight">
                      READ THE <span className="italic text-primary">BIBLE</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-2 max-w-[260px] mx-auto">
                      Select a book and chapter to start reading.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
