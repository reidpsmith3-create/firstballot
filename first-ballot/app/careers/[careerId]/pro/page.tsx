"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateProspectStatus } from "@/lib/sim/prospect";
import {
  proDevelopmentOptions,
  simulateProMonth,
  getNextProCalendar,
  shouldRetire,
  type ProCareer,
  type ProRatings,
} from "@/lib/sim/pro";

export default function ProMonthPage() {
  const params = useParams();
  const router = useRouter();
  const careerId = params.careerId as string;

  const [career, setCareer] = useState<ProCareer | null>(null);
  const [ratings, setRatings] = useState<ProRatings | null>(null);
  const [focus, setFocus] = useState("balanced");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
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

    load();
  }, [careerId]);

  async function simulate() {
    if (!career || !ratings) return;

    setSimulating(true);
    setError("");

    const result = simulateProMonth({
      career,
      ratings,
      focus,
    });

    const nextCalendar = getNextProCalendar(
      career.current_month,
      career.current_year
    );

    const promoted = result.promotion.promoted;
    const nextLevel = promoted ? result.promotion.nextLevel : career.current_level;

    const isMlbDebut =
      promoted && result.promotion.nextLevel === "MLB" && !career.mlb_debut_year;

    const nextCareerStage = nextLevel === "MLB" ? "mlb" : "minor_leagues";

    const nextAge = nextCalendar.seasonEnded
      ? career.current_age + 1
      : career.current_age;

    const nextHallScore = Number(
      ((career.hall_score ?? 0) + result.hallScoreGain).toFixed(1)
    );

    const retirementCheck = shouldRetire({
      age: nextAge,
      level: nextLevel,
      hallScore: nextHallScore,
    });

    const updatedRatings = {
      contact: clampRating(ratings.contact + result.ratingChanges.contact),
      power: clampRating(ratings.power + result.ratingChanges.power),
      speed: clampRating(ratings.speed + result.ratingChanges.speed),
      glove: clampRating(ratings.glove + result.ratingChanges.glove),
      arm: clampRating(ratings.arm + result.ratingChanges.arm),
    };
    const prospectStatus = calculateProspectStatus({
  career: {
    id: career.id,
    world_id: (career as any).world_id,
    current_age: nextAge,
    current_level: nextLevel,
    draft_round: (career as any).draft_round,
    draft_pick: (career as any).draft_pick,
  },
  ratings: {
    contact: updatedRatings.contact,
    power: updatedRatings.power,
    speed: updatedRatings.speed,
    glove: updatedRatings.glove,
    arm: updatedRatings.arm,
  },
  recentProduction: {
    avg: result.avg,
    home_runs: result.homeRuns,
    stolen_bases: result.stolenBases,
    war: result.war,
  },
});

    const { error: monthError } = await supabase.from("career_months").insert({
      career_id: career.id,
      year: career.current_year,
      month: career.current_month ?? "April",
      age: career.current_age,
      level: career.current_level,
      team_id: career.current_team_id,

      decision_type: "pro_development",
      decision_choice: focus,

      monthly_summary: result.summary,
      scouting_report: result.scoutingReport,
      special_event: promoted ? `Promoted to ${result.promotion.nextLevel}` : null,

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
      hall_score_after: nextHallScore,
      hall_track_after: nextLevel === "MLB" ? getHallTrack(nextHallScore) : null,
    });

    if (monthError) {
      setError(monthError.message);
      setSimulating(false);
      return;
    }

    if (promoted) {
      await supabase.from("career_events").insert({
        career_id: career.id,
        year: career.current_year,
        month: career.current_month ?? "April",
        age: career.current_age,
        event_type: isMlbDebut ? "mlb_debut" : "promotion",
        title: isMlbDebut ? "MLB Debut" : `Promoted to ${result.promotion.nextLevel}`,
        description: isMlbDebut
          ? `${career.full_name} reached the majors for the first time. Hall Score is now visible.`
          : `${career.full_name} was promoted to ${result.promotion.nextLevel}.`,
        importance: isMlbDebut ? "milestone" : "major",
      });
    }

    if (nextCalendar.seasonEnded) {
      await supabase.from("career_events").insert({
        career_id: career.id,
        year: career.current_year,
        month: "October",
        age: career.current_age,
        event_type: "season_complete",
        title: `${career.current_year} Season Complete`,
        description: `${career.full_name} finished the ${career.current_year} season at ${nextLevel}.`,
        importance: "minor",
      });
    }

    if (retirementCheck) {
      await supabase.from("career_events").insert({
        career_id: career.id,
        year: career.current_year,
        month: career.current_month ?? "October",
        age: nextAge,
        event_type: "retirement",
        title: "Retirement",
        description: `${career.full_name} retired from professional baseball.`,
        importance: "major",
      });
    }

    const { error: ratingsError } = await supabase
      .from("career_ratings")
      .update(updatedRatings)
      .eq("career_id", career.id);

    if (ratingsError) {
      setError(ratingsError.message);
      setSimulating(false);
      return;
    }

    const { error: careerError } = await supabase
      .from("careers")
      .update({
        current_age: nextAge,
        current_year: nextCalendar.nextYear,
        current_month: nextCalendar.nextMonth,
        career_stage: retirementCheck ? "retired" : nextCareerStage,
        status: retirementCheck ? "retired" : "active",
        current_level: retirementCheck ? "Retired" : nextLevel,
        prospect_score: prospectStatus.prospectScore,
organization_prospect_rank: prospectStatus.organizationRank,
overall_prospect_rank: prospectStatus.overallRank,
prospect_trend: prospectStatus.trend,
        mlb_debut_year: isMlbDebut
          ? career.current_year
          : career.mlb_debut_year,
        mlb_service_years:
          nextLevel === "MLB" && nextCalendar.seasonEnded ? 1 : undefined,
        hall_score: nextHallScore,
        hall_track: nextLevel === "MLB" ? getHallTrack(nextHallScore) : null,
        hall_eligible: retirementCheck && nextHallScore >= 30,
        updated_at: new Date().toISOString(),
      })
      .eq("id", career.id);

    if (careerError) {
  setError(careerError.message);
  setSimulating(false);
  return;
}

await supabase.from("prospect_rankings").insert({
  world_id: (career as any).world_id,
  career_id: career.id,
  year: career.current_year,
  organization_rank: prospectStatus.organizationRank,
  overall_rank: prospectStatus.overallRank,
  prospect_score: prospectStatus.prospectScore,
});

if (
  prospectStatus.overallRank &&
  (!career.overall_prospect_rank ||
    prospectStatus.overallRank < (career as any).overall_prospect_rank)
) {
  await supabase.from("career_events").insert({
    career_id: career.id,
    year: career.current_year,
    month: career.current_month ?? "April",
    age: career.current_age,
    event_type: "prospect_ranking",
    title: "Top 100 Prospect",
    description: `${career.full_name} climbed to #${prospectStatus.overallRank} on the MLB Top 100 prospects list.`,
    importance: "major",
  });
}

router.push(`/careers/${career.id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p className="text-zinc-400">Loading pro month...</p>
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
            Pro Ball
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {career.current_month ?? "April"} {career.current_year}
          </h1>

          <p className="mt-3 text-zinc-400">
            {career.current_level ?? "Rookie"} · Age {career.current_age}
          </p>

          {career.mlb_debut_year ? (
            <div className="mt-5 rounded-2xl bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Hall Score
              </p>
              <p className="mt-1 text-4xl font-black text-yellow-400">
                {career.hall_score ?? 0}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {getHallTrack(career.hall_score ?? 0)}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-400">
                Hall Score unlocks after MLB debut.
              </p>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-black">Monthly Focus</h2>

          <div className="mt-4 space-y-3">
            {proDevelopmentOptions.map((option) => {
              const selected = focus === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setFocus(option.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                      : "border-zinc-800 bg-zinc-950 text-white"
                  }`}
                >
                  <p className="font-black">{option.title}</p>
                  <p
                    className={
                      selected
                        ? "mt-1 text-sm text-zinc-800"
                        : "mt-1 text-sm text-zinc-400"
                    }
                  >
                    {option.description}
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
            {simulating ? "Simulating..." : "Play Month"}
          </button>
        </section>
      </div>
    </main>
  );
}

function getHallTrack(score: number) {
  if (score >= 90) return "Inner-circle Hall pace";
  if (score >= 70) return "Strong Hall of Fame track";
  if (score >= 50) return "Borderline Hall track";
  if (score >= 30) return "Needs longevity and awards";
  return "Too early to project";
}

function clampRating(value: number) {
  return Math.max(20, Math.min(80, value));
}