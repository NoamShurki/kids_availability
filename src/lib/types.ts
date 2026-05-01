export type Family = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Baby = {
  id: string;
  family_id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  created_at: string;
};

export type StatusDefinition = {
  id: string;
  family_id: string;
  label: string;
  emoji: string | null;
  color_hex: string | null;
  sort_order: number;
  is_default: boolean;
};

export type BabyStatusCurrent = {
  id: string;
  baby_id: string;
  status_def_id: string;
  note: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type BabyStatusHistory = {
  id: string;
  baby_id: string;
  status_def_id: string;
  note: string | null;
  set_at: string;
  set_by: string | null;
};

export type FamilyManager = {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export type CurrentStatusJoined = BabyStatusCurrent & { status_definitions: StatusDefinition };

// Supabase returns one-to-one relations as object (not array) when the FK has UNIQUE constraint
export type BabyWithStatus = Baby & {
  baby_status_current: CurrentStatusJoined | CurrentStatusJoined[] | null;
};

export function resolveCurrentStatus(
  raw: CurrentStatusJoined | CurrentStatusJoined[] | null | undefined
): CurrentStatusJoined | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export type FamilyWithBabies = Family & {
  babies: BabyWithStatus[];
};
