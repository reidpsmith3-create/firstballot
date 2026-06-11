"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewCareerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const worldId = searchParams.get("worldId");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("SS");
  const [bats, setBats] = useState("R");
  const [throwsHand, setThrowsHand] = useState("R");
  const [hometown, setHometown] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createCareer() {
    if (!worldId) {
      setError("Missing world.");
      return;
    }

    if (!firstName || !lastName) {
      setError("Enter a name.");
      return;
    }

    setCreating(true);
    setError("");

    const fullName = `${firstName} ${lastName}`;

    const { data: career, error: careerError } = await supabase
      .from("careers")
      .insert({
        world_id: worldId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        hometown,
        bats,
        throws: throwsHand,
        primary_position: position,
        career_path: "high_school",
        current_age: 14,
        current_year: 2026,
        current_level: "HS",
        career_stage: "high_school",
        status: "active",
      })
      .select()
      .single();

    if (careerError) {
      setError(careerError.message);
      setCreating(false);
      return;
    }

    const { error: ratingsError } = await supabase
      .from("career_ratings")
      .insert({
        career_id: career.id,

        contact: randomRating(),
        power: randomRating(),
        speed: randomRating(),
        glove: randomRating(),
        arm: randomRating(),

        velocity: randomRating(),
        command: randomRating(),
        movement: randomRating(),
        stamina: randomRating(),
      });

    if (ratingsError) {
      setError(ratingsError.message);
      setCreating(false);
      return;
    }

    router.push(`/careers/${career.id}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Create Career</h1>

        <p className="mt-3 text-zinc-400">
          Build your future Hall of Famer.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">Hometown</label>
            <input
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              placeholder="St. Louis, MO"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-bold">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              >
                <option>C</option>
                <option>1B</option>
                <option>2B</option>
                <option>3B</option>
                <option>SS</option>
                <option>LF</option>
                <option>CF</option>
                <option>RF</option>
                <option>SP</option>
                <option>RP</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Bats</label>
              <select
                value={bats}
                onChange={(e) => setBats(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              >
                <option>R</option>
                <option>L</option>
                <option>S</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold">Throws</label>
              <select
                value={throwsHand}
                onChange={(e) => setThrowsHand(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              >
                <option>R</option>
                <option>L</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={createCareer}
            disabled={creating}
            className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Start Career"}
          </button>
        </div>
      </div>
    </main>
  );
}

function randomRating() {
  return Math.floor(Math.random() * 21) + 40;
}