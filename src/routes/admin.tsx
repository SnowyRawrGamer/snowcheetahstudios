import { createFileRoute } from "@tanstack/react-router";
import { Markdown } from "@/components/markdown";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, fetchSettings, type SettingsMap } from "@/lib/site-data";
import { slugify, formatDate } from "@/lib/slug";
import { toast } from "sonner";
import {
  Bold, Italic, Heading1, Heading2, Link as LinkIcon, Image as ImageIcon,
  Save, Trash2, Plus, LogOut, PawPrint, Eye, EyeOff, Pencil,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session) return <Login />;
  return <Dashboard onLogout={() => supabase.auth.signOut()} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { setErr(true); return; }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card-frost rounded-3xl p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-deep">Admin Login</h1>
            <p className="text-xs text-muted-foreground">Snow Cheetah Studios</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="username" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
          </Field>
          {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">Invalid credentials.</div>}
          <button type="submit" disabled={submitting} className="btn-primary w-full rounded-full py-3 text-sm font-extrabold disabled:opacity-60">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "text-xs font-bold uppercase tracking-wider text-muted-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className={labelCls}>{label}</span>{children}</label>;
}

type Cat = { id: string; name: string; slug: string };
type Devlog = {
  id: string; title: string; slug: string; main_image_url: string | null;
  content: string; category_id: string | null; is_public: boolean; created_at: string;
};

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"write" | "categories" | "settings">("write");
  const [devlogs, setDevlogs] = useState<Devlog[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);

  async function refresh() {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("devlogs").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setDevlogs((d ?? []) as Devlog[]);
    setCats((c ?? []) as Cat[]);
  }

  useEffect(() => {
    refresh();
    const ch = supabase.channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "devlogs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-deep">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage devlogs, categories, and site settings.</p>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:border-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Devlogs" value={devlogs.length} />
        <StatCard label="Total Categories" value={cats.length} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "write"} onClick={() => setTab("write")}>Write Devlog</TabBtn>
        <TabBtn active={tab === "categories"} onClick={() => setTab("categories")}>Categories</TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>Site Settings</TabBtn>
      </div>

      {tab === "write" && <WriteTab cats={cats} devlogs={devlogs} onSaved={refresh} />}
      {tab === "categories" && <CategoriesTab cats={cats} devlogs={devlogs} onChanged={refresh} />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-frost rounded-2xl p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-4xl font-extrabold text-gradient tabular-nums">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-5 py-2 text-sm font-bold transition " +
        (active ? "bg-primary text-primary-foreground shadow" : "bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary")
      }
    >
      {children}
    </button>
  );
}

