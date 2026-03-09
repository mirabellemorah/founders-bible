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

  // Main tab state
  const [activeTab, setActiveTab] = useState<"themes" | "bible" | "browse">("themes");

  // Bible search state
  const [bibleSearch, setBibleSearch] = useState("");
  const [bibleResult, setBibleResult] = useState<BiblePassage | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [currentBook, setCurrentBook] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isKeywordSearch, setIsKeywordSearch] = useState(false);
  const [keywordResults, setKeywordResults] = useState<{ verse: { text: string; verse: number; chapter: number; book_name: string }; reference: string }[]>([]);

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

  // Load more AI verses for a theme (can be called multiple times)
  const loadMoreAiVerses = useCallback(async () => {
    if (!selectedTheme || loadingAi) return;
    setLoadingAi(true);
    const verses = await fetchThemeVerses(selectedTheme);
    // Hydrate each verse with actual Bible text
    const hydrated = await Promise.all(verses.map(v => hydrateVerse(v)));
    // Filter out verses we already have
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

  // Bible search handlers
  const handleBibleSearch = async (ref?: string) => {
    const query = ref || bibleSearch.trim();
    if (!query) return;
    setBibleLoading(true);
    setBibleError("");
    setBibleResult(null);
    setSelectedBibleVerse(null);
    setKeywordResults([]);
    
    // Detect if this is a keyword search (no numbers = keyword)
    const isKeyword = !/\d/.test(query);
    setIsKeywordSearch(isKeyword);
    
    if (isKeyword) {
      // Keyword search - search across popular chapters
      const searchBooks = ["Psalms", "Proverbs", "Matthew", "John", "Romans", "1 Corinthians", "Philippians", "James", "Genesis", "Isaiah"];
      const results: { verse: { text: string; verse: number; chapter: number; book_name: string }; reference: string }[] = [];
      const keyword = query.toLowerCase();
      
      for (const book of searchBooks) {
        // Search first few chapters of each book
        for (let ch = 1; ch <= 5; ch++) {
          const passage = await fetchBibleChapter(book, ch);
          if (passage?.verses) {
            for (const v of passage.verses) {
              if (v.text.toLowerCase().includes(keyword)) {
                results.push({
                  verse: { ...v, chapter: ch, book_name: book },
                  reference: `${book} ${ch}:${v.verse}`
                });
                if (results.length >= 20) break;
              }
            }
          }
          if (results.length >= 20) break;
        }
        if (results.length >= 20) break;
      }
      
      setKeywordResults(results);
      if (results.length === 0) {
        setBibleError(`No verses found containing "${query}". Try another word like "love", "hope", or "strength".`);
      }
    } else {
      // Reference search
      const result = await fetchBiblePassage(query);
      if (result) {
        setBibleResult(result);
        const parsed = parseReference(result.reference);
        if (parsed) { setCurrentBook(parsed.book); setCurrentChapter(parsed.chapter); }
      } else {
        setBibleError("Could not find that reference. Try something like \"John 3:16\" or \"Psalm 23\".");
      }
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

  // Browse handlers - use abbreviation for API
  const handleBrowseChapter = async (book: BibleBook, chapter: number) => {
    setBrowseLoading(true);
    setBrowseChapter(chapter);
    setSelectedBibleVerse(null);
    // Use the book abbreviation for the API call
    const result = await fetchBibleChapter(book.abbrev || book.name, chapter);
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
                                  <Sparkles className="w-3.5 h-3.5" /> 
                                  {hasMore ? `Show More (${filteredScriptures.length - visibleCount} remaining)` : "Discover More"}
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
                        <Sparkles className="w-4 h-4" /> 
                        {hasMore ? `Show More (${filteredScriptures.length - visibleCount} remaining)` : "Discover More"}
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
                placeholder='Search "John 3:16" or words like "fear", "love", "hope"'
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

          {/* Keyword suggestions */}
          <div className="mb-6">
            <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-3">Search by Word</p>
            <div className="flex gap-2 flex-wrap">
              {["fear", "love", "hope", "faith", "peace", "strength", "wisdom", "trust", "joy", "grace"].map((word) => (
                <button key={word} onClick={() => { setBibleSearch(word); handleBibleSearch(word); }}
                  className="px-3 py-1.5 text-[10px] font-body font-bold uppercase tracking-wider bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all">
                  {word}
                </button>
              ))}
            </div>
          </div>

          {bibleError && <div className="text-center py-8"><p className="text-sm font-body text-muted-foreground">{bibleError}</p></div>}

          {/* Keyword search results */}
          {isKeywordSearch && keywordResults.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 mb-4 border-b-2 border-foreground pb-2">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">Results for "{bibleSearch}"</h2>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground ml-auto">
                  {keywordResults.length} verses
                </span>
              </div>
              <div className="space-y-3">
                {keywordResults.map((result, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-card border-l-4 border-primary p-4">
                    <p className="text-[10px] font-body font-bold uppercase tracking-wider text-primary mb-2">{result.reference}</p>
                    <p className="text-sm font-body leading-relaxed text-foreground">
                      {result.verse.text.trim()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reference search results */}
          {!isKeywordSearch && bibleResult && (
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

          {!bibleResult && !bibleError && !bibleLoading && keywordResults.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-foreground flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-display text-xl font-black text-foreground tracking-tight">
                SEARCH THE <span className="italic text-primary">BIBLE</span>
              </p>
              <p className="text-xs text-muted-foreground font-body mt-2 max-w-[260px] mx-auto">
                Enter a reference like "John 3:16" or search keywords like "fear" or "love".
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

            {/* Book list with inline chapter expansion */}
            <div className="max-h-[50vh] md:max-h-[70vh] overflow-y-auto border-t border-border">
              {getBooksByTestament(browseTestament).map((book) => (
                <div key={book.name}>
                  <button
                    onClick={() => { 
                      if (browseBook?.name === book.name) {
                        setBrowseBook(null); 
                        setBrowseChapter(null); 
                        setBrowsePassage(null);
                      } else {
                        setBrowseBook(book); 
                        setBrowseChapter(null); 
                        setBrowsePassage(null);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-body font-bold transition-all border-b border-border ${
                      browseBook?.name === book.name ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span>{book.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-body ${browseBook?.name === book.name ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{book.chapters} ch</span>
                        <motion.div animate={{ rotate: browseBook?.name === book.name ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className={`w-4 h-4 ${browseBook?.name === book.name ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </motion.div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Inline chapter grid */}
                  <AnimatePresence>
                    {browseBook?.name === book.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-secondary/50 border-b border-border"
                      >
                        <div className="p-3">
                          <p className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Chapter</p>
                          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
                              <button key={ch} onClick={() => handleBrowseChapter(book, ch)}
                                className={`py-2 text-xs font-body font-bold border transition-all ${
                                  browseChapter === ch 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                }`}>
                                {ch}
                              </button>
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

          {/* Right: Reading pane */}
          <div className="flex-1 mt-4 md:mt-0">
            {browseBook && browseChapter && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => { setBrowseChapter(null); setBrowsePassage(null); }}
                    className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
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
                  <p className="text-muted-foreground font-body text-center py-8">Could not load this chapter. The API may not support this book.</p>
                )}
              </motion.div>
            )}

            {browseBook && !browseChapter && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <BookOpen className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-display text-xl font-black text-foreground tracking-tight">
                  {browseBook.name}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-2">
                  Select a chapter from the dropdown to start reading.
                </p>
              </div>
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
