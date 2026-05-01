import Link from "next/link";
import type { BabyWithStatus } from "@/lib/types";
import { resolveCurrentStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { LastUpdated } from "./LastUpdated";

interface Props {
  baby: BabyWithStatus;
  familySlug: string;
}

export function BabyCard({ baby, familySlug }: Props) {
  const current = resolveCurrentStatus(baby.baby_status_current);
  const status = current?.status_definitions;

  return (
    <Link
      href={`/${familySlug}/${baby.slug}`}
      className="block rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-4xl">
          {baby.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={baby.avatar_url} alt={baby.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            "👶"
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900">{baby.name}</h2>
          {status ? (
            <>
              <StatusBadge status={status} size="sm" />
              {current && <LastUpdated updatedAt={current.updated_at} />}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No status set</p>
          )}
        </div>
      </div>
    </Link>
  );
}
