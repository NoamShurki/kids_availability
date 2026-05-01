"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/manage";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">📬</p>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-gray-500">
          We sent a magic link to <strong>{email}</strong>.<br />
          Click it to log in.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-4xl">🔑</p>
        <h1 className="text-2xl font-bold">Parent Login</h1>
        <p className="text-gray-500 text-sm">For parents only — relatives don&apos;t need to log in.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending…" : "Send Magic Link"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
