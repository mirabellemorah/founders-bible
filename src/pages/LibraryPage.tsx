import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, ChevronRight } from "lucide-react";
import { themes, getScripturesByTheme, type Theme } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const translations = ["NIV", "KJV", "ESV", "Orthodox"] as const;

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const initialTheme = (searchParams.get("theme") as Theme) || null;
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(initialTheme);
  const [translation, setTranslation] = useState<string>("NIV");
  const { toggle, isFavorite } = useFavorites();

  const filteredScriptures = selectedTheme ? getScripturesByTheme(selectedTheme) : [];

  return (
    <div className="px-5 pt-safe">
      <div className="pt-6 pb-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Bible Library
        </h1>
        <p className="text-xs font-body text-muted-foreground mt-1">
          Browse scripture by theme
        </p>
      </div>

      {/* Translation toggle */}
      <div className="mt-4 flex gap-1.5 bg-card rounded-xl p-1 border border-border">
        {translations.map((t) => (
          <button
            key={t}
            onClick={() => setTranslation(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-body font-medium transition-colors ${
              translation === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Themes */}
      <div className="mt-5 space-y-2">
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
              selectedTheme === theme
                ? "bg-gold/10 border-gold/30"
                : "bg-card border-border"
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
        ))}
      </div>

      {/* Expanded scriptures */}
      <AnimatePresence>
        {selectedTheme && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            {filteredScriptures.length === 0 && (
              <p className="text-sm text-muted-foreground font-body py-4 text-center">
                No scriptures for this theme yet.
              </p>
            )}
            {filteredScriptures.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <p className="font-display text-sm italic leading-relaxed text-foreground">
                  "{s.text}"
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs font-body font-medium text-gold-dark">
                    — {s.reference}
                  </p>
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8" />
    </div>
  );
}
