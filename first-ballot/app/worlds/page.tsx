"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type World = {
  id: string;
  name: string;
  created_at: string;
};

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [worldName, setWorldName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadWorlds() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("worlds")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWorlds(data ?? []);
    }

    setLoading(false);
  }

  async function createWorld() {
    if (!worldName.trim()) return;

    setCreating(true);
    setError("");

    const { error } = await supabase.from("worlds").insert({
      name: worldName.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setWorldName("");
      await loadWorlds();
    }

    setCreating(false);
  }

  useEffect(() => {
    loadWorlds();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Home
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
              World Saves
            </p>
            <h1 className="mt-3 text-4xl font-black">Choose a universe</h1>
            <p className="mt-3 text-zinc-400">
              Each world keeps its own careers, Hall of Fame, and record book.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <label className="text-sm font-bold text-zinc-300">
              New World
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="World name"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-yellow-400"
              />
              <button
                onClick={createWorld}
                disabled={creating}
                className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4">
          {loading ? (
            <p className="text-zinc-400">Loading worlds...</p>
          ) : worlds.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <h2 className="text-2xl font-black">No worlds yet</h2>
              <p className="mt-2 text-zinc-400">
                Create your first world to begin a career.
              </p>
            </div>
          ) : (
            worlds.map((world) => (
              <Link
                key={world.id}
                href={`/worlds/${world.id}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-400"
              >
                <h2 className="text-2xl font-black">{world.name}</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Created {new Date(world.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}