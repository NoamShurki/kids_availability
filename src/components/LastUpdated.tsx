"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  updatedAt: string;
}

export function LastUpdated({ updatedAt }: Props) {
  const [label, setLabel] = useState(() => formatRelativeTime(updatedAt));

  useEffect(() => {
    setLabel(formatRelativeTime(updatedAt));
    const id = setInterval(() => setLabel(formatRelativeTime(updatedAt)), 30000);
    return () => clearInterval(id);
  }, [updatedAt]);

  return (
    <p className="text-sm text-gray-500 mt-1">
      Updated {label}
    </p>
  );
}
