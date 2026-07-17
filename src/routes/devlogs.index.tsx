import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DevlogCard, type DevlogCardData } from "@/components/devlog-card";
import { Search } from "lucide-react";

export const Route = createFileRoute("/devlogs/")({
  head: () => ({
    meta: [
      { title: "Devlogs — Snow Cheetah Studios" },
      { name: "description", content: "All devlogs from Snow Cheetah Studios." },
      { property: "og:title", content: "Devlogs — Snow Cheetah Studios" },
      { property: "og:description", content: "All devlogs from Snow Cheetah Studios." },
    ],
  }),
  component: DevlogsIndex,
});

type Cat = { id: string; name: string; slug: string };

function DevlogsIndex() {
  const [logs, setLogs] = useState<DevlogCardData[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [
  { data: d, error: devlogsError },
  { data: c, error: categoriesError },
] = await Promise.all([
        supabase.from("devlogs")
      .select("id, slug, title, main_image_url, created_at, is_public, display_date, publish_at, categories(name, slug)")
      .eq("is_public", true)
      .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug").order("name"),
      ]);
      if (devlogsError) {
  console.error("Devlogs error:", devlogsError);
}

if (categoriesError) {
  console.error("Categories error:", categoriesError);
}
      if (!alive) return;
      setLogs((d ?? []) as unknown as DevlogCardData[]);
      setCats((c ?? []) as Cat[]);
    }
    load();
    const ch = supabase.channel("devlogs-index")
      .on("postgres_changes", { event: "*", schema: "public", table: "devlogs" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (activeCat && l.categories?.slug !== activeCat) return false;
      if (needle && !l.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [logs, q, activeCat]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-deep sm:text-5xl">
          <span className="text-gradient">Devlogs</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Everything the studio has been building.</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search devlogs..."
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <CatChip active={activeCat === null} onClick={() => setActiveCat(null)}>All</CatChip>
        {cats.map((c) => (
          <CatChip key={c.id} active={activeCat === c.slug} onClick={() => setActiveCat(c.slug)}>
            {c.name}
          </CatChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-frost rounded-3xl p-12 text-center text-muted-foreground">
          No devlogs match your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => <DevlogCard key={l.id} log={l} />)}
        </div>
      )}
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-4 py-1.5 text-sm font-bold transition " +
        (active
          ? "bg-primary text-primary-foreground shadow"
          : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary")
      }
    >
      {children}
    </button>
  );
}
