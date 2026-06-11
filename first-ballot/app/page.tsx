import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
          First Ballot
        </p>

        <h1 className="text-5xl font-black tracking-tight md:text-7xl">
          Build a baseball life.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-300">
          Create a player, chase the majors, stack up stats, retire, and see if
          the Hall calls your name.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/worlds"
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-zinc-950 hover:bg-yellow-300"
          >
            New / Continue Career
          </Link>

          <Link
            href="/worlds"
            className="rounded-xl border border-zinc-700 px-6 py-3 font-bold text-white hover:bg-zinc-900"
          >
            World Saves
          </Link>
        </div>
      </section>
    </main>
  );
}