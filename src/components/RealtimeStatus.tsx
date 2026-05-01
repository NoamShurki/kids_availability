"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BabyStatusCurrent, StatusDefinition } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { LastUpdated } from "./LastUpdated";

interface CurrentStatusPayload {
  status: BabyStatusCurrent & { status_definitions: StatusDefinition };
}

interface Props extends CurrentStatusPayload {
  babyId: string;
}

export function RealtimeStatus({ babyId, status: initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`baby-status-${babyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "baby_status_current",
          filter: `baby_id=eq.${babyId}`,
        },
        async (_payload) => {
          // Fetch the joined status_definitions row since realtime only gives us raw columns
          const { data } = await supabase
            .from("baby_status_current")
            .select("*, status_definitions(*)")
            .eq("baby_id", babyId)
            .single();

          if (data) {
            setStatus(data as typeof initialStatus);
            setFlash(true);
            setTimeout(() => setFlash(false), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [babyId]);

  return (
    <div
      className={`transition-opacity duration-500 ${flash ? "opacity-60" : "opacity-100"}`}
    >
      <StatusBadge status={status.status_definitions} size="lg" />
      {status.note && (
        <p className="mt-3 text-gray-600 text-lg italic">&ldquo;{status.note}&rdquo;</p>
      )}
      <LastUpdated updatedAt={status.updated_at} />
    </div>
  );
}
