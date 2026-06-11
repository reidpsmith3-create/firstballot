import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    worldId: string;
  }>;
};

export default async function WorldDashboardPage({ params }: PageProps) {
  const { worldId } = await params;

  const { data: world } = await supabase
    .from("worlds")
    .select("*")
    .eq("id", worldId)
    .single();

  const { data: careers } = await supabase
    .from("careers")
    .select("*")
    .eq("world_id", worldId)
    .order("created_at", { ascending: false });

  if (!world) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        <p>World not found.</p>
        <Link href="/worlds" className="text-yellow-400">
          Back to worlds
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/worlds" className="text-sm text-zinc-400 hover:text-white">
          ← Worlds
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
              World Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black">{world.name}</h1>
            <p className="mt-3 text-zinc-400">
              Careers, Hall of Fame, and records for this universe.
            </p>
          </div>

          <Link
            href={`/careers/new?worldId=${world.id}`}
            className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-zinc-950 hover:bg-yellow-300"
          >
            New Career
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Total Careers</p>
            <p className="mt-2 text-4xl font-black">{careers?.length ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Hall of Famers</p>
            <p className="mt-2 text-4xl font-black">0</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Record Holders</p>
            <p className="mt-2 text-4xl font-black">0</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Careers</h2>

          <div className="mt-4 grid gap-4">
            {!careers || careers.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
                No careers yet. Create your first player.
              </div>
            ) : (
              careers.map((career) => (
                <Link
                  key={career.id}
                  href={`/careers/${career.id}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 hover:border-yellow-400"
                >
                  <h3 className="text-xl font-black">{career.full_name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    {career.primary_position} · Age {career.current_age} ·{" "}
                    {career.current_level}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}