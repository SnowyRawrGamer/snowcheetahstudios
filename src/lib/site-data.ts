import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = Record<string, string>;

export async function fetchSettings(): Promise<SettingsMap> {
  const { data } = await supabase.from("site_settings").select("key, value");
  const map: SettingsMap = {};
  (data ?? []).forEach((row) => { if (row.value != null) map[row.key] = row.value; });
  return map;
}

export const DEFAULT_SETTINGS: SettingsMap = {
  hero_title: "Snow Cheetah Studios",
  hero_subtitle: "Crafting playful Roblox worlds from a snowy peak.",
  featured_game_title: "Escape Tsunami For Pets",
  featured_game_description: "Race against the rising wave to save every pet you love.",
  featured_game_url: "https://view-link.cx/OuIP4sdxDhZ",
  featured_game_cta: "Play on Roblox",
  countdown_target: "",
};