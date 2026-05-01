import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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
    .select("id, label, emoji")
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

  // Send push notifications if status is "available"
  if (statusDef && statusDef.label.toLowerCase().includes("available")) {
    const admin = await createAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("baby_id", baby.id);

    if (subs && subs.length > 0) {
      const { data: babyRow } = await supabase.from("babies").select("name").eq("id", baby.id).single();
      const babyName = babyRow?.name ?? "Baby";
      const payload = JSON.stringify({
        title: `${statusDef.emoji ?? ""} ${babyName} is available!`.trim(),
        body: note || `Status: ${statusDef.label}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}`,
      });

      await Promise.allSettled(
        subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          ).catch(() => {
            // Remove expired/invalid subscriptions
            admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          })
        )
      );
    }
  }

  return NextResponse.json({ ok: true });
}
