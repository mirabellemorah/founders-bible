export interface SavedHighlight {
  text: string;
  reference: string;
  savedAt: string;
}

const STORAGE_KEY = "fb-saved-highlights";

export function getSavedHighlights(): SavedHighlight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleHighlight(highlight: { text: string; reference: string }) {
  const highlights = getSavedHighlights();
  const index = highlights.findIndex(
    (h) => h.reference === highlight.reference && h.text === highlight.text
  );
  if (index >= 0) {
    highlights.splice(index, 1);
  } else {
    highlights.unshift({ ...highlight, savedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
}

export function isHighlightSaved(reference: string, text: string): boolean {
  return getSavedHighlights().some(
    (h) => h.reference === reference && h.text === text
  );
}
