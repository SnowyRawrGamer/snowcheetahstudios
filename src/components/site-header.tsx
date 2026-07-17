import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/devlogs", label: "Devlogs" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md transition-transform group-hover:-rotate-6">
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-slate-deep">Snow Cheetah</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Studios</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-muted" }}
              className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}