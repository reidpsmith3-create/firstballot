import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CareerBottomNav from "@/components/CareerBottomNav";

type PageProps = {
  params: Promise<{
    careerId: string;
  }>;
};

export default async function CollegeRecapPage({ params }: PageProps) {
  const { careerId } = await params;

  const { data: career } = await supabase
    .from("careers")
    .select("id, full_name, world_id, career_stage")
    .eq("id", careerId)
    .single();

  const { data: season } = await supabase
    .from("career_months")
    .select("*, schools(name, conference)")
    .eq("career_id", careerId)
    .eq("level", "NCAA")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!career || !season) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p>College recap not found.</p>
        <Link href={`/careers/${careerId}`} className="text-yellow-400">
          Back to career
        </Link>
      </main>
    );
  }

  const awards = Array.isArray(season.awards) ? season.awards : [];

  return (
    <main className="min-h-screen bg-zinc-950 px-5 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
          Season Recap
        </p>

        <h1 className="mt-3 text-4xl font-black">
          {season.year} {season.month}
        </h1>

        <p className="mt-2 text-zinc-400">
          {season.schools?.name ?? "College"} ·{" "}
          {season.schools?.conference ?? "NCAA"}
        </p>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Team Result</h2>

          <div className="mt-4 rounded-2xl bg-zinc-950 p-5">
            <p className="text-sm text-zinc-400">Postseason</p>
            <p className="mt-2 text-2xl font-black text-yellow-400">
              {season.postseason_result ?? season.special_event ?? "Unknown"}
            </p>
          </div>

          {season.team_record ? (
            <div className="mt-3 rounded-2xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Team Record</p>
              <p className="mt-2 text-2xl font-black">{season.team_record}</p>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Draft Stock</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat
              label="Projection"
              value={season.hall_track_after ?? "Unknown"}
            />
            <Stat
              label="Projected Pick"
              value={
                season.hall_score_after
                  ? `Pick ${Math.round(season.hall_score_after)}`
                  : "-"
              }
            />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Your Season</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="AVG" value={season.avg ? season.avg.toFixed(3) : "-"} />
            <Stat label="HR" value={season.home_runs ?? 0} />
            <Stat label="RBI" value={season.rbi ?? 0} />
            <Stat label="SB" value={season.stolen_bases ?? 0} />
            <Stat label="Hits" value={season.hits ?? 0} />
            <Stat label="WAR" value={season.war ?? 0} />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Scouting Report</h2>
          <p className="mt-3 text-zinc-300">{season.scouting_report}</p>

          {awards.length > 0 ? (
            <div className="mt-5">
              <h3 className="font-black">Awards</h3>
              <div className="mt-3 space-y-2">
                {awards.map((award: string) => (
                  <div
                    key={award}
                    className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300"
                  >
                    {award}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No major awards.</p>
          )}
        </section>

        <Link
          href={`/careers/${career.id}`}
          className="mt-5 block w-full rounded-2xl bg-yellow-400 px-5 py-4 text-center text-lg font-black text-zinc-950 hover:bg-yellow-300"
        >
          Continue Career
        </Link>
      </div>

      <CareerBottomNav
        careerId={career.id}
        worldId={career.world_id}
        active="career"
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}