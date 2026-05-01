import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type ManageBaby = {
  id: string;
  name: string;
  slug: string;
  family_id: string;
  families: { name: string; slug: string } | { name: string; slug: string }[] | null;
  baby_status_current: Array<{
    updated_at: string;
    status_definitions: { label: string; emoji: string | null; color_hex: string | null } | null;
  }>;
};

export default async function ManageDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("family_managers")
    .select("family_id")
    .eq("user_id", user!.id);

  const familyIds = (memberships ?? []).map((m: { family_id: string }) => m.family_id);

  if (familyIds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🚫</p>
        <p>You are not a manager of any family yet.</p>
        <p className="text-sm mt-2">Ask your family admin to add you.</p>
      </div>
    );
  }

  const { data: babies } = await supabase
    .from("babies")
    .select(`
      id, name, slug, family_id,
      families ( name, slug ),
      baby_status_current (
        updated_at,
        status_definitions ( label, emoji, color_hex )
      )
    `)
    .in("family_id", familyIds)
    .order("name");

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">Tap a baby to update their status.</p>
      {((babies ?? []) as unknown as ManageBaby[]).map((baby) => {
        const current = baby.baby_status_current?.[0];
        const status = current?.status_definitions;
        const family = Array.isArray(baby.families) ? baby.families[0] : baby.families;

        return (
          <Link
            key={baby.id}
            href={`/manage/${baby.slug}`}
            className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">👶</span>
            <div>
              <p className="font-bold text-gray-900">{baby.name}</p>
              <p className="text-sm text-gray-500">{family?.name}</p>
              {status && (
                <p className="text-sm mt-0.5">
                  {status.emoji} {status.label}
                </p>
              )}
            </div>
            <span className="ml-auto text-gray-400">›</span>
          </Link>
        );
      })}
    </div>
  );
}
