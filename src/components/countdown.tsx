import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  let ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86400000); ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds, done: target - now <= 0 };
}

export function Countdown({ target }: { target: string | null | undefined }) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const [t, setT] = useState(() => (isNaN(targetMs) ? null : diff(targetMs)));

  useEffect(() => {
    if (isNaN(targetMs)) { setT(null); return; }
    setT(diff(targetMs));
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (!t) return <div className="text-muted-foreground text-sm">No countdown set</div>;

  const cells: Array<[string, number]> = [
    ["Days", t.days], ["Hours", t.hours], ["Minutes", t.minutes], ["Seconds", t.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {cells.map(([label, value]) => (
        <div key={label} className="card-frost rounded-2xl p-3 text-center sm:p-4">
          <div className="text-3xl font-extrabold text-gradient tabular-nums sm:text-5xl">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}