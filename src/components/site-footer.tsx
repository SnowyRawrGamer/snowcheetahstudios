import { Youtube, Users, PawPrint } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-background/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md">
              <PawPrint className="h-5 w-5" />
            </span>
            <div>
              <div className="font-extrabold text-slate-deep">Snow Cheetah Studios</div>
              <div className="text-xs text-muted-foreground">Playful worlds from a snowy peak.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://view-link.cx/el6KVeVieWt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
            >
              <Youtube className="h-4 w-4" /> YouTube
            </a>
            <a
              href="https://view-link.cx/VTCtlVWvi44"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
            >
              <Users className="h-4 w-4" /> Roblox Group
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Snow Cheetah Studios. All rights reserved.
        </div>
      </div>
    </footer>
  );
}