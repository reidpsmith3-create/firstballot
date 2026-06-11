import Link from "next/link";

export default function CareerBottomNav({
  careerId,
  worldId,
  active,
}: {
  careerId: string;
  worldId: string;
  active: "career" | "history" | "world";
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 text-white backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <NavItem
          href={`/careers/${careerId}`}
          label="Career"
          active={active === "career"}
        />
        <NavItem
          href={`/careers/${careerId}/history`}
          label="History"
          active={active === "history"}
        />
        <NavItem
          href={`/worlds/${worldId}`}
          label="World"
          active={active === "world"}
        />
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-3 py-3 text-center text-sm font-black ${
        active
          ? "bg-yellow-400 text-zinc-950"
          : "bg-zinc-900 text-zinc-400"
      }`}
    >
      {label}
    </Link>
  );
}