import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
  const admin = await createAdminClient();
  const { data: subs, error } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth");

  console.log("Subscriptions found:", subs?.length ?? 0, "Error:", error?.message);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: false, reason: "no subscriptions", error: error?.message });
  }

  const payload = JSON.stringify({ title: "Test notification", body: "Push is working!" });

  const results = await Promise.allSettled(
    subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const report = results.map((r, i) =>
    r.status === "fulfilled"
      ? { sub: i, ok: true }
      : { sub: i, ok: false, statusCode: (r.reason as { statusCode?: number }).statusCode, message: (r.reason as { message?: string }).message }
  );

  console.log("Push results:", JSON.stringify(report));
  return NextResponse.json({ report });
}
