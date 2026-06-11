import { supabase } from "@/lib/supabase";

export async function createNewsItem({
  worldId,
  careerId,
  year,
  month,
  category,
  headline,
  body,
  importance = "normal",
}: {
  worldId: string;
  careerId: string;
  year: number;
  month: string;
  category: string;
  headline: string;
  body: string;
  importance?: "normal" | "major" | "legendary";
}) {
  if (!worldId || !careerId) return;

  await supabase.from("news_items").insert({
    world_id: worldId,
    career_id: careerId,
    year,
    month,
    category,
    headline,
    body,
    importance,
  });
}