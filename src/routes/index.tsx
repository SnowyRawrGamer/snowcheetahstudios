import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, fetchSettings, type SettingsMap } from "@/lib/site-data";
import { Countdown } from "@/components/countdown";
import { DevlogCard, type DevlogCardData } from "@/components/devlog-card";
import { Sparkles, Gamepad2, ArrowRight, Snowflake } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS);
  const [recent, setRecent] = useState<DevlogCardData[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const s = await fetchSettings();
      if (!alive) return;
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      const { data } = await supabase
        .from("devlogs")
        .select("id, slug, title, main_image_url, created_at, is_public, categories(name, slug)")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (alive) setRecent((data ?? []) as unknown as DevlogCardData[]);
    }
    load();

    const ch = supabase
      .channel("home-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "devlogs" }, () => load())
      .subscribe();

    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="pt-10 pb-8 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Featured game
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-slate-deep sm:text-6xl">
              <span className="text-gradient">{settings.featured_game_title}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
              {settings.featured_game_description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={settings.featured_game_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-extrabold"
              >
                <Gamepad2 className="h-5 w-5" />
                {settings.featured_game_cta || "Play on Roblox"}
              </a>
              <Link
                to="/devlogs"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-base font-bold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
              >
                Read devlogs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

         <div className="card-frost rounded-3xl p-6 sm:p-8">
            {settings.hero_image_url && (
              <img
                src={settings.hero_image_url}
                alt={settings.hero_title}
                className="mb-5 w-full rounded-2xl border border-border object-cover shadow-md"
              />
            )}
            <div className="flex items-center gap-2 text-primary">
              <Snowflake className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Launching in</span>
            </div>
            <div className="mt-4">
              <Countdown target={settings.countdown_target} />
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Live countdown to the next big drop.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-deep sm:text-4xl">Recent Devlogs</h2>
            <p className="mt-2 text-muted-foreground">Fresh from the studio.</p>
          </div>
          <Link to="/devlogs" className="text-sm font-bold text-primary hover:text-primary-glow">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card-frost rounded-3xl p-10 text-center text-muted-foreground">
            No devlogs yet — check back soon!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((log) => <DevlogCard key={log.id} log={log} />)}
          </div>
        )}
      </section>
    </div>
  );
}
