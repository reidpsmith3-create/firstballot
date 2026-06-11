"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getHighSchoolDecisions,
  simulateHighSchoolSeason,
  getNextHighSchoolState,
  getHighSchoolSeasonLabel,
  getDraftProjectionFromSeason,
  type Career,
  type Ratings,
} from "@/lib/sim/highSchool";

export default function CareerMonthPage() {
  const params = useParams();
  const router = useRouter();

  const careerId = params.careerId as string;

  const [career, setCareer] = useState<Career | null>(null);
  const [ratings, setRatings] = useState<Ratings | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState("balanced");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");

  const seasonLabel = career
  ? getHighSchoolSeasonLabel(career.current_month)
  : "Freshman Season";

const seasonDecisions = useMemo(() => {
  return getHighSchoolDecisions(seasonLabel);
}, [seasonLabel]);

const selectedDecision = useMemo(() => {
  return (
    seasonDecisions.find((decision) => decision.id === selectedDecisionId) ??
    seasonDecisions[0]
  );
}, [seasonDecisions, selectedDecisionId]);

  useEffect(() => {
    async function loadCareer() {
      setLoading(true);
      setError("");

      const { data: careerData, error: careerError } = await supabase
        .from("careers")
        .select("*")
        .eq("id", careerId)
        .single();

      if (careerError) {
        setError(careerError.message);
        setLoading(false);
        return;
      }

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("career_ratings")
        .select("*")
        .eq("career_id", careerId)
        .single();

      if (ratingsError) {
        setError(ratingsError.message);
        setLoading(false);
        return;
      }

      setCareer(careerData);
      setRatings(ratingsData);
      setLoading(false);
    }

    loadCareer();
  }, [careerId]);
useEffect(() => {
  setSelectedDecisionId(seasonDecisions[0]?.id ?? "balanced");
}, [seasonDecisions]);
  async function simulate() {
    if (!career || !ratings) return;

    if (career.career_stage !== "high_school") {
      router.push(`/careers/${career.id}`);
      return;
    }

    setSimulating(true);
    setError("");

    const result = simulateHighSchoolSeason({
      career,
      ratings,
      decision: selectedDecision,
    });

    const nextState = getNextHighSchoolState(career.current_month);
    const draftProjection = getDraftProjectionFromSeason({
  avg: result.avg,
  homeRuns: result.homeRuns,
  stolenBases: result.stolenBases,
  war: result.war,
  season: result.season,
});

    const nextAge = (career.current_age ?? 14) + 1;
    const nextYear = (career.current_year ?? 2026) + 1;

    const updatedRatings = {
      contact: clampRating(ratings.contact + result.ratingChanges.contact),
      power: clampRating(ratings.power + result.ratingChanges.power),
      speed: clampRating(ratings.speed + result.ratingChanges.speed),
      glove: clampRating(ratings.glove + result.ratingChanges.glove),
      arm: clampRating(ratings.arm + result.ratingChanges.arm),
    };

    const { error: monthError } = await supabase.from("career_months").insert({
      career_id: career.id,
      year: career.current_year,
      month: result.season,
      age: career.current_age,
      level: career.current_level,
      decision_type: "high_school_development",
      decision_choice: selectedDecision.title,
      monthly_summary: result.monthlySummary,
      scouting_report: result.scoutingReport,
      special_event: result.draftStock,

      games: result.games,
      avg: result.avg,
      hits: result.hits,
      home_runs: result.homeRuns,
      rbi: result.rbi,
      runs: result.runs,
      stolen_bases: result.stolenBases,
      war: result.war,

      rating_changes: result.ratingChanges,
      injury_status: "Healthy",
    });

    if (monthError) {
      setError(monthError.message);
      setSimulating(false);
      return;
    }

    const { error: eventError } = await supabase.from("career_events").insert({
      career_id: career.id,
      year: career.current_year,
      month: result.season,
      age: career.current_age,
      event_type: "high_school_season",
      title: result.eventTitle,
      description: result.eventDescription,
      importance: nextState.isFinishedHighSchool ? "major" : "minor",
    });

    if (eventError) {
      setError(eventError.message);
      setSimulating(false);
      return;
    }

    const { error: ratingsUpdateError } = await supabase
      .from("career_ratings")
      .update(updatedRatings)
      .eq("career_id", career.id);

    if (ratingsUpdateError) {
      setError(ratingsUpdateError.message);
      setSimulating(false);
      return;
    }

    const { error: careerUpdateError } = await supabase
      .from("careers")
      .update({
        current_age: nextAge,
        current_year: nextYear,
        current_month: nextState.nextMonth,
        career_stage: nextState.nextStage,
        current_level: nextState.nextLevel,
        draft_projection_round: draftProjection.round,
draft_projection_pick: draftProjection.pick,
        updated_at: new Date().toISOString(),
      })
      .eq("id", career.id);

    if (careerUpdateError) {
      setError(careerUpdateError.message);
      setSimulating(false);
      return;
    }

    router.push(`/careers/${career.id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p className="text-zinc-400">Loading decision...</p>
      </main>
    );
  }

  if (!career || !ratings) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p>Career not found.</p>
      </main>
    );
  }

  if (career.career_stage === "draft") {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href={`/careers/${career.id}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Career
        </Link>

        <div className="mt-6 rounded-3xl border border-yellow-400/40 bg-zinc-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Next Chapter
          </p>

          <h1 className="mt-3 text-3xl font-black">Draft Day Awaits</h1>

          <p className="mt-3 text-zinc-400">
            Your high school career is complete. See where the baseball world
            sends you next.
          </p>

          <Link
            href={`/careers/${career.id}/draft`}
            className="mt-6 block w-full rounded-2xl bg-yellow-400 px-5 py-4 text-center text-lg font-black text-zinc-950 hover:bg-yellow-300"
          >
            Enter Draft
          </Link>
        </div>
      </div>
    </main>
  );
}

if (career.career_stage !== "high_school") {
  router.push(`/careers/${career.id}`);
  return null;
}

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href={`/careers/${career.id}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Career
        </Link>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Decision
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {career.current_month || "Freshman Season"}
          </h1>

          <p className="mt-3 text-zinc-400">
            Choose how {career.full_name} approaches this season.
          </p>

          <div className="mt-6 space-y-3">
            {seasonDecisions.map((decision) => {
              const selected = selectedDecisionId === decision.id;

              return (
                <button
                  key={decision.id}
                  onClick={() => setSelectedDecisionId(decision.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                      : "border-zinc-800 bg-zinc-950 text-white hover:border-zinc-600"
                  }`}
                >
                  <p className="font-black">{decision.title}</p>
                  <p
                    className={`mt-1 text-sm ${
                      selected ? "text-zinc-800" : "text-zinc-400"
                    }`}
                  >
                    {decision.description}
                  </p>
                </button>
              );
            })}
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={simulate}
            disabled={simulating}
            className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
          >
            {simulating ? "Simulating..." : "Play Season"}
          </button>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-black">Current Tools</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniRating label="Contact" value={ratings.contact} />
            <MiniRating label="Power" value={ratings.power} />
            <MiniRating label="Speed" value={ratings.speed} />
            <MiniRating label="Glove" value={ratings.glove} />
            <MiniRating label="Arm" value={ratings.arm} />
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function clampRating(value: number) {
  return Math.max(20, Math.min(80, value));
}