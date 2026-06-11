"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  simulateCollegeSeason,
  getNextCollegeState,
  getCollegeDraftProjection,
  type School,
} from "@/lib/sim/college";

type Career = {
  id: string;
  full_name: string;
  current_age: number;
  current_year: number;
  current_month: string | null;
  current_level: string | null;
  career_stage: string;
  current_school_id: string | null;
};

type Ratings = {
  contact: number;
  power: number;
  speed: number;
  glove: number;
  arm: number;
  velocity: number;
  command: number;
  movement: number;
  stamina: number;
};

export default function CollegeSeasonPage() {
  const params = useParams();
  const router = useRouter();
  const careerId = params.careerId as string;

  const [career, setCareer] = useState<Career | null>(null);
  const [ratings, setRatings] = useState<Ratings | null>(null);
  const [school, setSchool] = useState<School | null>(null);
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

      let schoolData: School | null = null;

      if (careerData.current_school_id) {
        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .eq("id", careerData.current_school_id)
          .single();

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        schoolData = data;
      }

      setCareer(careerData);
      setRatings(ratingsData);
      setSchool(schoolData);
      setLoading(false);
    }

    load();
  }, [careerId]);

  async function simulate() {
    if (!career || !ratings || !school) return;

    setSimulating(true);
    setError("");

    const focusMods = getFocusMods(focus);

    const result = simulateCollegeSeason({
      playerName: career.full_name,
      seasonLabel: career.current_month ?? "Freshman Season",
      school,
      contact: ratings.contact + focusMods.contact,
      power: ratings.power + focusMods.power,
      speed: ratings.speed + focusMods.speed,
      glove: ratings.glove + focusMods.glove,
    });

    const nextState = getNextCollegeState(career.current_month);
    const draftProjection = getCollegeDraftProjection({
  seasonLabel: career.current_month ?? "Freshman Season",
  avg: result.avg,
  homeRuns: result.homeRuns,
  stolenBases: result.stolenBases,
  war: result.war,
  awards: result.awards,
  postseason: result.postseason,
});

    const updatedRatings = {
      contact: clampRating(ratings.contact + result.ratingChanges.contact + focusMods.contactGrowth),
      power: clampRating(ratings.power + result.ratingChanges.power + focusMods.powerGrowth),
      speed: clampRating(ratings.speed + result.ratingChanges.speed + focusMods.speedGrowth),
      glove: clampRating(ratings.glove + result.ratingChanges.glove + focusMods.gloveGrowth),
      arm: clampRating(ratings.arm + result.ratingChanges.arm),
    };

    const { error: seasonError } = await supabase.from("career_months").insert({
      career_id: career.id,
      year: career.current_year,
      month: career.current_month ?? "Freshman Season",
      age: career.current_age,
      level: "NCAA",
      school_id: school.id,

      decision_type: "college_focus",
      decision_choice: focus,

      monthly_summary: result.summary,
      scouting_report: result.scoutingReport,
      special_event: result.postseason,

      games: result.games,
      avg: result.avg,
      hits: result.hits,
      home_runs: result.homeRuns,
      rbi: result.rbi,
      runs: result.runs,
      stolen_bases: result.stolenBases,
      war: result.war,

      awards: result.awards,
      postseason_result: result.postseason,
      team_record: generateCollegeTeamRecord(result.postseason),
      hall_track_after: `Projected ${draftProjection.label}`,
hall_score_after: draftProjection.pick,
      rating_changes: {
        ...result.ratingChanges,
        focus,
      },
      injury_status: "Healthy",
    });

    if (seasonError) {
      setError(seasonError.message);
      setSimulating(false);
      return;
    }

    const eventDescription =
      result.awards.length > 0
        ? `${result.summary} Honors: ${result.awards.join(", ")}.`
        : result.summary;

    await supabase.from("career_events").insert({
      career_id: career.id,
      year: career.current_year,
      month: career.current_month ?? "College Season",
      age: career.current_age,
      event_type: "college_season",
      title: `${career.current_month ?? "College Season"} Complete`,
      description: eventDescription,
      importance:
        result.postseason === "College World Series" ||
        result.awards.includes("All-American")
          ? "major"
          : "minor",
    });

    if (result.postseason === "College World Series") {
      await supabase.from("career_events").insert({
        career_id: career.id,
        year: career.current_year,
        month: "June",
        age: career.current_age,
        event_type: "college_world_series",
        title: "Reached the College World Series",
        description: `${career.full_name} helped lead ${school.name} to the College World Series.`,
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

    const nextCareerStage = nextState.draftEligible ? "draft" : "college";

    const { error: careerError } = await supabase
      .from("careers")
      .update({
        current_age: career.current_age + nextState.nextAgeAdd,
        current_year: career.current_year + 1,
        current_month: nextState.nextMonth,
        career_stage: nextCareerStage,
        current_level: nextState.draftEligible ? "Draft Eligible" : "NCAA",
        draft_projection_round: draftProjection.round,
draft_projection_pick: draftProjection.pick,
prospect_trend: draftProjection.trend,
        updated_at: new Date().toISOString(),
      })
      .eq("id", career.id);

    if (careerError) {
      setError(careerError.message);
      setSimulating(false);
      return;
    }

    router.push(`/careers/${career.id}/college/recap`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p className="text-zinc-400">Loading college season...</p>
      </main>
    );
  }

  if (!career || !ratings || !school) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p>College season unavailable.</p>
      </main>
    );
  }

  if (career.career_stage !== "college") {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <div className="mx-auto max-w-md">
          <Link href={`/careers/${career.id}`} className="text-sm text-zinc-400">
            ← Career
          </Link>

          <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h1 className="text-3xl font-black">Not in College</h1>
            <p className="mt-3 text-zinc-400">
              This player is not currently in the college stage.
            </p>
          </div>
        </div>
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
            College Season
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {career.current_month ?? "Freshman Season"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {school.name} · {school.conference ?? "Independent"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Info label="Prestige" value={school.prestige ?? 50} />
            <Info label="Development" value={school.development ?? 50} />
            <Info label="Playing Time" value={school.playing_time ?? 50} />
            <Info label="Competition" value={school.competition ?? 50} />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-black">Season Focus</h2>

          <div className="mt-4 space-y-3">
            <FocusButton
              id="balanced"
              selected={focus}
              setSelected={setFocus}
              title="Balanced Season"
              description="Stay rounded and let production drive draft stock."
            />
            <FocusButton
              id="draft_stock"
              selected={focus}
              setSelected={setFocus}
              title="Chase Draft Stock"
              description="Prioritize loud offensive numbers and national attention."
            />
            <FocusButton
              id="development"
              selected={focus}
              setSelected={setFocus}
              title="Development Year"
              description="Focus on long-term tools, even if the stat line is less flashy."
            />
            <FocusButton
              id="team_success"
              selected={focus}
              setSelected={setFocus}
              title="Win First"
              description="Lean into defense, consistency, and helping the team make a run."
            />
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
      </div>
    </main>
  );
}

function FocusButton({
  id,
  selected,
  setSelected,
  title,
  description,
}: {
  id: string;
  selected: string;
  setSelected: (id: string) => void;
  title: string;
  description: string;
}) {
  const isSelected = selected === id;

  return (
    <button
      onClick={() => setSelected(id)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        isSelected
          ? "border-yellow-400 bg-yellow-400 text-zinc-950"
          : "border-zinc-800 bg-zinc-950 text-white"
      }`}
    >
      <p className="font-black">{title}</p>
      <p className={isSelected ? "mt-1 text-sm text-zinc-800" : "mt-1 text-sm text-zinc-400"}>
        {description}
      </p>
    </button>
  );
}

function Info({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function getFocusMods(focus: string) {
  if (focus === "draft_stock") {
    return {
      contact: 3,
      power: 4,
      speed: 0,
      glove: -1,
      contactGrowth: 1,
      powerGrowth: 1,
      speedGrowth: 0,
      gloveGrowth: 0,
    };
  }

  if (focus === "development") {
    return {
      contact: -1,
      power: -1,
      speed: 0,
      glove: 0,
      contactGrowth: 2,
      powerGrowth: 2,
      speedGrowth: 1,
      gloveGrowth: 1,
    };
  }

  if (focus === "team_success") {
    return {
      contact: 1,
      power: 0,
      speed: 1,
      glove: 4,
      contactGrowth: 0,
      powerGrowth: 0,
      speedGrowth: 1,
      gloveGrowth: 2,
    };
  }

  return {
    contact: 1,
    power: 1,
    speed: 1,
    glove: 1,
    contactGrowth: 1,
    powerGrowth: 1,
    speedGrowth: 1,
    gloveGrowth: 1,
  };
}

function clampRating(value: number) {
  return Math.max(20, Math.min(80, value));
  
}
function generateCollegeTeamRecord(postseason: string) {
  if (postseason === "National Champions") return "56-12";
  if (postseason === "College World Series") return "49-18";
  if (postseason === "Super Regionals") return "44-20";
  if (postseason === "Regionals") return "38-22";
  if (postseason === "Conference Tournament") return "32-24";
  return "25-28";
}