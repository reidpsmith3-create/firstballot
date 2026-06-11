import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CareerBottomNav from "@/components/CareerBottomNav";

type PageProps = {
  params: Promise<{
    careerId: string;
  }>;
};

export default async function CareerHistoryPage({ params }: PageProps) {
  const { careerId } = await params;

  const { data: career } = await supabase
    .from("careers")
    .select("*")
    .eq("id", careerId)
    .single();

  const { data: events } = await supabase
    .from("career_events")
    .select("*")
    .eq("career_id", careerId)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: newsItems } = await supabase
    .from("news_items")
    .select("*")
    .eq("career_id", careerId)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (!career) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 pb-28 pt-6 text-white">
        <p>Career not found.</p>
        <Link href="/worlds" className="text-yellow-400">
          Back to worlds
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href={`/careers/${career.id}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Career
        </Link>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Career History
          </p>

          <h1 className="mt-3 text-3xl font-black">{career.full_name}</h1>

          <p className="mt-3 text-zinc-400">
            The major moments, headlines, milestones, and turning points.
          </p>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Timeline</h2>

          <div className="mt-5 space-y-4">
            {!events || events.length === 0 ? (
              <p className="text-zinc-400">No timeline events yet.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                        {event.month} {event.year}
                      </p>
                      <h3 className="mt-2 text-lg font-black">{event.title}</h3>
                    </div>

                    <ImportanceBadge importance={event.importance} />
                  </div>

                  <p className="mt-2 text-sm text-zinc-400">
                    {event.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Headlines</h2>

          <div className="mt-5 space-y-4">
            {!newsItems || newsItems.length === 0 ? (
              <p className="text-zinc-400">No headlines yet.</p>
            ) : (
              newsItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                    {item.category} · {item.month} {item.year}
                  </p>
                  <h3 className="mt-2 text-lg font-black">{item.headline}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </section>
            </div>

      <CareerBottomNav
        careerId={career.id}
        worldId={career.world_id}
        active="history"
      />
    </main>
  );
}

function ImportanceBadge({ importance }: { importance: string | null }) {
  if (importance === "legendary") {
    return (
      <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-zinc-950">
        Legendary
      </span>
    );
  }

  if (importance === "milestone") {
    return (
      <span className="rounded-full bg-blue-400 px-2 py-1 text-xs font-black text-zinc-950">
        Milestone
      </span>
    );
  }

  if (importance === "major") {
    return (
      <span className="rounded-full bg-zinc-700 px-2 py-1 text-xs font-black text-white">
        Major
      </span>
    );
  }

  return (
    <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-black text-zinc-400">
      Minor
    </span>
  );
}