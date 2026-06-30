"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, AlertTriangle } from "lucide-react";
import { Button, Label, Textarea } from "@/components/ui/primitives";
import { CopyButton } from "@/components/tools/copy-button";
import { cn } from "@/lib/utils";

type Mode = "encode" | "decode";

// Unicode-safe Base64 (handles emoji / non-Latin).
function encodeB64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeB64(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null as string | null };
    try {
      return { output: mode === "encode" ? encodeB64(input) : decodeB64(input), error: null };
    } catch {
      return { output: "", error: "That isn’t valid Base64." };
    }
  }, [input, mode]);

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-md border border-border bg-secondary/40 p-1">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded px-4 py-1.5 text-xs font-medium capitalize transition-all",
              mode === m
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label>{mode === "encode" ? "Plain text" : "Base64"}</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Hello, OmniKit! 🚀" : "SGVsbG8sIE9tbmlLaXQhIPCfmoA="}
          className="min-h-[120px] font-mono-accent text-xs"
        />
      </div>

      <div className="flex justify-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setMode((m) => (m === "encode" ? "decode" : "encode"))}>
          <ArrowRightLeft className="h-4 w-4" /> Swap direction
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border-l-2 border-l-destructive bg-destructive/10 px-4 py-3 font-mono-accent text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {output && (
        <div className="space-y-2 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Label>{mode === "encode" ? "Base64" : "Decoded"}</Label>
            <CopyButton value={output} />
          </div>
          <pre className="thin-scroll max-h-[320px] overflow-auto rounded-md border border-border bg-card p-4 font-mono-accent text-xs leading-relaxed break-all whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
