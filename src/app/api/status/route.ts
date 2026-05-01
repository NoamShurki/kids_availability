import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { babySlug: string; statusDefinitionId: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { babySlug, statusDefinitionId, note } = body;
  if (!babySlug || !statusDefinitionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the user manages a family that owns this baby
  const { data: memberships } = await supabase
    .from("family_managers")
    .select("family_id")
    .eq("user_id", user.id);

  const familyIds = (memberships ?? []).map((m: { family_id: string }) => m.family_id);

  const { data: baby } = await supabase
    .from("babies")
    .select("id, family_id")
    .eq("slug", babySlug)
    .in("family_id", familyIds)
    .single();

  if (!baby) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 });
  }

  // Verify the status definition belongs to the same family
  const { data: statusDef } = await supabase
    .from("status_definitions")
    .select("id")
    .eq("id", statusDefinitionId)
    .eq("family_id", baby.family_id)
    .single();

  if (!statusDef) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Upsert current status
  const { error: upsertError } = await supabase
    .from("baby_status_current")
    .upsert({
      baby_id: baby.id,
      status_def_id: statusDefinitionId,
      note: note || null,
      updated_at: now,
      updated_by: user.id,
    }, { onConflict: "baby_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Append to history
  await supabase.from("baby_status_history").insert({
    baby_id: baby.id,
    status_def_id: statusDefinitionId,
    note: note || null,
    set_at: now,
    set_by: user.id,
  });

  return NextResponse.json({ ok: true });
}
