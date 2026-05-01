import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BabyCard } from "@/components/BabyCard";
import type { FamilyWithBabies } from "@/lib/types";

interface Props {
  params: Promise<{ familySlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { familySlug } = await params;
  return { title: `${familySlug.replace(/-/g, " ")} — Baby Available?` };
}

export const revalidate = 60;

export default async function FamilyPage({ params }: Props) {
  const { familySlug } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
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
    .eq("slug", familySlug)
    .single();

  if (!family) notFound();

  const f = family as FamilyWithBabies;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">{f.name}</h1>
        <p className="text-gray-500 mt-1">Tap a baby to see their current status</p>
      </header>

      <div className="space-y-4">
        {f.babies.map((baby) => (
          <BabyCard key={baby.id} baby={baby} familySlug={familySlug} />
        ))}
      </div>
    </div>
  );
}
