import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSuggestion } from "@/lib/suggestions";

export const revalidate = 900; // 15-minute cache

export async function GET(request: NextRequest) {
  const babyId = request.nextUrl.searchParams.get("babyId");
  if (!babyId) {
    return NextResponse.json({ suggestion: null });
  }

  const supabase = await createClient();

  // Get current status
  const { data: current } = await supabase
    .from("baby_status_current")
    .select("*, status_definitions(*)")
    .eq("baby_id", babyId)
    .single();

  if (!current) {
    return NextResponse.json({ suggestion: null });
  }

  // Get last 30 days of history for the algorithm
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: history } = await supabase
    .from("baby_status_history")
    .select("*, status_definitions(*)")
    .eq("baby_id", babyId)
    .gte("set_at", since)
    .order("set_at", { ascending: true });

  const suggestion = generateSuggestion(
    current.status_definitions,
    history ?? [],
    current.updated_at,
    new Date()
  );

  return NextResponse.json(
    { suggestion },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=60" } }
  );
}
