import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusPicker } from "@/components/StatusPicker";
import type { BabyWithStatus } from "@/lib/types";

interface Props {
  params: Promise<{ babySlug: string }>;
}

export default async function ManageBabyPage({ params }: Props) {
  const { babySlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all families managed by this user
  const { data: memberships } = await supabase
    .from("family_managers")
    .select("family_id")
    .eq("user_id", user!.id);

  const familyIds = (memberships ?? []).map((m: { family_id: string }) => m.family_id);

  const { data: baby } = await supabase
    .from("babies")
    .select(`
      *,
      baby_status_current (
        *,
        status_definitions (*)
      )
    `)
    .eq("slug", babySlug)
    .in("family_id", familyIds)
    .single();

  if (!baby) notFound();

  const b = baby as BabyWithStatus;
  const current = b.baby_status_current?.[0];

  // Load status options for this family
  const { data: statuses } = await supabase
    .from("status_definitions")
    .select("*")
    .eq("family_id", b.family_id)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-5xl mb-2">👶</p>
        <h1 className="text-2xl font-bold text-gray-900">{b.name}</h1>
        {current && (
          <p className="text-gray-500 text-sm mt-1">
            Current: {current.status_definitions.emoji} {current.status_definitions.label}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Set new status</h2>
        <StatusPicker
          statuses={statuses ?? []}
          currentStatusId={current?.status_def_id ?? ""}
          babySlug={babySlug}
        />
      </div>
    </div>
  );
}
