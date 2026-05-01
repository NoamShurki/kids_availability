import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtimeStatus } from "@/components/RealtimeStatus";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import Link from "next/link";
import type { BabyWithStatus } from "@/lib/types";

interface Props {
  params: Promise<{ familySlug: string; babySlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { babySlug } = await params;
  return { title: `${babySlug} — Baby Available?` };
}

export const revalidate = 0; // always fresh — realtime takes over client-side

export default async function BabyStatusPage({ params }: Props) {
  const { familySlug, babySlug } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id, name, slug")
    .eq("slug", familySlug)
    .single();

  if (!family) notFound();

  const { data: baby } = await supabase
    .from("babies")
    .select(`
      *,
      baby_status_current (
        *,
        status_definitions (*)
      )
    `)
    .eq("family_id", family.id)
    .eq("slug", babySlug)
    .single();

  if (!baby) notFound();

  const b = baby as BabyWithStatus;
  const current = b.baby_status_current?.[0];

  return (
    <div className="space-y-6">
      <Link href={`/${familySlug}`} className="text-sm text-blue-600 hover:underline">
        ← {family.name}
      </Link>

      <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <div className="text-6xl" role="img" aria-label={b.name}>
          {b.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.avatar_url} alt={b.name} className="mx-auto h-24 w-24 rounded-full object-cover" />
          ) : (
            "👶"
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{b.name}</h1>

        {current ? (
          <RealtimeStatus
            babyId={b.id}
            status={current as Parameters<typeof RealtimeStatus>[0]["status"]}
          />
        ) : (
          <p className="text-gray-400 text-lg">No status set yet</p>
        )}
      </div>

      <SuggestionBanner babyId={b.id} />
    </div>
  );
}
