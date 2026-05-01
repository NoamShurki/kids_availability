"use client";

import { useEffect, useState } from "react";

interface Props {
  babyId: string;
}

export function SuggestionBanner({ babyId }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `dismissed-suggestion-${babyId}`;
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }

    fetch(`/api/suggestions?babyId=${babyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.suggestion) setSuggestion(data.suggestion);
      })
      .catch(() => {});
  }, [babyId]);

  if (!suggestion || dismissed) return null;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-blue-800">
      <span className="text-xl" role="img" aria-label="hint">💡</span>
      <p className="flex-1 text-sm leading-relaxed">{suggestion}</p>
      <button
        onClick={() => {
          sessionStorage.setItem(`dismissed-suggestion-${babyId}`, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss"
        className="text-blue-400 hover:text-blue-600 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
