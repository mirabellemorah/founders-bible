import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Scripture = Tables<"scriptures">;

export const themes = [
  "Leadership",
  "Courage",
  "Faith",
  "Patience",
  "Discipline",
  "Purpose",
  "Wisdom",
  "Perseverance",
  "Hope",
  "Love",
  "Humility",
  "Gratitude",
  "Trust",
  "Strength",
  "Peace",
  "Integrity",
  "Fear",
  "Money",
  "Negotiation",
  "Anxiety",
  "Failure",
  "Anger",
  "Jealousy",
  "Loneliness",
  "Doubt",
  "Greed",
  "Pride",
  "Suffering",
] as const;

export type Theme = (typeof themes)[number];

// Get device ID for anonymous favorites
export function getDeviceId(): string {
  let id = localStorage.getItem("fb-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("fb-device-id", id);
  }
  return id;
}

export async function fetchScriptures(): Promise<Scripture[]> {
  const { data, error } = await supabase
    .from("scriptures")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function fetchScripturesByTheme(theme: string): Promise<Scripture[]> {
  const { data, error } = await supabase
    .from("scriptures")
    .select("*")
    .eq("theme", theme)
    .order("reference");
  if (error) throw error;
  return data || [];
}

export async function fetchDailyScripture(preferredVersion?: string): Promise<Scripture | null> {
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have a scripture assigned for today
  const { data: daily } = await supabase
    .from("daily_scripture")
    .select("scripture_id")
    .eq("date", today)
    .maybeSingle();

  if (daily) {
    const { data: dailyVerse } = await supabase
      .from("scriptures")
      .select("*")
      .eq("id", daily.scripture_id)
      .single();
      
    if (dailyVerse && preferredVersion && dailyVerse.translation !== preferredVersion) {
      const { data: matches } = await supabase
        .from("scriptures")
        .select("*")
        .eq("reference", dailyVerse.reference);
      
      if (matches && matches.length > 0) {
        const preferred = matches.find(m => m.translation === preferredVersion);
        return preferred || dailyVerse;
      }
    }
    return dailyVerse;
  }

  // No scripture for today: pick one deterministically and save it
  const { data: allScriptures } = await supabase
    .from("scriptures")
    .select("*");

  if (!allScriptures || allScriptures.length === 0) return null;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const selected = allScriptures[dayOfYear % allScriptures.length];

  // Insert into daily_scripture so it stays consistent for the whole day
  await supabase
    .from("daily_scripture")
    .insert({ date: today, scripture_id: selected.id })
    .select()
    .maybeSingle();

  if (preferredVersion && selected.translation !== preferredVersion) {
    const { data: matches } = await supabase
      .from("scriptures")
      .select("*")
      .eq("reference", selected.reference);
      
    if (matches && matches.length > 0) {
      const preferred = matches.find(m => m.translation === preferredVersion);
      return preferred || selected;
    }
  }

  return selected;
}

export async function fetchFavorites(): Promise<string[]> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("favorites")
    .select("scripture_id")
    .eq("device_id", deviceId);
  if (error) throw error;
  return (data || []).map((f) => f.scripture_id);
}

export async function toggleFavorite(scriptureId: string, isFavorite: boolean): Promise<void> {
  const deviceId = getDeviceId();
  if (isFavorite) {
    await supabase
      .from("favorites")
      .delete()
      .eq("device_id", deviceId)
      .eq("scripture_id", scriptureId);
  } else {
    await supabase
      .from("favorites")
      .insert({ device_id: deviceId, scripture_id: scriptureId });
  }
}

export async function fetchFavoriteScriptures(): Promise<Scripture[]> {
  const deviceId = getDeviceId();
  const { data: favs } = await supabase
    .from("favorites")
    .select("scripture_id")
    .eq("device_id", deviceId);

  if (!favs || favs.length === 0) return [];

  const ids = favs.map((f) => f.scripture_id);
  const { data } = await supabase
    .from("scriptures")
    .select("*")
    .in("id", ids);
  return data || [];
}
