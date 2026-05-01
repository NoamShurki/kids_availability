"use client";

import { useState } from "react";
import type { StatusDefinition } from "@/lib/types";

interface Props {
  statuses: StatusDefinition[];
  currentStatusId: string;
  babySlug: string;
  onSaved?: () => void;
}

export function StatusPicker({ statuses, currentStatusId, babySlug, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState(currentStatusId);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babySlug, statusDefinitionId: selectedId, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      setSaved(true);
      setNote("");
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {statuses.map((s) => {
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                active
                  ? "border-current shadow-md ring-2 ring-offset-2"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
              style={active ? { borderColor: s.color_hex ?? "#6b7280" } : {}}
            >
              <span className="text-3xl" role="img" aria-hidden="true">{s.emoji}</span>
              <span
                className="font-semibold text-base"
                style={active ? { color: s.color_hex ?? "#6b7280" } : { color: "#374151" }}
              >
                {s.label}
              </span>
              {active && (
                <span className="ml-auto text-sm font-bold" style={{ color: s.color_hex ?? "#6b7280" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Optional note (e.g. &ldquo;rough night, try after 6&rdquo;)
        </label>
        <input
          id="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Add a short note…"
          className="w-full rounded-xl border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || selectedId === currentStatusId && note === ""}
        className="w-full rounded-2xl bg-blue-600 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Update Status"}
      </button>
    </div>
  );
}
