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
      {/* Hero */}
      <div className="pt-6 pb-4 relative">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute -top-4 right-0 font-display text-[120px] font-black text-foreground leading-none select-none pointer-events-none"
        >
          {savedScriptures.length}
        </motion.p>
        <h1 className="font-display text-5xl font-black text-foreground leading-[0.9] tracking-tight relative z-10">
          YOUR
          <br />
          <span className="italic text-primary">SAVED</span>
        </h1>
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-muted-foreground mt-3">
          {savedScriptures.length} verse{savedScriptures.length !== 1 ? "s" : ""} collected
        </p>
      </div>

      {savedScriptures.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-5">
            <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <p className="font-display text-2xl font-black text-foreground tracking-tight">
            NOTHING
            <br />
            <span className="italic text-primary">YET</span>
          </p>
          <p className="text-xs text-muted-foreground font-body mt-3 max-w-[240px]">
            Tap the bookmark icon on any scripture to start building your collection.
          </p>
        </motion.div>
      ) : (
        <div className="mt-2 space-y-1">
          {savedScriptures.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border-l-4 border-primary p-4"
            >
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary text-[10px] font-body font-bold uppercase tracking-wider text-primary-foreground">
                  {s.theme}
                </span>
                <span className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                  {s.translation}
                </span>
              </div>
              <p className="mt-3 font-display text-sm italic leading-relaxed text-foreground">"{s.text}"</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-primary" />
                  <p className="text-[10px] font-body font-bold uppercase tracking-widest text-primary">{s.reference}</p>
                </div>
                <button
                  onClick={async () => {
                    await toggle(s.id);
                    toast.success("Removed from saved");
                    const updated = await fetchFavoriteScriptures();
                    setSavedScriptures(updated);
                  }}
                >
                  <Bookmark className="w-4 h-4 text-primary fill-primary" strokeWidth={2} />
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
