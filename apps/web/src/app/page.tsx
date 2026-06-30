"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getAvailableTools, downloadsEnabled } from "@omnikit/shared";
import { ToolSearch } from "@/components/tools/tool-search";
import { QuickAccess } from "@/components/tools/quick-access";
import { CountUp } from "@/components/ui/count-up";
import { OPEN_COMMAND_EVENT } from "@/components/command-palette";
import { Cpu, Shield, Server, ArrowRight, Search, Sparkles } from "lucide-react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: EASE },
});

export default function HomePage() {
  const tools = getAvailableTools();
  const toolCount = tools.filter((t) => !t.comingSoon).length;
  const categoryCount = [...new Set(tools.map((t) => t.category))].length;

  const openCommand = () => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/60"
      >
        {/* Dot-grid accent */}
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
        {/* Brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--brand-2) / 0.5), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--brand-3) / 0.45), transparent 70%)" }}
        />
        {/* Top hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />

        <div className="relative px-8 py-14 sm:py-20">
          <motion.div {...fade(0.05)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 font-mono-accent text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              self-hosted toolkit
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.12)}
            className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            One kit for
            <br />
            <span className="text-gradient">every quick fix.</span>
          </motion.h1>

          <motion.p {...fade(0.2)} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{toolCount} tools</span> for images, PDFs
            {downloadsEnabled() ? ", video, and audio" : " and utilities"} — fast, private, processed in memory.
            No accounts, no upload limits, nothing stored.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.28)} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#image"
              className="sheen relative inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.8)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Browse tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={openCommand}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Quick search
              <kbd className="ml-1 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono-accent text-[10px]">⌘K</kbd>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div {...fade(0.36)} className="mt-10 flex flex-wrap gap-6">
            {[
              { value: toolCount, label: "tools" },
              { value: categoryCount, label: "categories" },
              { value: 0, label: "files stored" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  <CountUp value={value} />
                </span>
                <span className="font-mono-accent text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Feature chips */}
          <motion.div {...fade(0.44)} className="mt-8 flex flex-wrap gap-2">
            {[
              { Icon: Cpu, text: "In-memory processing" },
              { Icon: Shield, text: "Private by default" },
              { Icon: Server, text: "Self-hostable" },
            ].map(({ Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <QuickAccess />

      <ToolSearch />

      <div className="border-t border-border pt-5">
        <p className="font-mono-accent text-[11px] uppercase tracking-widest text-muted-foreground/70">
          ⚠ downloader tools are for personal use only — may violate third-party ToS.
          {downloadsEnabled() && (
            <>
              {" "}
              <Link href="/jobs" className="text-primary hover:underline">
                view jobs →
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
