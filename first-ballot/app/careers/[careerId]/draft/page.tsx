"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  generateDraftResult,
  getSigningOptions,
  type DraftCareer,
  type DraftMonth,
  type Team,
} from "@/lib/sim/draft";

type DraftResult = ReturnType<typeof generateDraftResult>;

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const careerId = params.careerId as string;

  const [career, setCareer] = useState<DraftCareer | null>(null);
  const [months, setMonths] = useState<DraftMonth[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [selectedChoice, setSelectedChoice] = useState("sign");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const signingOptions = useMemo(() => {
    if (!draftResult) return [];
    return getSigningOptions({
      round: draftResult.draftRound,
      bonus: draftResult.signedBonus,
    });
  }, [draftResult]);

  useEffect(() => {
    async function loadDraft() {
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

      const { data: monthsData, error: monthsError } = await supabase
        .from("career_months")
        .select("avg, home_runs, stolen_bases, war")
        .eq("career_id", careerId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (monthsError) {
        setError(monthsError.message);
        setLoading(false);
        return;
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, city, abbreviation, development, fame, playing_time");

      if (teamsError) {
        setError(teamsError.message);
        setLoading(false);
        return;
      }

      const result = generateDraftResult({
        career: careerData,
        months: monthsData ?? [],
        teams: teamsData ?? [],
      });

      setCareer(careerData);
      setMonths(monthsData ?? []);
      setTeams(teamsData ?? []);
      setDraftResult(result);
      setLoading(false);
    }

    loadDraft();
  }, [careerId]);

  async function submitDecision() {
    if (!career || !draftResult) return;

    setSaving(true);
    setError("");

    if (selectedChoice === "college") {
      const { error: updateError } = await supabase
        .from("careers")
        .update({
          career_stage: "college",
          career_path: "college",
          current_level: "NCAA",
          current_month: "Freshman Season",
          current_age: career.current_age + 1,
          current_year: career.current_year + 1,
          draft_year: draftResult.draftYear,
          draft_round: draftResult.draftRound,
          draft_pick: draftResult.draftPick,
          draft_team_id: draftResult.draftTeam?.id ?? null,
          draft_status: "unsigned_college",
          signed_bonus: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", career.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      await supabase.from("career_events").insert({
        career_id: career.id,
        year: career.current_year,
        month: "Draft Day",
        age: career.current_age,
        event_type: "draft",
        title: "Turned Down Pro Ball",
        description: `${career.full_name} was drafted but chose college instead.`,
        importance: "major",
      });

      router.push(`/careers/${career.id}/college-offers`);
return;
    }

    const { error: updateError } = await supabase
      .from("careers")
      .update({
        career_stage: "minor_leagues",
        current_level: "Rookie",
        current_month: "April",
        draft_year: draftResult.draftYear,
        draft_round: draftResult.draftRound,
        draft_pick: draftResult.draftPick,
        draft_team_id: draftResult.draftTeam?.id ?? null,
        current_team_id: draftResult.draftTeam?.id ?? null,
        draft_status: "signed",
        signed_bonus: draftResult.signedBonus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", career.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await supabase.from("career_events").insert({
      career_id: career.id,
      year: career.current_year,
      month: "Draft Day",
      age: career.current_age,
      event_type: "draft",
      title: "Drafted and Signed",
      description: `${draftResult.summary} He signed for $${draftResult.signedBonus.toLocaleString()} and will report to Rookie ball.`,
      importance: "major",
    });

    router.push(`/careers/${career.id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p className="text-zinc-400">Loading draft...</p>
      </main>
    );
  }

  if (!career || !draftResult) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p>Draft not available.</p>
      </main>
    );
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

        <section className="mt-6 rounded-3xl border border-yellow-400/40 bg-zinc-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Draft Day
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Round {draftResult.draftRound}
          </h1>

          <p className="mt-2 text-xl font-bold text-zinc-200">
            Pick {draftResult.draftPick}
          </p>

          <p className="mt-4 text-zinc-400">{draftResult.summary}</p>

          <div className="mt-5 rounded-2xl bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Signing Bonus
            </p>
            <p className="mt-1 text-3xl font-black text-yellow-400">
              ${draftResult.signedBonus.toLocaleString()}
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Draft Buzz
            </p>
            <p className="mt-1 font-bold">{draftResult.buzz}</p>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-black">Decision</h2>

          <div className="mt-4 space-y-3">
            {signingOptions.map((option) => {
              const selected = selectedChoice === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedChoice(option.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                      : "border-zinc-800 bg-zinc-950 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{option.title}</p>
                    {option.recommended ? (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-black ${
                          selected
                            ? "bg-zinc-950 text-yellow-400"
                            : "bg-yellow-400 text-zinc-950"
                        }`}
                      >
                        Rec
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={`mt-1 text-sm ${
                      selected ? "text-zinc-800" : "text-zinc-400"
                    }`}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={submitDecision}
            disabled={saving}
            className="mt-5 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm Decision"}
          </button>
        </section>
      </div>
    </main>
  );
}