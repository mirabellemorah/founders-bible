const BASE_URL = "https://bible-api.com";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

/**
 * Fetch a passage from bible-api.com
 * Examples: "John 3:16", "Romans 8:28-39", "Proverbs 3:5-6"
 */
export async function fetchBiblePassage(reference: string): Promise<BiblePassage | null> {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(reference)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as BiblePassage;
  } catch {
    return null;
  }
}

/**
 * Fetch an entire chapter
 * Example: "Psalm 23" returns all verses in that chapter
 */
export async function fetchBibleChapter(book: string, chapter: number): Promise<BiblePassage | null> {
  return fetchBiblePassage(`${book} ${chapter}`);
}

/**
 * Build a reference range for loading more context around a verse
 * e.g., given "Proverbs", chapter 3, verseStart 5, verseEnd 6, expand by `extra` verses in each direction
 */
export function buildExpandedReference(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  extra: number
): string {
  const start = Math.max(1, verseStart - extra);
  const end = (verseEnd || verseStart) + extra;
  return `${book} ${chapter}:${start}-${end}`;
}
