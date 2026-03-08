import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookOpen, Loader2 } from "lucide-react";
import { fetchFavoriteScriptures, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

export default function SavedPage() {
  const { favorites, toggle, loading: favsLoading } = useFavorites();
  const [savedScriptures, setSavedScriptures] = useState<Scripture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favsLoading) {
      fetchFavoriteScriptures().then((s) => {
        setSavedScriptures(s);
        setLoading(false);
      });
    }
  }, [favsLoading, favorites]);

  if (loading || favsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-5">
      <div className="pt-4 pb-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Saved <span className="italic text-primary">Verses</span>
        </h1>
        <p className="text-xs font-body text-muted-foreground mt-1">
          {savedScriptures.length} verse{savedScriptures.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {savedScriptures.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <p className="font-display text-lg font-bold text-foreground">No saved verses yet</p>
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
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-body font-medium text-primary tracking-wide">
                  {s.theme}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-body text-muted-foreground">
                  {s.translation}
                </span>
              </div>
              <p className="mt-3 font-display text-sm italic leading-relaxed text-foreground">"{s.text}"</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-body font-semibold text-primary">— {s.reference}</p>
                <button
                  onClick={async () => {
                    await toggle(s.id);
                    toast.success("Removed from saved");
                    const updated = await fetchFavoriteScriptures();
                    setSavedScriptures(updated);
                  }}
                >
                  <Bookmark className="w-4 h-4 text-primary fill-primary" strokeWidth={1.5} />
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
