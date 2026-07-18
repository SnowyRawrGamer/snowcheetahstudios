import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/slug";
import { Calendar, Lock } from "lucide-react";

export type DevlogCardData = {
  id: string;
  slug: string;
  title: string;
  main_image_url: string | null;
  created_at: string;
  display_date?: string | null;
  is_public: boolean;
  categories?: { name: string; slug: string } | null;
};

export function DevlogCard({ log, showPrivate = false }: { log: DevlogCardData; showPrivate?: boolean }) {
  return (
    <Link
      to="/devlogs/$slug"
      params={{ slug: log.slug }}
      className="group flex flex-col overflow-hidden rounded-3xl card-frost transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-primary-glow/30">
        {log.main_image_url ? (
          <img
            src={log.main_image_url}
            alt={log.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-primary/50 text-6xl">❄</div>
        )}
        {showPrivate && !log.is_public && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-deep/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            <Lock className="h-3 w-3" /> Private
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {log.categories && (
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              {log.categories.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatDate(log.display_date || log.created_at)}
          </span>
        </div>
        <h3 className="text-lg font-extrabold leading-snug text-slate-deep group-hover:text-primary transition-colors">
          {log.title}
        </h3>
      </div>
    </Link>
  );
}
