import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/markdown";
import { DevlogCard, type DevlogCardData } from "@/components/devlog-card";
import { formatDate } from "@/lib/slug";
import { ArrowLeft, Calendar } from "lucide-react";

export const Route = createFileRoute("/devlogs/$slug")({
  component: DevlogPage,
});

type Full = DevlogCardData & { content: string };

function DevlogPage() {
  const { slug } = Route.useParams();
  const [log, setLog] = useState<Full | null>(null);
  const [related, setRelated] = useState<DevlogCardData[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data } = await supabase
        .from("devlogs")
        .select("id, slug, title, main_image_url, content, created_at, display_date, is_public, categories(name, slug)")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (!alive) return;
      if (!data) { setState("notfound"); return; }
      setLog(data as unknown as Full);
      setState("ready");
const { data: rel } = await supabase
  .from("devlogs")
  .select("id, slug, title, main_image_url, created_at, display_date, is_public, categories(name, slug)")
  .eq("is_public", true)
  .neq("slug", slug)
  .limit(50);

if (alive) {
  const currentCategories = (data.categories ?? []).map(
    (c: any) => c.slug
  );

  const scored = ((rel ?? []) as unknown as DevlogCardData[])
    .map((post) => {
      let score = 0;

      // Category matching
      const postCategories = (post.categories ?? []).map(
        (c: any) => c.slug
      );

      const matchingCategories = postCategories.filter((c: string) =>
        currentCategories.includes(c)
      ).length;

      if (matchingCategories > 0) {
        score += 4;
        score += (matchingCategories - 1) * 2;
      }

      // Freshness
      const age =
        Date.now() - new Date(post.created_at).getTime();

      const daysOld = age / (1000 * 60 * 60 * 24);

      if (daysOld <= 1) {
        score += 10;
      } else if (daysOld <= 7) {
        score += 8;
      } else if (daysOld <= 14) {
        score += 5;
      } else if (daysOld <= 30) {
        score += 2;
      }

      return {
        post,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.post);

  setRelated(scored);
}
    }
    load();
    return () => { alive = false; };
  }, [slug]);

  if (state === "loading") {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">Loading...</div>;
  }
  if (state === "notfound" || !log) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-slate-deep">Devlog not found</h1>
        <p className="mt-3 text-muted-foreground">The post you're looking for isn't available.</p>
        <Link to="/devlogs" className="mt-6 inline-flex items-center gap-2 text-primary font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to devlogs
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/devlogs" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All devlogs
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          {log.categories && (
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              {log.categories.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> {formatDate(log.created_at)}
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-deep sm:text-5xl">
          {log.title}
        </h1>
      </header>

      {log.main_image_url && (
        <img
          src={log.main_image_url}
          alt={log.title}
          className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover shadow-xl"
        />
      )}

      <div className="mt-10">
        <Markdown>{log.content || ""}</Markdown>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-border/60 pt-10">
          <h2 className="mb-6 text-2xl font-extrabold text-slate-deep">Related posts</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <DevlogCard key={r.id} log={r} />)}
          </div>
        </section>
      )}
    </article>
  );
}
