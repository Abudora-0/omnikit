"use client";

import { useState } from "react";
import { Check, Copy, Wand2, Minimize2, AlertTriangle } from "lucide-react";
import { Button, Label, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const run = (minify: boolean) => {
    setError(null);
    if (!input.trim()) {
      setError("Paste some JSON first.");
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard", variant: "success", duration: 1800 });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>JSON input</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"hello":"world"}'
          className="min-h-[180px] font-mono-accent text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run(false)}>
          <Wand2 className="h-4 w-4" /> Beautify
        </Button>
        <Button type="button" variant="outline" onClick={() => run(true)}>
          <Minimize2 className="h-4 w-4" /> Minify
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-l-destructive bg-destructive/10 px-4 py-3 font-mono-accent text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {output && (
        <div className="space-y-2 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Label>Result</Label>
            <Button type="button" variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="thin-scroll max-h-[420px] overflow-auto border border-border bg-card p-4 font-mono-accent text-xs leading-relaxed">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
