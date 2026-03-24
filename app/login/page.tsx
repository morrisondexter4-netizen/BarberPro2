"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() || "aiden@barberpro.com";
const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD || "BarberPro1!";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (DEMO_MODE) {
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          document.cookie = "bp_demo=1; path=/; max-age=86400";
          router.replace(redirectTo);
        } else {
          setError("Invalid credentials.");
        }
        return;
      }

      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured.");
        return;
      }

      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(redirectTo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">BarberPro</h1>
          <p className="mt-1 text-sm text-gray-400">Staff login</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5
                           text-sm text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent
                           transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5
                           text-sm text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent
                           transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/40 border border-red-700/50 px-3.5 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                         px-4 py-2.5 text-sm font-semibold text-white
                         focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                         focus:ring-offset-gray-900
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
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
