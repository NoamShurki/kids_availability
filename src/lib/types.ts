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

// Joined shape returned by the public status page query
export type BabyWithStatus = Baby & {
  baby_status_current: Array<
    BabyStatusCurrent & { status_definitions: StatusDefinition }
  >;
};

export type FamilyWithBabies = Family & {
  babies: BabyWithStatus[];
};
