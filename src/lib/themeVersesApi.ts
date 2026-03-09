import { fetchBiblePassage, type BiblePassage } from "./bibleApi";

const THEME_VERSES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/theme-verses`;

export interface ThemeVerse {
  reference: string;
  reason: string;
  passage?: BiblePassage | null;
  loading?: boolean;
}

/**
 * Fetch AI-suggested verse references for a theme, then hydrate them with actual text from bible-api.com
 */
export async function fetchThemeVerses(theme: string): Promise<ThemeVerse[]> {
  try {
    const resp = await fetch(THEME_VERSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ theme }),
    });

    if (!resp.ok) return [];
    const data = await resp.json();
    return data.verses || [];
  } catch {
    return [];
  }
}

/**
 * Hydrate a single verse reference with actual Bible text
 */
export async function hydrateVerse(verse: ThemeVerse): Promise<ThemeVerse> {
  const passage = await fetchBiblePassage(verse.reference);
  return { ...verse, passage };
}
