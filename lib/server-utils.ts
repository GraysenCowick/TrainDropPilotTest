import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";

export async function generateSlug(): Promise<string> {
  const supabase = await createClient();
  let slug: string = "";
  let attempts = 0;

  do {
    // Generate 8-char slug: lowercase letters + digits
    const raw = nanoid(12);
    slug = raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    if (slug.length < 8) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      while (slug.length < 8) {
        slug += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    attempts++;

    const { data } = await supabase
      .from("modules")
      .select("id")
      .eq("share_slug", slug)
      .single();

    if (!data) break; // Slug is unique
  } while (attempts < 10);

  return slug;
}
