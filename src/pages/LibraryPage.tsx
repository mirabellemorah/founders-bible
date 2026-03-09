import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, ArrowRight, Search, ChevronDown, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { fetchBiblePassage, fetchBibleChapter, parseReference, allPopularBooks, type BiblePassage } from "@/lib/bibleApi";
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

  // Bible tab state
  const [activeTab, setActiveTab] = useState<"themes" | "bible">("themes");
  const [bibleSearch, setBibleSearch] = useState("");
  const [bibleResult, setBibleResult] = useState<BiblePassage | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [currentBook, setCurrentBook] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);

  // Tap-to-select verse
  const [selectedVerse, setSelectedVerse] = useState<{ text: string; reference: string; id?: string } | null>(null);
  const [selectedBibleVerse, setSelectedBibleVerse] = useState<{ text: string; verse: number } | null>(null);

  const preferredVersion = (localStorage.getItem("fb-bible-version") || "kjv").toUpperCase();

  useEffect(() => {
    if (selectedTheme) {
      setLoadingTheme(true);
      setVisibleCount(SCRIPTURES_PER_PAGE);
      fetchScripturesByTheme(selectedTheme).then((s) => {
        // Strictly filter to ONLY show the preferred version to ensure no mixed translations
        const filtered = s.filter(scripture => scripture.translation === preferredVersion);
        
        // As a fallback just in case there are no verses in this translation for this theme,
        // we'll group by reference but force them to the same version visually if we had to, 
        // but strict filtering handles the "no mixed translations" perfectly.
        if (filtered.length > 0) {
          setFilteredScriptures(filtered);
        } else {
          // If literally no verses match, we do the deduplication we had before, 
          // but just strictly filter to the first available translation for the entire theme 
          // to ensure "no mixed translations" throughout the theme.
          const fallbackVersion = s.length > 0 ? s[0].translation : preferredVersion;
          const fallbackFiltered = s.filter(scripture => scripture.translation === fallbackVersion);
          
          const grouped = new Map<string, Scripture>();
          fallbackFiltered.forEach(scripture => {
            if (!grouped.has(scripture.reference)) {
              grouped.set(scripture.reference, scripture);
            }
          });
          setFilteredScriptures(Array.from(grouped.values()));
        }
        setLoadingTheme(false);
      });
    } else {
      setFilteredScriptures([]);
    }
  }, [selectedTheme, preferredVersion]);

  // Read user's theme preferences from localStorage
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
      if (parsed) {
        setCurrentBook(parsed.book);
        setCurrentChapter(parsed.chapter);
      }
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

  const handleVerseSelect = (s: Scripture) => {
    if (selectedVerse?.id === s.id) {
      setSelectedVerse(null);
    } else {
      setSelectedVerse({ text: s.text, reference: s.reference, id: s.id });
    }
  };

  const handleBibleVerseSelect = (v: { verse: number; text: string }) => {
    if (selectedBibleVerse?.verse === v.verse) {
      setSelectedBibleVerse(null);
    } else {
      setSelectedBibleVerse(v);
    }
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
          Themes · Browse scripture
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-0 mb-5 border-b-2 border-foreground">
        {[
          { key: "themes" as const, label: "Themes" },
          { key: "bible" as const, label: "Popular Books" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedVerse(null); setSelectedBibleVerse(null); }}
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

      {activeTab === "themes" && (
        <div className="flex flex-col md:flex-row md:gap-8 md:items-start relative pb-6">
          {/* Left Column: Categories and Themes */}
          <div className="md:w-72 md:shrink-0 md:sticky md:top-20">
            {/* Category tabs */}
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
                    <motion.div
                      animate={{ rotate: selectedTheme === theme ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="md:hidden"
                    >
                      <ArrowRight
                        className={`w-4 h-4 ${selectedTheme === theme ? "text-primary" : "text-muted-foreground"}`}
                        strokeWidth={2}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {/* Mobile expansion */}
                    {selectedTheme === theme && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-secondary/50 md:hidden"
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
                              <div key={s.id}>
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: si * 0.05 }}
                                  onClick={() => handleVerseSelect(s)}
                                  className={`bg-card border-l-4 border-primary p-4 cursor-pointer transition-all ${
                                    selectedVerse?.id === s.id
                                      ? "ring-2 ring-primary/30"
                                      : "hover:bg-secondary"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                                      {s.translation}
                                    </span>
                                  </div>
                                  <p className={`font-display text-sm italic leading-relaxed text-foreground ${
                                    selectedVerse?.id === s.id ? "underline decoration-dotted decoration-primary underline-offset-4" : ""
                                  }`}>
                                    "{s.text}"
                                  </p>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-0.5 bg-primary" />
                                      <p className="text-[10px] font-body font-bold uppercase tracking-widest text-primary">{s.reference}</p>
                                    </div>
                                    <Bookmark
                                      className={`w-4 h-4 ${isFavorite(s.id) ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                      strokeWidth={2}
                                    />
                                  </div>
                                  <p className="mt-2 text-xs font-body text-muted-foreground leading-relaxed">
                                    {s.reflection}
                                  </p>
                                </motion.div>

                                <AnimatePresence>
                                  {selectedVerse?.id === s.id && (
                                    <VerseActionBar
                                      verseText={s.text}
                                      reference={s.reference}
                                      scriptureId={s.id}
                                      onClose={() => setSelectedVerse(null)}
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}

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
          </div>

          {/* Desktop right column: Scriptures */}
          <div className="hidden md:block flex-1 bg-card border border-border p-8 min-h-[600px]">
            {selectedTheme ? (
              loadingTheme ? (
                <div className="flex justify-center py-32">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredScriptures.length === 0 ? (
                <p className="text-muted-foreground font-body py-32 text-center">
                  No scriptures for this theme yet.
                </p>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-display text-3xl font-black mb-6 text-foreground border-b border-border pb-4">{selectedTheme}</h3>
                  <div className="space-y-6">
                    {visibleScriptures.map((s, si) => (
                      <div key={s.id}>
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: si * 0.05 }}
                          onClick={() => handleVerseSelect(s)}
                          className={`bg-background border-l-4 border-primary p-6 cursor-pointer transition-all ${
                            selectedVerse?.id === s.id
                              ? "ring-2 ring-primary/30 shadow-md"
                              : "hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                              {s.translation}
                            </span>
                          </div>
                          <p className={`font-display text-lg italic leading-relaxed text-foreground ${
                            selectedVerse?.id === s.id ? "underline decoration-dotted decoration-primary underline-offset-4" : ""
                          }`}>
                            "{s.text}"
                          </p>
                          <div className="flex items-center justify-between mt-5">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-0.5 bg-primary" />
                              <p className="text-xs font-body font-bold uppercase tracking-widest text-primary">{s.reference}</p>
                            </div>
                            <Bookmark
                              className={`w-4 h-4 ${isFavorite(s.id) ? "text-primary fill-primary" : "text-muted-foreground"}`}
                              strokeWidth={2}
                            />
                          </div>
                          <p className="mt-4 text-sm font-body text-muted-foreground leading-relaxed max-w-2xl">
                            {s.reflection}
                          </p>
                        </motion.div>

                        <AnimatePresence>
                          {selectedVerse?.id === s.id && (
                            <div className="mt-2">
                              <VerseActionBar
                                verseText={s.text}
                                reference={s.reference}
                                scriptureId={s.id}
                                onClose={() => setSelectedVerse(null)}
                              />
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {hasMore && (
                      <button
                        onClick={() => setVisibleCount(prev => prev + SCRIPTURES_PER_PAGE)}
                        className="w-full flex items-center justify-center gap-2 py-4 border border-border text-muted-foreground font-body text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all mt-6"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Load More ({filteredScriptures.length - visibleCount} remaining)
                      </button>
                    )}
                  </div>
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
                placeholder='Search e.g. "John 3:16" or "Sirach 2"'
                className="w-full pl-10 pr-4 py-3 bg-secondary text-foreground font-body text-sm border-2 border-transparent focus:border-primary outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => handleBibleSearch()}
              disabled={bibleLoading}
              className="px-5 py-3 bg-foreground text-background font-body text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50"
            >
              {bibleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
            </button>
          </div>

          {/* Quick access books */}
          <div className="flex gap-2 flex-wrap mb-6">
            {allPopularBooks.map((book) => (
              <button
                key={book}
                onClick={() => { setBibleSearch(`${book} 1`); handleBibleSearch(`${book} 1`); }}
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

              {/* Chapter navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateChapter(-1)}
                  disabled={bibleLoading || currentChapter <= 1}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev Chapter
                </button>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                  Ch. {currentChapter}
                </span>
                <button
                  onClick={() => navigateChapter(1)}
                  disabled={bibleLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30"
                >
                  Next Chapter <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {bibleResult.verses.map((v) => {
                  const isSelected = selectedBibleVerse?.verse === v.verse;
                  return (
                    <div key={`${v.book_id}-${v.chapter}-${v.verse}`}>
                      <p
                        onClick={() => handleBibleVerseSelect(v)}
                        className={`text-sm font-body leading-relaxed text-foreground py-1 px-2 -mx-2 cursor-pointer rounded transition-all ${
                          isSelected
                            ? "bg-primary/10 underline decoration-dotted decoration-primary underline-offset-4"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-primary mr-1.5 align-super">{v.verse}</span>
                        {v.text.trim()}
                      </p>
                      <AnimatePresence>
                        {isSelected && bibleResult && (
                          <VerseActionBar
                            verseText={v.text.trim()}
                            reference={`${bibleResult.reference.split(":")[0]}:${v.verse}`}
                            onClose={() => setSelectedBibleVerse(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Bottom chapter navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => navigateChapter(-1)}
                  disabled={bibleLoading || currentChapter <= 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => navigateChapter(1)}
                  disabled={bibleLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-body font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all disabled:opacity-30"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
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
                Enter any book, chapter, or verse reference. Includes deuterocanonical books like Sirach and Wisdom of Solomon.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
