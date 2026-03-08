import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ChevronRight, Loader2 } from "lucide-react";
import { themes, fetchScripturesByTheme, type Theme, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get("theme") as Theme) || null;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(initialTheme);
  const [filteredScriptures, setFilteredScriptures] = useState<Scripture[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(false);
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

  return (
    <div className="px-5 pt-safe">
      <div className="pt-6 pb-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Bible Library</h1>
        <p className="text-xs font-body text-muted-foreground mt-1">Browse scripture by theme</p>
      </div>

      {/* Themes */}
      <div className="mt-5 space-y-2">
        {themes.map((theme) => (
          <div key={theme}>
            <button
              onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
                selectedTheme === theme ? "bg-gold/10 border-gold/30" : "bg-card border-border"
              }`}
            >
              <span className="font-display text-sm font-medium text-foreground">{theme}</span>
              <ChevronRight
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  selectedTheme === theme ? "rotate-90" : ""
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
                      <Loader2 className="w-5 h-5 animate-spin text-gold" />
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
                            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-body text-muted-foreground">
                              {s.translation}
                            </span>
                          </div>
                          <p className="font-display text-sm italic leading-relaxed text-foreground">
                            "{s.text}"
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs font-body font-medium text-gold-dark">— {s.reference}</p>
                            <button
                              onClick={() => {
                                toggle(s.id);
                                toast.success(isFavorite(s.id) ? "Removed" : "Saved");
                              }}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isFavorite(s.id) ? "text-gold fill-gold" : "text-muted-foreground"}`}
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
