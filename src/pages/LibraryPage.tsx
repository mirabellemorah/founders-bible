import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const positiveThemes = ["Leadership", "Courage", "Faith", "Patience", "Discipline", "Purpose", "Wisdom", "Perseverance", "Hope", "Love", "Humility", "Gratitude", "Trust", "Strength", "Peace", "Integrity"];
const realThemes = ["Fear", "Money", "Negotiation", "Anxiety", "Failure", "Anger", "Jealousy", "Loneliness", "Doubt", "Greed", "Pride", "Suffering"];

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get("theme") as Theme) || null;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(initialTheme);
  const [filteredScriptures, setFilteredScriptures] = useState<Scripture[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "positive" | "real">("all");
  const { toggle, isFavorite } = useFavorites();

  useEffect(() => {
    if (selectedTheme) {
      setLoadingTheme(true);
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

      {/* Category tabs — bold editorial */}
      <div className="flex gap-1 mb-5 border-b-2 border-foreground pb-3">
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
      <div className="space-y-1">
        {displayThemes.map((theme, i) => (
          <div key={theme}>
            <button
              onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
              className={`w-full flex items-center justify-between px-4 py-4 transition-all border-b ${
                selectedTheme === theme
                  ? "bg-foreground text-background border-foreground"
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
              <ArrowRight
                className={`w-4 h-4 transition-all ${
                  selectedTheme === theme ? "rotate-90 text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={2}
              />
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
                      {filteredScriptures.map((s, si) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: si * 0.05 }}
                          className="bg-card border-l-4 border-primary p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                              {s.translation}
                            </span>
                          </div>
                          <p className="font-display text-sm italic leading-relaxed text-foreground">
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
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
