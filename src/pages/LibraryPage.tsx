import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ChevronRight, Loader2 } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

// Categorize themes
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
      <div className="pt-4 pb-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Bible <span className="italic text-primary">Library</span>
        </h1>
        <p className="text-xs font-body text-muted-foreground mt-1">Browse scripture by theme</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mt-3 mb-4">
        {[
          { key: "all" as const, label: "All" },
          { key: "positive" as const, label: "Virtues" },
          { key: "real" as const, label: "Real Talk" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveCategory(key); setSelectedTheme(null); }}
            className={`px-4 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
              activeCategory === key
                ? "bg-foreground text-background"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Themes */}
      <div className="space-y-2">
        {displayThemes.map((theme) => (
          <div key={theme}>
            <button
              onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                selectedTheme === theme 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-card border-border hover:bg-secondary"
              }`}
            >
              <span className={`font-display text-sm font-semibold ${selectedTheme === theme ? "" : "text-foreground"}`}>
                {theme}
              </span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  selectedTheme === theme ? "rotate-90 text-background/60" : "text-muted-foreground"
                }`}
                strokeWidth={1.5}
              />
            </button>

            <AnimatePresence>
              {selectedTheme === theme && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {loadingTheme ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : filteredScriptures.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body py-4 text-center">
                      No scriptures for this theme yet.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2 mb-2">
                      {filteredScriptures.map((s) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-border rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-body text-muted-foreground">
                              {s.translation}
                            </span>
                          </div>
                          <p className="font-display text-sm italic leading-relaxed text-foreground">
                            "{s.text}"
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs font-body font-semibold text-primary">— {s.reference}</p>
                            <button
                              onClick={() => {
                                toggle(s.id);
                                toast.success(isFavorite(s.id) ? "Removed" : "Saved");
                              }}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isFavorite(s.id) ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                strokeWidth={1.5}
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
