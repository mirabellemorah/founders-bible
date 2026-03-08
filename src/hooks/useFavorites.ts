import { useState, useEffect, useCallback } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("fb-favorites") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fb-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
