import { useState, useEffect, useCallback } from "react";
import { fetchFavorites, toggleFavorite } from "@/data/scriptures";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const favs = await fetchFavorites();
      setFavorites(favs);
    } catch (e) {
      console.error("Failed to load favorites:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (id: string) => {
      const isFav = favorites.includes(id);
      // Optimistic update
      setFavorites((prev) =>
        isFav ? prev.filter((f) => f !== id) : [...prev, id]
      );
      try {
        await toggleFavorite(id, isFav);
      } catch (e) {
        console.error("Failed to toggle favorite:", e);
        // Revert
        setFavorites((prev) =>
          isFav ? [...prev, id] : prev.filter((f) => f !== id)
        );
      }
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return { favorites, toggle, isFavorite, loading, reload: load };
}
