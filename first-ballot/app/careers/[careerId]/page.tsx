import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CareerBottomNav from "@/components/CareerBottomNav";

type PageProps = {
  params: Promise<{
    careerId: string;
  }>;
};

export default async function CareerDashboardPage({ params }: PageProps) {
  const { careerId } = await params;

  const { data: career } = await supabase
    .from("careers")
    .select("*")
    .eq("id", careerId)
    .single();

  const { data: ratings } = await supabase
    .from("career_ratings")
    .select("*")
    .eq("career_id", careerId)
    .single();

  const { data: months } = await supabase
    .from("career_months")
    .select("*")
    .eq("career_id", careerId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: events } = await supabase
    .from("career_events")
    .select("*")
    .eq("career_id", careerId)
    .order("created_at", { ascending: false })
    .limit(5);
    const { data: newsItems } = await supabase
  .from("news_items")
  .select("*")
  .eq("career_id", careerId)
  .order("created_at", { ascending: false })
  .limit(5);

  if (!career) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        <p>Career not found.</p>
        <Link href="/worlds" className="text-yellow-400">
          Back to worlds
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/worlds/${career.world_id}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Back to World
        </Link>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
                Career Dashboard
              </p>

              <h1 className="mt-3 text-5xl font-black">
                {career.full_name}
              </h1>

              <p className="mt-3 text-zinc-400">
                {career.primary_position} · Bats {career.bats} · Throws{" "}
                {career.throws} · {career.hometown || "Unknown hometown"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
  <Link
    href={getAdvanceHref(career)}
    className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-zinc-950 hover:bg-yellow-300"
  >
    {getAdvanceLabel(career)}
  </Link>

  <Link
    href={`/careers/${career.id}/history`}
    className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-bold text-white hover:bg-zinc-800"
  >
    Career History
  </Link>
</div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatBox label="Age" value={career.current_age ?? "-"} />
            <StatBox label="Year" value={career.current_year ?? "-"} />
            <StatBox label="Level" value={career.current_level ?? "-"} />
            <StatBox label="Stage" value={formatStage(career.career_stage)} />
          </div>
          {career.career_stage === "minor_leagues" || career.career_stage === "mlb" ? (
  <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
      Prospect Status
    </p>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <StatBox
        label="Org Rank"
        value={
          career.organization_prospect_rank
            ? `#${career.organization_prospect_rank}`
            : "Unranked"
        }
      />

      <StatBox
        label="MLB Top 100"
        value={
          career.overall_prospect_rank
            ? `#${career.overall_prospect_rank}`
            : "Unranked"
        }
      />

      <StatBox
        label="Score"
        value={career.prospect_score ? Math.round(career.prospect_score) : "-"}
      />

      <StatBox
        label="Trend"
        value={career.prospect_trend ?? "-"}
      />
      {career.draft_projection_round ? (
  <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
      Draft Projection
    </p>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <StatBox
        label="Projected Round"
        value={`Round ${career.draft_projection_round}`}
      />
      <StatBox
        label="Projected Pick"
        value={`Pick ${career.draft_projection_pick ?? "-"}`}
      />
    </div>
  </div>
) : null}
    </div>
  </div>
) : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
            <h2 className="text-2xl font-black">Ratings</h2>

            {ratings ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Rating label="Contact" value={ratings.contact} />
                <Rating label="Power" value={ratings.power} />
                <Rating label="Speed" value={ratings.speed} />
                <Rating label="Glove" value={ratings.glove} />
                <Rating label="Arm" value={ratings.arm} />
                <Rating label="Velocity" value={ratings.velocity} />
                <Rating label="Command" value={ratings.command} />
                <Rating label="Movement" value={ratings.movement} />
                <Rating label="Stamina" value={ratings.stamina} />
              </div>
            ) : (
              <p className="mt-4 text-zinc-400">No ratings found.</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-2xl font-black">Hall Watch</h2>

            {career.mlb_debut_year ? (
              <div className="mt-5">
                <p className="text-sm text-zinc-400">Hall Score</p>
                <p className="text-5xl font-black text-yellow-400">
                  {career.hall_score ?? 0}
                </p>
                <p className="mt-3 text-zinc-400">
                  {career.hall_track || "Not yet on a clear Hall track."}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-zinc-400">
                Hall Score unlocks after MLB debut.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-2xl font-black">Recent Months</h2>

            <div className="mt-4 space-y-3">
              {!months || months.length === 0 ? (
                <p className="text-zinc-400">No months simulated yet.</p>
              ) : (
                months.map((month) => (
                  <div
                    key={month.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="font-bold">
                      {month.month} {month.year}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {month.monthly_summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
<section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
  <h2 className="text-2xl font-black">News Feed</h2>

  <div className="mt-4 space-y-3">
    {!newsItems || newsItems.length === 0 ? (
      <p className="text-zinc-400">No headlines yet.</p>
    ) : (
      newsItems.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
            {item.category}
          </p>
          <p className="mt-2 text-lg font-black">{item.headline}</p>
          <p className="mt-1 text-sm text-zinc-400">{item.body}</p>
        </div>
      ))
    )}
  </div>
</section>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-2xl font-black">Timeline</h2>

            <div className="mt-4 space-y-3">
              {!events || events.length === 0 ? (
                <p className="text-zinc-400">No major events yet.</p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="font-bold">{event.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {event.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
            </div>

      <CareerBottomNav
        careerId={career.id}
        worldId={career.world_id}
        active="career"
      />
    </main>
  );
}
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-zinc-400">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-yellow-400"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function formatStage(stage: string | null) {
  if (!stage) return "-";

  return stage
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
function getAdvanceHref(career: any) {
  if (career.career_stage === "draft") {
    return `/careers/${career.id}/draft`;
  }

  if (career.career_stage === "college") {
    return `/careers/${career.id}/college`;
  }

  if (career.career_stage === "minor_leagues" || career.career_stage === "mlb") {
    return `/careers/${career.id}/pro`;
  }

  return `/careers/${career.id}/month`;
}

function getAdvanceLabel(career: any) {
  if (career.career_stage === "draft") {
    return "Enter Draft";
  }

  if (career.career_stage === "college") {
    return "Play College Season";
  }

  if (career.career_stage === "minor_leagues") {
    return "Play Pro Month";
  }

  if (career.career_stage === "mlb") {
    return "Play MLB Month";
  }

  return "Advance Career";
}