function WriteTab({ cats, devlogs, onSaved }: { cats: Cat[]; devlogs: Devlog[]; onSaved: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function reset() {
    setEditingId(null); setTitle(""); setCategoryId(""); setImageUrl(""); setContent(""); setIsPublic(true);
  }

  function loadEdit(d: Devlog) {
    setEditingId(d.id);
    setTitle(d.title);
    setCategoryId(d.category_id ?? "");
    setImageUrl(d.main_image_url ?? "");
    setContent(d.content);
    setIsPublic(d.is_public);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function wrap(before: string, after = before, placeholder = "text") {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertAtLineStart(prefix: string) {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, start + prefix.length); });
  }

  function insertLink() {
    const url = prompt("Link URL:"); if (!url) return;
    wrap("[", `](${url})`, "link text");
  }
  function insertImage() {
    const url = prompt("Image URL:"); if (!url) return;
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart;
    const snippet = `\n![image](${url})\n`;
    setContent(content.slice(0, start) + snippet + content.slice(start));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title required"); return; }
    const payload = {
      title: title.trim(),
      slug: slugify(title),
      main_image_url: imageUrl.trim() || null,
      content,
      category_id: categoryId || null,
      is_public: isPublic,
    };
    if (editingId) {
      const { error } = await supabase.from("devlogs").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Devlog updated");
    } else {
      const { error } = await supabase.from("devlogs").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Devlog published");
    }
    reset(); onSaved();
  }

  async function del(id: string) {
    if (!confirm("Delete this devlog?")) return;
    const { error } = await supabase.from("devlogs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    if (editingId === id) reset();
    onSaved();
  }

  async function togglePublic(d: Devlog) {
    const { error } = await supabase.from("devlogs").update({ is_public: !d.is_public }).eq("id", d.id);
    if (error) toast.error(error.message);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={save} className="card-frost space-y-4 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-deep">
            {editingId ? "Edit devlog" : "New devlog"}
          </h2>
          {editingId && <button type="button" onClick={reset} className="text-xs font-bold text-muted-foreground hover:text-primary">Cancel edit</button>}
        </div>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="A frosty update from the studio" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Main image URL">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>
        </div>

        <div>
          <div className={labelCls + " mb-1.5"}>Content — write on the left, see the result on the right</div>
          <div className="mb-2 flex flex-wrap gap-1">
            <ToolBtn onClick={() => wrap("**")} title="Bold"><Bold className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => wrap("*")} title="Italic"><Italic className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => insertAtLineStart("# ")} title="H1"><Heading1 className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => insertAtLineStart("## ")} title="H2"><Heading2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={insertLink} title="Link"><LinkIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={insertImage} title="Insert image (by URL)"><ImageIcon className="h-4 w-4" /></ToolBtn>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputCls + " min-h-[320px] font-mono text-sm leading-relaxed"}
              placeholder={"# Hello world\n\nStart writing here..."}
            />
            <div className="min-h-[320px] overflow-y-auto rounded-xl border border-border bg-white px-4 py-3">
              {content.trim() ? (
                <div className="scale-[0.85] origin-top-left w-[117.6%]">
                  <Markdown>{content}</Markdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Your preview will appear here as you type.</p>
              )}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="flex-1">
            <span className="block text-sm font-bold text-slate-deep">Public</span>
            <span className="block text-xs text-muted-foreground">If off, this devlog is only visible in the admin dashboard.</span>
          </span>
          {isPublic ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </label>

        <button type="submit" className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-extrabold">
          <Save className="h-4 w-4" /> {editingId ? "Update devlog" : "Publish devlog"}
        </button>
      </form>

      <div className="card-frost rounded-3xl p-6">
        <h2 className="mb-4 text-lg font-extrabold text-slate-deep">All devlogs</h2>
        {devlogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devlogs yet.</p>
        ) : (
          <ul className="space-y-2">
            {devlogs.map((d) => (
              <li key={d.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-white/60 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={"h-2 w-2 rounded-full " + (d.is_public ? "bg-emerald-500" : "bg-slate-400")} />
                    <div className="truncate text-sm font-bold text-slate-deep">{d.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(d.created_at)}</div>
                </div>
                <button onClick={() => togglePublic(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title={d.is_public ? "Make private" : "Make public"}>
                  {d.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => loadEdit(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => del(d.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary">
      {children}
    </button>
  );
}

function CategoriesTab({ cats, devlogs, onChanged }: { cats: Cat[]; devlogs: Devlog[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const counts = new Map<string, number>();
  devlogs.forEach((d) => { if (d.category_id) counts.set(d.category_id, (counts.get(d.category_id) ?? 0) + 1); });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(); if (!n) return;
    const { error } = await supabase.from("categories").insert({ name: n, slug: slugify(n) });
    if (error) { toast.error(error.message); return; }
    toast.success("Category added"); setName(""); onChanged();
  }

  async function del(c: Cat) {
    if ((counts.get(c.id) ?? 0) > 0) { toast.error("Category not empty"); return; }
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); onChanged();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
      <form onSubmit={add} className="card-frost h-fit rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-deep">New category</h2>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Behind the Scenes" />
        </Field>
        <button type="submit" className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </form>

      <div className="card-frost rounded-3xl p-6">
        <h2 className="mb-4 text-lg font-extrabold text-slate-deep">Existing categories</h2>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {cats.map((c) => {
              const count = counts.get(c.id) ?? 0;
              const empty = count === 0;
              return (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <div className="font-bold text-slate-deep">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{count} devlog{count === 1 ? "" : "s"}</div>
                  </div>
                  <button
                    onClick={() => del(c)}
                    disabled={!empty}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [s, setS] = useState<SettingsMap>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings().then((v) => { setS({ ...DEFAULT_SETTINGS, ...v }); setLoading(false); });
  }, []);

  function set<K extends keyof SettingsMap>(k: K, v: string) { setS((prev) => ({ ...prev, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const rows = Object.entries(s).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const countdownLocal = s.countdown_target
    ? new Date(s.countdown_target).toISOString().slice(0, 16)
    : "";

  return (
    <form onSubmit={save} className="card-frost rounded-3xl p-6 space-y-5">
      <h2 className="text-lg font-extrabold text-slate-deep">Homepage & featured game</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hero title">
          <input value={s.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Hero subtitle">
          <input value={s.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Main image URL (shown on the front page)">
        <input value={s.hero_image_url || ""} onChange={(e) => set("hero_image_url", e.target.value)} className={inputCls} placeholder="https://..." />
      </Field>

      <Field label="Featured game title">
        <input value={s.featured_game_title || ""} onChange={(e) => set("featured_game_title", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Featured game description">
        <textarea value={s.featured_game_description || ""} onChange={(e) => set("featured_game_description", e.target.value)} className={inputCls + " min-h-[100px]"} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Play button URL">
          <input value={s.featured_game_url || ""} onChange={(e) => set("featured_game_url", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Play button label">
          <input value={s.featured_game_cta || ""} onChange={(e) => set("featured_game_cta", e.target.value)} className={inputCls} placeholder="Play on Roblox" />
        </Field>
      </div>

      <Field label="Countdown target date & time">
        <input
          type="datetime-local"
          value={countdownLocal}
          onChange={(e) => {
            const v = e.target.value;
            set("countdown_target", v ? new Date(v).toISOString() : "");
          }}
          className={inputCls}
        />
      </Field>

      <button type="submit" className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold">
        <Save className="h-4 w-4" /> Save settings
      </button>
    </form>
  );
}
