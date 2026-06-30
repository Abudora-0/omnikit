"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { getAvailableTools, toolCategories, downloadsEnabled } from "@omnikit/shared";
import { History, Menu, X, Github, Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette, OPEN_COMMAND_EVENT } from "@/components/command-palette";
import { GlobalDrop } from "@/components/global-drop";
import { PageTransition } from "@/components/page-transition";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";

const categoryMeta: Record<string, { label: string; abbr: string; dot: string }> = {
  image:    { label: "Images",    abbr: "IMG", dot: "bg-sky-400" },
  pdf:      { label: "PDF",       abbr: "PDF", dot: "bg-rose-400" },
  download: { label: "Downloads", abbr: "DL",  dot: "bg-emerald-400" },
  audio:    { label: "Audio",     abbr: "AUD", dot: "bg-fuchsia-400" },
  utility:  { label: "Utilities", abbr: "UTL", dot: "bg-primary" },
};

function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative flex items-center justify-center rounded-[0.55rem] shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.7)]"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, hsl(var(--brand-1)), hsl(var(--brand-2)) 55%, hsl(var(--brand-3)))",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" fill="#fff" fillOpacity="0.95" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" fill="#fff" fillOpacity="0.6" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" fill="#fff" fillOpacity="0.6" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="3.75" fill="#fff" fillOpacity="0.95" />
      </svg>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showJobs = downloadsEnabled();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const { toast } = useToast();

  // One-time onboarding nudge toward the command palette.
  useEffect(() => {
    try {
      if (localStorage.getItem("omnikit:seen-tip")) return;
      const id = window.setTimeout(() => {
        toast({
          title: "Pro tip",
          description: "Press ⌘K (or Ctrl K) anytime to jump to any tool.",
          variant: "info",
          duration: 6000,
        });
        localStorage.setItem("omnikit:seen-tip", "1");
      }, 1500);
      return () => window.clearTimeout(id);
    } catch {
      /* localStorage unavailable */
    }
  }, [toast]);

  const tools = getAvailableTools();
  const cats = toolCategories.filter((c) => tools.some((t) => t.category === c));
  const totalTools = tools.filter((t) => !t.comingSoon).length;

  const openCommand = () => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));

  const navItems = (
    <>
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className={cn(
          "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
          pathname === "/"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        All
      </Link>
      {cats.map((cat) => {
        const meta = categoryMeta[cat];
        if (!meta) return null;
        return (
          <Link
            key={cat}
            href={`/#${cat}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
            {meta.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <CommandPalette />
      <GlobalDrop />

      <header className="sticky top-0 z-50 border-b border-border/80 glass">
        {/* Scroll progress bar */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-[hsl(var(--brand-1))] via-[hsl(var(--brand-2))] to-[hsl(var(--brand-3))]"
          style={{ scaleX: progress }}
        />

        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                <Logo size={36} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  Omni<span className="text-gradient">Kit</span>
                </span>
                <span className="font-mono-accent text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-0.5">
                  {totalTools} tools
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5 flex-1 pl-2">{navItems}</nav>

            <div className="flex items-center gap-2 ml-auto">
              {/* Command palette trigger */}
              <button
                onClick={openCommand}
                className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-secondary/40 py-1.5 pl-2.5 pr-2 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
                aria-label="Open command palette"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Search tools</span>
                <kbd className="flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono-accent text-[10px]">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>

              {showJobs && (
                <Link
                  href="/jobs"
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    pathname === "/jobs"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80",
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  Jobs
                </Link>
              )}
              <Tooltip label="View source on GitHub" className="hidden sm:inline-flex">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-border/80"
                  aria-label="GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
              </Tooltip>
              <button
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {open && (
            <nav className="md:hidden flex flex-col gap-0.5 pb-3 animate-fade-in-up border-t border-border/50 mt-1 pt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  openCommand();
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                Search tools
                <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono-accent text-[10px]">⌘K</kbd>
              </button>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                All Tools
              </Link>
              {cats.map((cat) => {
                const meta = categoryMeta[cat];
                if (!meta) return null;
                return (
                  <Link
                    key={cat}
                    href={`/#${cat}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
                    {meta.label}
                  </Link>
                );
              })}
              {showJobs && (
                <Link
                  href="/jobs"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <History className="h-4 w-4" />
                  Jobs
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <ScrollToTop />

      <footer className="mt-16 border-t border-border/80 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
            {/* Brand column */}
            <div className="max-w-sm">
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <span className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                  <Logo size={34} />
                </span>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Omni<span className="text-gradient">Kit</span>
                </span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A self-hosted personal toolkit — {totalTools} fast utilities for images, PDFs, and
                everyday tasks. Processed in your browser or in memory, never stored on a server.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Private by default", "In-memory", "Self-hostable"].map((tag) => (
                  <span
                    key={tag}
                    className="font-mono-accent rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tool category columns */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 lg:gap-x-14">
              {cats.map((cat) => {
                const meta = categoryMeta[cat];
                if (!meta) return null;
                const catTools = tools.filter((t) => t.category === cat && !t.comingSoon).slice(0, 5);
                return (
                  <div key={cat} className="min-w-[8rem]">
                    <p className="flex items-center gap-1.5 font-mono-accent text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </p>
                    <ul className="mt-3.5 space-y-2.5">
                      {catTools.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/tools/${t.id}`}
                            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {t.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Resources column */}
              <div className="min-w-[8rem]">
                <p className="font-mono-accent text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  Resources
                </p>
                <ul className="mt-3.5 space-y-2.5">
                  <li>
                    <button
                      onClick={openCommand}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Search tools (⌘K)
                    </button>
                  </li>
                  {showJobs && (
                    <li>
                      <Link href="/jobs" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                        Jobs
                      </Link>
                    </li>
                  )}
                  <li>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Github className="h-3.5 w-3.5" /> Source code
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono-accent text-[11px] text-muted-foreground/60">
              © {new Date().getFullYear()} OmniKit · processed in-memory · nothing stored
            </p>
            <div className="flex items-center gap-4">
              <Link href="/" className="font-mono-accent text-[11px] uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground">
                Home
              </Link>
              <span className="font-mono-accent text-[11px] text-muted-foreground/40">·</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-accent text-[11px] uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
