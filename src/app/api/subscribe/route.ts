import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: { babyId: string; subscription: PushSubscriptionJSON };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { babyId, subscription } = body;
  if (!babyId || !subscription?.endpoint) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  await supabase.from("push_subscriptions").upsert({
    baby_id: babyId,
    endpoint: subscription.endpoint,
    p256dh: (subscription.keys as Record<string, string>)?.p256dh ?? "",
    auth: (subscription.keys as Record<string, string>)?.auth ?? "",
  }, { onConflict: "endpoint" });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let body: { endpoint: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint);

  return NextResponse.json({ ok: true });
}
