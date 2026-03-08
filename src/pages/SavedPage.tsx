import { motion } from "framer-motion";
import { Bookmark, BookOpen } from "lucide-react";
import { scriptures } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

export default function SavedPage() {
  const { favorites, toggle } = useFavorites();
  const savedScriptures = scriptures.filter((s) => favorites.includes(s.id));

  return (
    <div className="px-5 pt-safe">
      <div className="pt-6 pb-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Saved Scriptures
        </h1>
        <p className="text-xs font-body text-muted-foreground mt-1">
          {savedScriptures.length} verse{savedScriptures.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {savedScriptures.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-scripture flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-gold" strokeWidth={1.5} />
          </div>
          <p className="font-display text-lg font-medium text-foreground">
            No saved verses yet
          </p>
          <p className="text-sm text-muted-foreground font-body mt-2 max-w-[240px]">
            Tap the bookmark icon on any scripture to save it here.
          </p>
        </motion.div>
      ) : (
        <div className="mt-4 space-y-3">
          {savedScriptures.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <span className="px-2.5 py-0.5 rounded-full bg-scripture text-[10px] font-body font-medium text-gold-dark tracking-wide">
                {s.theme}
              </span>
              <p className="mt-3 font-display text-sm italic leading-relaxed text-foreground">
                "{s.text}"
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-body font-medium text-gold-dark">
                  — {s.reference}
                </p>
                <button
                  onClick={() => {
                    toggle(s.id);
                    toast.success("Removed from saved");
                  }}
                >
                  <Bookmark className="w-4 h-4 text-gold fill-gold" strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
