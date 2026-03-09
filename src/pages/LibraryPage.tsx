import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, ArrowRight, Search, ChevronDown, BookOpen, ChevronLeft, ChevronRight, Sparkles, Library } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { fetchBiblePassage, fetchBibleChapter, parseReference, type BiblePassage } from "@/lib/bibleApi";
import { bibleBooks, getBooksByTestament, type BibleBook } from "@/lib/bibleBooks";
import { fetchThemeVerses, hydrateVerse, type ThemeVerse } from "@/lib/themeVersesApi";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import VerseActionBar from "@/components/VerseActionBar";

const positiveThemes = ["Leadership", "Courage", "Faith", "Patience", "Discipline", "Purpose", "Wisdom", "Perseverance", "Hope", "Love", "Humility", "Gratitude", "Trust", "Strength", "Peace", "Integrity"];
const realThemes = ["Fear", "Money", "Negotiation", "Anxiety", "Failure", "Anger", "Jealousy", "Loneliness", "Doubt", "Greed", "Pride", "Suffering"];

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
  const [showAiVerses, setShowAiVerses] = useState(false);

  // Main tab state
  const [activeTab, setActiveTab] = useState<"themes" | "bible" | "browse">("themes");

  // Bible search state
  const [bibleSearch, setBibleSearch] = useState("");
  const [bibleResult, setBibleResult] = useState<BiblePassage | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [currentBook, setCurrentBook] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);

  // Bible browser state
  const [browseTestament, setBrowseTestament] = useState<"OT" | "NT" | "DC">("OT");
  const [browseBook, setBrowseBook] = useState<BibleBook | null>(null);
  const [browseChapter, setBrowseChapter] = useState<number | null>(null);
  const [browsePassage, setBrowsePassage] = useState<BiblePassage | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Verse selection
  const [selectedVerse, setSelectedVerse] = useState<{ text: string; reference: string; id?: string } | null>(null);
  const [selectedBibleVerse, setSelectedBibleVerse] = useState<{ text: string; verse: number } | null>(null);

  const preferredVersion = (localStorage.getItem("fb-bible-version") || "kjv").toUpperCase();

  // Theme scriptures loading
  useEffect(() => {
    if (selectedTheme) {
      setLoadingTheme(true);
      setVisibleCount(SCRIPTURES_PER_PAGE);
      setShowAiVerses(false);
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

  // Load AI-expanded verses for a theme
  const loadAiVerses = useCallback(async () => {
    if (!selectedTheme || loadingAi) return;
    setLoadingAi(true);
    setShowAiVerses(true);
    const verses = await fetchThemeVerses(selectedTheme);
    // Hydrate each verse with actual Bible text
    const hydrated = await Promise.all(verses.map(v => hydrateVerse(v)));
    setAiVerses(hydrated);
    setLoadingAi(false);
  }, [selectedTheme, loadingAi]);

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

  // Bible search handlers
  const handleBibleSearch = async (ref?: string) => {
    const query = ref || bibleSearch.trim();
    if (!query) return;
    setBibleLoading(true);
    setBibleError("");
    setBibleResult(null);
    setSelectedBibleVerse(null);
    const result = await fetchBiblePassage(query);
    if (result) {
      setBibleResult(result);
      const parsed = parseReference(result.reference);
      if (parsed) { setCurrentBook(parsed.book); setCurrentChapter(parsed.chapter); }
    } else {
      setBibleError("Could not find that reference. Try something like \"John 3:16\" or \"Psalm 23\".");
    }
    setBibleLoading(false);
  };

  const navigateChapter = async (direction: -1 | 1) => {
    if (!currentBook) return;
    const nextChapter = currentChapter + direction;
    if (nextChapter < 1) return;
    setBibleLoading(true);
    setBibleError("");
    setSelectedBibleVerse(null);
    const result = await fetchBibleChapter(currentBook, nextChapter);
    if (result && result.verses.length > 0) {
      setBibleResult(result);
      setCurrentChapter(nextChapter);
      setBibleSearch(`${currentBook} ${nextChapter}`);
    } else {
      toast.info(direction === 1 ? "No more chapters" : "Already at chapter 1");
    }
    setBibleLoading(false);
  };

  // Browse handlers
  const handleBrowseChapter = async (book: BibleBook, chapter: number) => {
    setBrowseLoading(true);
    setBrowseChapter(chapter);
    setSelectedBibleVerse(null);
    const result = await fetchBibleChapter(book.name, chapter);
    setBrowsePassage(result);
    setBrowseLoading(false);
  };

  const navigateBrowseChapter = async (direction: -1 | 1) => {
    if (!browseBook || !browseChapter) return;
    const next = browseChapter + direction;
    if (next < 1 || next > browseBook.chapters) return;
    await handleBrowseChapter(browseBook, next);
  };

  const handleVerseSelect = (s: Scripture) => {
    setSelectedVerse(selectedVerse?.id === s.id ? null : { text: s.text, reference: s.reference, id: s.id });
  };

  const handleBibleVerseSelect = (v: { verse: number; text: string }) => {
    setSelectedBibleVerse(selectedBibleVerse?.verse === v.verse ? null : v);
  };

  // ─── Render helpers ───
  const renderScriptureCard = (s: Scripture, index: number, isMobile = false) => (
    <div key={s.id}>
      <motion.div
        initial={{ opacity: 0, x: isMobile ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
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

  const renderBibleVerses = (passage: BiblePassage, referencePrefix: string) => (
    <div className="space-y-1">
      {passage.verses.map((v) => {
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
                  reference={`${referencePrefix}:${v.verse}`}
                  onClose={() => setSelectedBibleVerse(null)}
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
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
          Themes · Search · Browse the entire Bible
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-0 mb-5 border-b-2 border-foreground">
        {[
          { key: "themes" as const, label: "Themes" },
          { key: "bible" as const, label: "Search" },
          { key: "browse" as const, label: "Full Bible" },
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
                            {filteredScriptures.length === 0 && !showAiVerses && (
                              <p className="text-sm text-muted-foreground font-body py-2 text-center">No pre-seeded scriptures for this theme.</p>
                            )}
                            {visibleScriptures.map((s, si) => renderScriptureCard(s, si, true))}
                            {hasMore && (
                              <button onClick={() => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE)}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-border text-muted-foreground font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
                                <ChevronDown className="w-3.5 h-3.5" /> Load More ({filteredScriptures.length - visibleCount} remaining)
                              </button>
                            )}
                            {/* AI Discover More */}
                            {!showAiVerses && (
                              <button onClick={loadAiVerses} disabled={loadingAi}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/30 text-primary font-body text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all mt-2">
                                <Sparkles className="w-3.5 h-3.5" /> Discover more from the entire Bible
                              </button>
                            )}
                            {loadingAi && (
                              <div className="flex items-center justify-center gap-2 py-6">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-xs font-body text-muted-foreground">Finding verses across the Bible...</span>
                              </div>
                            )}
                            {showAiVerses && aiVerses.length > 0 && (
                              <div className="space-y-3 mt-2">
                                <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-[10px] font-body font-bold uppercase tracking-wider text-primary">From the entire Bible</span>
                                </div>
                                {aiVerses.map((v, vi) => (
                                  <motion.div key={vi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: vi * 0.08 }}
                                    className="bg-card border-l-4 border-accent p-4">
                                    <p className="text-[10px] font-body font-bold uppercase tracking-wider text-primary mb-2">{v.reference}</p>
                                    {v.passage ? (
                                      <p className="font-display text-sm italic leading-relaxed text-foreground">
                                        "{v.passage.text.trim()}"
                                      </p>
                                    ) : (
                                      <p className="text-xs font-body text-muted-foreground italic">Could not load verse text</p>
                                    )}
                                    <p className="mt-2 text-xs font-body text-muted-foreground leading-relaxed">{v.reason}</p>
                                  </motion.div>
                                ))}
                              </div>
                            )}
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
                  
                  {filteredScriptures.length === 0 && !showAiVerses && (
                    <p className="text-muted-foreground font-body py-8 text-center">No pre-seeded scriptures for this theme.</p>
                  )}

                  <div className="space-y-6">
                    {visibleScriptures.map((s, si) => renderScriptureCard(s, si, false))}
                  </div>

                  {hasMore && (
                    <button onClick={() => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE)}
                      className="w-full flex items-center justify-center gap-2 py-4 border border-border text-muted-foreground font-body text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all mt-6">
                      <ChevronDown className="w-4 h-4" /> Load More ({filteredScriptures.length - visibleCount} remaining)
                    </button>
                  )}

                  {/* AI Expand */}
                  {!showAiVerses && (
                    <button onClick={loadAiVerses} disabled={loadingAi}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-primary/10 border border-primary/30 text-primary font-body text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all mt-6">
                      <Sparkles className="w-4 h-4" /> Discover more verses from the entire Bible
                    </button>
                  )}

                  {loadingAi && (
                    <div className="flex items-center justify-center gap-3 py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-body text-muted-foreground">AI is finding relevant verses across the entire Bible...</span>
                    </div>
                  )}

                  {showAiVerses && aiVerses.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 pb-3 mb-6 border-b border-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-body font-bold uppercase tracking-wider text-primary">More from the entire Bible</span>
                      </div>
                      <div className="space-y-6">
                        {aiVerses.map((v, vi) => (
                          <motion.div key={vi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: vi * 0.08 }}
                            className="bg-background border-l-4 border-accent p-6">
                            <p className="text-xs font-body font-bold uppercase tracking-wider text-primary mb-3">{v.reference}</p>
                            {v.passage ? (
                              <p className="font-display text-lg italic leading-relaxed text-foreground">
                                "{v.passage.text.trim()}"
                              </p>
                            ) : (
                              <p className="text-sm font-body text-muted-foreground italic">Could not load verse text</p>
                            )}
                            <p className="mt-3 text-sm font-body text-muted-foreground leading-relaxed">{v.reason}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* ═══════════════ SEARCH TAB ═══════════════ */}
      {activeTab === "bible" && (
        <div>
          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={bibleSearch}
                onChange={(e) => setBibleSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBibleSearch()}
                placeholder='Search e.g. "John 3:16", "Psalm 23", "Romans 8:28-39"'
                className="w-full pl-10 pr-4 py-3 bg-secondary text-foreground font-body text-sm border-2 border-transparent focus:border-primary outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={() => handleBibleSearch()} disabled={bibleLoading}
              className="px-5 py-3 bg-foreground text-background font-body text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50">
              {bibleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
            </button>
          </div>

          {/* Quick picks */}
          <div className="mb-6">
            <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-3">Popular References</p>
            <div className="flex gap-2 flex-wrap">
              {["John 3:16", "Psalm 23", "Romans 8:28", "Proverbs 3:5-6", "Jeremiah 29:11", "Philippians 4:13", "Isaiah 41:10", "Matthew 6:33", "Psalm 46:10", "Joshua 1:9"].map((ref) => (
                <button key={ref} onClick={() => { setBibleSearch(ref); handleBibleSearch(ref); }}
                  className="px-3 py-1.5 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  {ref}
                </button>
              ))}
            </div>
          </div>

          {bibleError && <div className="text-center py-8"><p className="text-sm font-body text-muted-foreground">{bibleError}</p></div>}

          {bibleResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 mb-4 border-b-2 border-foreground pb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">{bibleResult.reference}</h2>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground ml-auto">
                  {bibleResult.translation_name || "WEB"}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateChapter(-1)} disabled={bibleLoading || currentChapter <= 1}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">Ch. {currentChapter}</span>
                <button onClick={() => navigateChapter(1)} disabled={bibleLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {renderBibleVerses(bibleResult, bibleResult.reference.split(":")[0])}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button onClick={() => navigateChapter(-1)} disabled={bibleLoading || currentChapter <= 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button onClick={() => navigateChapter(1)} disabled={bibleLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {!bibleResult && !bibleError && !bibleLoading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-foreground flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-display text-xl font-black text-foreground tracking-tight">
                SEARCH THE <span className="italic text-primary">BIBLE</span>
              </p>
              <p className="text-xs text-muted-foreground font-body mt-2 max-w-[260px] mx-auto">
                Enter any book, chapter, or verse reference to read it instantly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ FULL BIBLE BROWSE TAB ═══════════════ */}
      {activeTab === "browse" && (
        <div className="flex flex-col md:flex-row md:gap-6 md:items-start">
          {/* Book list / navigation */}
          <div className="md:w-64 md:shrink-0 md:sticky md:top-20">
            {/* Testament tabs */}
            <div className="flex gap-1 mb-4">
              {([
                { key: "OT" as const, label: "Old" },
                { key: "NT" as const, label: "New" },
                { key: "DC" as const, label: "Deutero" },
              ]).map(({ key, label }) => (
                <button key={key} onClick={() => { setBrowseTestament(key); setBrowseBook(null); setBrowseChapter(null); setBrowsePassage(null); }}
                  className={`flex-1 py-2 text-[10px] font-body font-bold uppercase tracking-wider transition-all border-2 ${
                    browseTestament === key ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-transparent hover:border-foreground/20"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Book list */}
            <div className="max-h-[50vh] md:max-h-[70vh] overflow-y-auto border-t border-border">
              {getBooksByTestament(browseTestament).map((book) => (
                <button key={book.name}
                  onClick={() => { setBrowseBook(browseBook?.name === book.name ? null : book); setBrowseChapter(null); setBrowsePassage(null); }}
                  className={`w-full text-left px-4 py-3 text-sm font-body font-bold transition-all border-b border-border ${
                    browseBook?.name === book.name ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span>{book.name}</span>
                    <span className="text-[10px] font-body text-muted-foreground">{book.chapters} ch</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Chapter selector + reading pane */}
          <div className="flex-1 mt-4 md:mt-0">
            {browseBook && !browseChapter && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="font-display text-2xl font-black text-foreground mb-4">{browseBook.name}</h3>
                <p className="text-xs font-body text-muted-foreground mb-4">{browseBook.chapters} chapters · Select a chapter to read</p>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: browseBook.chapters }, (_, i) => i + 1).map((ch) => (
                    <button key={ch} onClick={() => handleBrowseChapter(browseBook, ch)}
                      className="py-3 text-sm font-body font-bold border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      {ch}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {browseBook && browseChapter && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => { setBrowseChapter(null); setBrowsePassage(null); }}
                    className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Chapters
                  </button>
                  <h3 className="font-display text-xl font-bold text-foreground">{browseBook.name} {browseChapter}</h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => navigateBrowseChapter(-1)} disabled={browseLoading || browseChapter <= 1}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">Ch. {browseChapter} of {browseBook.chapters}</span>
                  <button onClick={() => navigateBrowseChapter(1)} disabled={browseLoading || browseChapter >= browseBook.chapters}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {browseLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : browsePassage ? (
                  <>
                    {renderBibleVerses(browsePassage, `${browseBook.name} ${browseChapter}`)}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <button onClick={() => navigateBrowseChapter(-1)} disabled={browseLoading || browseChapter <= 1}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30">
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <button onClick={() => navigateBrowseChapter(1)} disabled={browseLoading || browseChapter >= browseBook.chapters}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30">
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground font-body text-center py-8">Could not load this chapter.</p>
                )}
              </motion.div>
            )}

            {!browseBook && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Library className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-display text-xl font-black text-foreground tracking-tight">
                  BROWSE THE <span className="italic text-primary">BIBLE</span>
                </p>
                <p className="text-xs text-muted-foreground font-body mt-2 max-w-[260px] mx-auto text-center">
                  Select a book from the list to start reading. Every book, every chapter, every verse.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
