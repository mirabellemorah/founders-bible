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
 */
export async function fetchBibleChapter(book: string, chapter: number): Promise<BiblePassage | null> {
  return fetchBiblePassage(`${book} ${chapter}`);
}

/**
 * Build a reference range for loading more context around a verse
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

/**
 * Parse a reference string to extract book, chapter, verse info
 */
export function parseReference(ref: string): { book: string; chapter: number } | null {
  // Match patterns like "Genesis 1", "1 John 3", "Psalm 23:1-6"
  const match = ref.match(/^(.+?)\s+(\d+)/);
  if (!match) return null;
  return { book: match[1], chapter: parseInt(match[2]) };
}

// Orthodox/Deuterocanonical books supported by bible-api.com (WEB translation)
export const orthodoxBooks = [
  "Tobit", "Judith", "Wisdom of Solomon", "Sirach",
  "Baruch", "1 Maccabees", "2 Maccabees",
];

// All popular books including deuterocanonical
export const allPopularBooks = [
  "Genesis", "Exodus", "Psalms", "Proverbs", "Isaiah",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "Philippians", "James", "Revelation",
  "Tobit", "Wisdom of Solomon", "Sirach",
];
