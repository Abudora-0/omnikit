"use client";

import { useMemo, useState, Fragment } from "react";
import { AlertTriangle } from "lucide-react";
import { Label, Input, Textarea } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const FLAG_OPTIONS = [
  { flag: "g", label: "global" },
  { flag: "i", label: "ignore case" },
  { flag: "m", label: "multiline" },
  { flag: "s", label: "dotall" },
  { flag: "u", label: "unicode" },
];

type MatchInfo = { index: number; length: number; text: string; groups: string[] };

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState("gi");
  const [sample, setSample] = useState("Reach us at hi@omnikit.dev or support@example.com.");

  const { matches, error, segments } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchInfo[], error: null as string | null, segments: null };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid regular expression", segments: null };
    }

    const found: MatchInfo[] = [];
    const segs: { text: string; match: boolean }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(sample)) !== null && guard < 10000) {
      guard++;
      if (m.index > last) segs.push({ text: sample.slice(last, m.index), match: false });
      segs.push({ text: m[0], match: true });
      found.push({ index: m.index, length: m[0].length, text: m[0], groups: m.slice(1) });
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++; // avoid zero-length infinite loop
    }
    if (last < sample.length) segs.push({ text: sample.slice(last), match: false });

    return { matches: found, error: null, segments: segs };
  }, [pattern, flags, sample]);

  const toggleFlag = (flag: string) =>
    setFlags((f) => (f.includes(flag) ? f.replace(flag, "") : f + flag));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Pattern</Label>
        <div className="flex items-center gap-2">
          <span className="font-mono-accent text-sm text-muted-foreground">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="\\b\\w+@\\w+\\.\\w+\\b"
            className="font-mono-accent"
          />
          <span className="font-mono-accent text-sm text-muted-foreground">/{flags}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FLAG_OPTIONS.map(({ flag, label }) => (
          <button
            key={flag}
            type="button"
            onClick={() => toggleFlag(flag)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono-accent text-[11px] transition-all",
              flags.includes(flag)
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {flag} · {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Test string</Label>
        <Textarea
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          className="min-h-[120px] font-mono-accent text-xs"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border-l-2 border-l-destructive bg-destructive/10 px-4 py-3 font-mono-accent text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : pattern ? (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Label>Matches</Label>
            <span className="font-mono-accent text-[11px] text-muted-foreground">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </span>
          </div>
          <div className="thin-scroll max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 font-mono-accent text-xs leading-relaxed">
            {segments && segments.length > 0 ? (
              segments.map((s, i) =>
                s.match ? (
                  <mark key={i} className="rounded bg-primary/25 px-0.5 text-primary-foreground/90 text-foreground">
                    {s.text}
                  </mark>
                ) : (
                  <Fragment key={i}>{s.text}</Fragment>
                ),
              )
            ) : (
              <span className="text-muted-foreground">No matches.</span>
            )}
          </div>

          {matches.some((m) => m.groups.length > 0) && (
            <div className="space-y-1.5">
              {matches.map((m, i) => (
                <div key={i} className="rounded-md border border-border bg-card px-3 py-2 font-mono-accent text-[11px]">
                  <span className="text-primary">{JSON.stringify(m.text)}</span>
                  {m.groups.length > 0 && (
                    <span className="text-muted-foreground">
                      {"  →  groups: "}
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="text-foreground">
                          {gi > 0 ? ", " : ""}
                          {JSON.stringify(g)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
