import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-8 mb-4 text-4xl font-extrabold text-slate-deep" {...p} />,
          h2: (p) => <h2 className="mt-8 mb-3 text-3xl font-extrabold text-slate-deep" {...p} />,
          h3: (p) => <h3 className="mt-6 mb-2 text-2xl font-bold text-slate-deep" {...p} />,
          p: (p) => <p className="my-4 text-lg leading-relaxed text-foreground/90" {...p} />,
          a: (p) => <a className="text-primary underline underline-offset-2 hover:text-primary-glow" target="_blank" rel="noreferrer" {...p} />,
          ul: (p) => <ul className="my-4 list-disc space-y-2 pl-6 text-lg" {...p} />,
          ol: (p) => <ol className="my-4 list-decimal space-y-2 pl-6 text-lg" {...p} />,
          strong: (p) => <strong className="font-bold text-slate-deep" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          img: (p) => <img className="my-6 rounded-2xl border border-border shadow-lg" loading="lazy" {...p} />,
          blockquote: (p) => <blockquote className="my-6 border-l-4 border-primary bg-primary/5 py-2 pl-5 italic text-foreground/80" {...p} />,
          code: (p) => <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary" {...p} />,
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}