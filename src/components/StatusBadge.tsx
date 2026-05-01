import type { StatusDefinition } from "@/lib/types";

interface Props {
  status: StatusDefinition;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm px-2.5 py-0.5",
  md: "text-base px-3 py-1",
  lg: "text-2xl px-5 py-2",
};

export function StatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: status.color_hex ?? "#6b7280" }}
    >
      {status.emoji && <span role="img" aria-hidden="true">{status.emoji}</span>}
      {status.label}
    </span>
  );
}
