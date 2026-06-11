"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateCollegeOffers, type CollegeOffer, type School } from "@/lib/sim/college";

type Career = {
  id: string;
  full_name: string;
  current_age: number;
  current_year: number;
  draft_round: number | null;
};

export default function CollegeOffersPage() {
  const params = useParams();
  const router = useRouter();
  const careerId = params.careerId as string;

  const [career, setCareer] = useState<Career | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");

  const offers = useMemo(() => {
    return generateCollegeOffers(schools, career?.draft_round);
  }, [schools, career?.draft_round]);

  const selectedOffer = offers.find((offer) => offer.id === selectedSchoolId) ?? offers[0];

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const { data: careerData, error: careerError } = await supabase
        .from("careers")
        .select("id, full_name, current_age, current_year, draft_round")
        .eq("id", careerId)
        .single();

      if (careerError) {
        setError(careerError.message);
        setLoading(false);
        return;
      }

      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .order("tier", { ascending: true });

      if (schoolsError) {
        setError(schoolsError.message);
        setLoading(false);
        return;
      }

      setCareer(careerData);
      setSchools(schoolsData ?? []);

      const generated = generateCollegeOffers(schoolsData ?? [], careerData.draft_round);
      setSelectedSchoolId(generated[0]?.id ?? "");

      setLoading(false);
    }

    load();
  }, [careerId]);

  async function commit() {
    if (!career || !selectedOffer) return;

    setCommitting(true);
    setError("");

    const { error: updateError } = await supabase
      .from("careers")
      .update({
        career_stage: "college",
        career_path: "college",
        current_school_id: selectedOffer.id,
        current_team_id: null,
        current_level: "NCAA",
        current_month: "Freshman Season",
        updated_at: new Date().toISOString(),
      })
      .eq("id", career.id);

    if (updateError) {
      setError(updateError.message);
      setCommitting(false);
      return;
    }

    await supabase.from("career_events").insert({
      career_id: career.id,
      year: career.current_year,
      month: "Commitment Day",
      age: career.current_age,
      event_type: "college_commitment",
      title: `Committed to ${selectedOffer.name}`,
      description: `${career.full_name} committed to ${selectedOffer.name} out of the ${selectedOffer.conference ?? "Independent"} with a projected role as ${selectedOffer.role.toLowerCase()}.`,
      importance: "major",
    });

    router.push(`/careers/${career.id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p className="text-zinc-400">Loading college offers...</p>
      </main>
    );
  }

  if (!career) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
        <p>Career not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <Link href={`/careers/${career.id}`} className="text-sm text-zinc-400 hover:text-white">
          ← Career
        </Link>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            College Offers
          </p>

          <h1 className="mt-3 text-3xl font-black">Choose Your Program</h1>

          <p className="mt-3 text-zinc-400">
            Your decision shapes development, playing time, exposure, and draft stock.
          </p>

          {offers.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              No schools found. Seed your schools table first.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {offers.map((offer) => {
                const selected = selectedSchoolId === offer.id;

                return (
                  <button
                    key={offer.id}
                    onClick={() => setSelectedSchoolId(offer.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                        : "border-zinc-800 bg-zinc-950 text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black">{offer.name}</p>
                        <p className={selected ? "text-sm text-zinc-800" : "text-sm text-zinc-400"}>
                          {offer.conference ?? "Independent"} · Tier {offer.tier ?? "-"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-black ${
                          selected ? "bg-zinc-950 text-yellow-400" : "bg-yellow-400 text-zinc-950"
                        }`}
                      >
                        {offer.role}
                      </span>
                    </div>

                    <p className={selected ? "mt-3 text-sm text-zinc-800" : "mt-3 text-sm text-zinc-400"}>
                      {offer.fitSummary}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {selectedOffer ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Info label="Prestige" value={selectedOffer.prestige ?? 50} />
              <Info label="Dev" value={selectedOffer.development ?? 50} />
              <Info label="Playing Time" value={selectedOffer.playing_time ?? 50} />
              <Info label="Competition" value={selectedOffer.competition ?? 50} />
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={commit}
            disabled={committing || !selectedOffer}
            className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
          >
            {committing ? "Committing..." : "Commit"}
          </button>
        </section>
      </div>
    </main>
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