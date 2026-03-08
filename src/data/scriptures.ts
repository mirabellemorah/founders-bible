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

export async function fetchDailyScripture(): Promise<Scripture | null> {
  const today = new Date().toISOString().split("T")[0];

  // Check if we have a daily scripture for today
  const { data: daily } = await supabase
    .from("daily_scripture")
    .select("scripture_id")
    .eq("date", today)
    .maybeSingle();

  if (daily) {
    const { data } = await supabase
      .from("scriptures")
      .select("*")
      .eq("id", daily.scripture_id)
      .single();
    return data;
  }

  // Pick a scripture based on day of year for consistency
  const { data: allScriptures } = await supabase
    .from("scriptures")
    .select("*");

  if (!allScriptures || allScriptures.length === 0) return null;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return allScriptures[dayOfYear % allScriptures.length];
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
