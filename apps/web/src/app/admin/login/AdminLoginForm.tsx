"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Password is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: trimmedPassword }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Invalid credentials" }));
        setError(payload.error || "Invalid credentials");
        return;
      }

      startTransition(() => {
        router.replace("/admin/rooms");
      });
    } catch (err) {
      console.error("Admin login failed:", err);
      setError("Unable to reach authentication service");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900/70 p-6 shadow-lg">
      <div>
        <h1 className="text-xl font-semibold text-white">Admin Dashboard Access</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the administrator password to access game room controls.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        <span>Password</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
          autoComplete="current-password"
          required
        />
      </label>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
