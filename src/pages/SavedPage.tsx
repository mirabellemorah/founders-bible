import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookOpen, Loader2, X } from "lucide-react";
import { fetchFavoriteScriptures, type Scripture } from "@/data/scriptures";
import { useFavorites } from "@/hooks/useFavorites";
import { getSavedHighlights, toggleHighlight, type SavedHighlight } from "@/lib/highlights";
import { toast } from "sonner";

export default function SavedPage() {
  const { favorites, toggle, loading: favsLoading } = useFavorites();
  const [savedScriptures, setSavedScriptures] = useState<Scripture[]>([]);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favsLoading) {
      fetchFavoriteScriptures().then((s) => {
        setSavedScriptures(s);
        setLoading(false);
      });
    }
  }, [favsLoading, favorites]);

  useEffect(() => {
    setHighlights(getSavedHighlights());
  }, []);

  const totalCount = savedScriptures.length + highlights.length;

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
          {totalCount}
        </motion.p>
        <h1 className="font-display text-5xl font-black text-foreground leading-[0.9] tracking-tight relative z-10">
          YOUR
          <br />
          <span className="italic text-primary">SAVED</span>
        </h1>
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-muted-foreground mt-3">
          {totalCount} item{totalCount !== 1 ? "s" : ""} collected
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b-2 border-foreground">
        {[
          { key: "scriptures" as const, label: "Scriptures", count: savedScriptures.length },
          { key: "highlights" as const, label: "Highlights", count: highlights.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-[11px] font-body font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {activeTab === "scriptures" && (
        <>
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
        </>
      )}

      {activeTab === "highlights" && (
        <>
          {highlights.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-5">
                <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-display text-2xl font-black text-foreground tracking-tight">
                NO <span className="italic text-primary">HIGHLIGHTS</span>
              </p>
              <p className="text-xs text-muted-foreground font-body mt-3 max-w-[240px]">
                Tap any verse in Popular Books to save it here.
              </p>
            </motion.div>
          ) : (
            <div className="mt-2 space-y-1">
              {highlights.map((h, i) => (
                <motion.div
                  key={`${h.reference}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border-l-4 border-primary p-4"
                >
                  <p className="font-display text-sm italic leading-relaxed text-foreground">"{h.text}"</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-primary" />
                      <p className="text-[10px] font-body font-bold uppercase tracking-widest text-primary">{h.reference}</p>
                    </div>
                    <button
                      onClick={() => {
                        toggleHighlight({ text: h.text, reference: h.reference });
                        setHighlights(getSavedHighlights());
                        toast.success("Removed from highlights");
                      }}
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-primary" strokeWidth={2} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-8" />
    </div>
  );
}