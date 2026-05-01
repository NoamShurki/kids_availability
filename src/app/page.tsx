import { createClient } from "@/lib/supabase/server";
import { BabyCard } from "@/components/BabyCard";
import type { FamilyWithBabies } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: families } = await supabase
    .from("families")
    .select(`
      *,
      babies (
        *,
        baby_status_current (
          *,
          status_definitions (*)
        )
      )
    `)
    .order("created_at", { ascending: true });

  if (!families || families.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-4">👶</p>
        <p className="text-xl">No babies added yet.</p>
      </div>
    );
  }

  const allFamilies = families as FamilyWithBabies[];

  return (
    <div className="space-y-10">
      {allFamilies.map((family) => (
        <section key={family.id}>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{family.name}</h1>
          <div className="space-y-4">
            {family.babies.map((baby) => (
              <BabyCard key={baby.id} baby={baby} familySlug={family.slug} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
