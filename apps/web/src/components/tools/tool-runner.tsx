"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { getToolById } from "@omnikit/shared";
import type { Job } from "@omnikit/shared";
import { Download, Loader2, Check, Copy, Play } from "lucide-react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { JobProgress } from "@/components/tools/job-progress";
import { Confetti } from "@/components/ui/confetti";
import { JsonFormatterTool } from "@/components/tools/json-formatter-tool";
import { PdfToImagesTool } from "@/components/tools/pdf-to-images-tool";
import { BgRemoveTool } from "@/components/tools/bg-remove-tool";
import { UrlCodecTool } from "@/components/tools/url-codec-tool";
import { Base64Tool } from "@/components/tools/base64-tool";
import { ColorConverterTool } from "@/components/tools/color-converter-tool";
import { JwtDecoderTool } from "@/components/tools/jwt-decoder-tool";
import { RegexTesterTool } from "@/components/tools/regex-tester-tool";
import { MarkdownPreviewTool } from "@/components/tools/markdown-preview-tool";
import { ImageCropTool } from "@/components/tools/image-crop-tool";
import { useRecentTools, loadToolSettings, saveToolSettings } from "@/lib/use-tool-prefs";
import { consumePendingFiles } from "@/lib/file-handoff";
import { useToast } from "@/components/ui/toast";
import { cn, formatBytes } from "@/lib/utils";

type ToolRunnerProps = { toolId: string };

/** Client-side tools render their own dedicated UI (no API round-trip). */
const CLIENT_TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "json-formatter": JsonFormatterTool,
  "pdf-to-images": PdfToImagesTool,
  "bg-remove-client": BgRemoveTool,
  "image-crop": ImageCropTool,
  "url-encode": UrlCodecTool,
  base64: Base64Tool,
  "color-convert": ColorConverterTool,
  "jwt-decode": JwtDecoderTool,
  "regex-tester": RegexTesterTool,
  "markdown-preview": MarkdownPreviewTool,
};

type SyncResultState = {
  kind: "file" | "text";
  filename: string;
  mimeType: string;
  url?: string;
  text?: string;
  size: number;
  beforeUrl?: string;
  beforeSize?: number;
};

async function fetchJob(id: string): Promise<Job> {
  const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch job");
  const data = await response.json();
  return data.job;
}

export function ToolRunner({ toolId }: ToolRunnerProps) {
  const tool = getToolById(toolId);
  if (!tool) notFound();

  // Client-side tools render their own dedicated UI (no API round-trip).
  const ClientComponent = tool.clientSide ? CLIENT_TOOL_COMPONENTS[tool.id] : undefined;
  if (ClientComponent) {
    return (
      <ToolShell tool={tool}>
        <ClientComponent />
      </ToolShell>
    );
  }

  return <GenericToolRunner tool={tool} />;
}

type Tool = NonNullable<ReturnType<typeof getToolById>>;

function GenericToolRunner({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResultState | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [jobConfetti, setJobConfetti] = useState(0);
  const lastUrl = useRef<string | null>(null);
  const lastBeforeUrl = useRef<string | null>(null);
  const { toast } = useToast();
  const prevJobStatus = useRef<string | null>(null);

  const defaults = useMemo(() => {
    return Object.fromEntries(
      tool.inputs
        .filter((input) => input.defaultValue !== undefined)
        .map((input) => [input.id, String(input.defaultValue)]),
    );
  }, [tool]);

  // Only persist "settings"-like inputs (selects/numbers) — not text/url content.
  const persistIds = useMemo(
    () => new Set(tool.inputs.filter((i) => i.type === "select" || i.type === "number").map((i) => i.id)),
    [tool],
  );
  const settingsToolRef = useRef<string | null>(null);

  // Restore the tool's last-used options on mount / when switching tools.
  useEffect(() => {
    const saved = loadToolSettings(tool.id);
    const restored = Object.fromEntries(Object.entries(saved).filter(([key]) => persistIds.has(key)));
    setValues(restored);
    settingsToolRef.current = tool.id;
  }, [tool.id, persistIds]);

  // Persist option changes (once the restore for this tool has run).
  useEffect(() => {
    if (settingsToolRef.current !== tool.id) return;
    const toSave = Object.fromEntries(Object.entries(values).filter(([key]) => persistIds.has(key)));
    saveToolSettings(tool.id, toSave);
  }, [values, persistIds, tool.id]);

  // Pick up a file handed off from a global drag-and-drop, if any.
  useEffect(() => {
    const handed = consumePendingFiles();
    if (handed.length === 0) return;
    const fileInput = tool.inputs.find((i) => i.type === "file");
    if (!fileInput) return;
    if (fileInput.multiple) setMultiFiles(handed);
    else setFiles(handed.slice(0, 1));
  }, [tool.id, tool.inputs]);

  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
      if (lastBeforeUrl.current) URL.revokeObjectURL(lastBeforeUrl.current);
    };
  }, []);

  const mergedValues = { ...defaults, ...values };

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2500;
    },
  });

  // Toast once when an async job settles.
  useEffect(() => {
    const status = jobQuery.data?.status;
    if (!status || status === prevJobStatus.current) return;
    if (status === "completed" && prevJobStatus.current) {
      toast({ title: "Download ready", description: `${tool.name} finished.`, variant: "success" });
      setJobConfetti((n) => n + 1);
    } else if (status === "failed" && prevJobStatus.current) {
      toast({ title: "Job failed", description: jobQuery.data?.error ?? "The worker reported an error.", variant: "error" });
    }
    prevJobStatus.current = status;
  }, [jobQuery.data?.status, jobQuery.data?.error, tool.name, toast]);

  const validate = (): string | null => {
    for (const input of tool.inputs) {
      if (input.type === "file" && input.multiple) {
        if (multiFiles.length < 1) return `Please add ${input.label.toLowerCase()}.`;
        continue;
      }
      if (input.type === "file") {
        if (!files[0]) return `Please upload ${input.label.toLowerCase()}.`;
        continue;
      }
      if (input.required !== false && !mergedValues[input.id]?.trim()) {
        return `${input.label} is required.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setJobId(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    for (const input of tool.inputs) {
      if (input.type === "file") {
        if (input.multiple) multiFiles.forEach((f) => formData.append(input.id, f));
        else if (files[0]) formData.append(input.id, files[0]);
      } else {
        formData.append(input.id, mergedValues[input.id] ?? "");
      }
    }

    try {
      const response = await fetch(`/api/tools/${tool.id}`, { method: "POST", body: formData });
      const contentType = response.headers.get("content-type") || "";

      if (tool.mode === "async") {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        if (data.job?.id) setJobId(data.job.id);
        else throw new Error("Job was not created");
        return;
      }

      // Sync: success streams binary; errors come back as JSON.
      if (!response.ok || contentType.includes("application/json")) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Processing failed");
      }

      const filename = decodeURIComponent(response.headers.get("x-result-filename") || "result");
      const kind = (response.headers.get("x-result-kind") as "file" | "text") || "file";
      const blob = await response.blob();

      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);

      if (kind === "text") {
        setResult({ kind: "text", filename, mimeType: contentType, text: await blob.text(), size: blob.size });
      } else {
        const url = URL.createObjectURL(blob);
        lastUrl.current = url;
        const inputImage = files[0];
        const showCompare =
          inputImage && inputImage.type.startsWith("image/") && contentType.startsWith("image/");
        if (lastBeforeUrl.current) URL.revokeObjectURL(lastBeforeUrl.current);
        const beforeUrl = showCompare ? URL.createObjectURL(inputImage) : undefined;
        lastBeforeUrl.current = beforeUrl ?? null;
        setResult({
          kind: "file",
          filename,
          mimeType: contentType,
          url,
          size: blob.size,
          beforeUrl,
          beforeSize: showCompare ? inputImage.size : undefined,
        });
      }
      toast({ title: "Ready!", description: `${tool.name} finished — ${formatBytes(blob.size)}.`, variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast({ title: "Couldn’t process that", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!result?.text) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    toast({ title: "Copied to clipboard", variant: "success", duration: 1800 });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolShell tool={tool}>
      {tool.disclaimer && <Alert>{tool.disclaimer}</Alert>}
      {tool.mode === "async" && (
        <Alert>
          Requires the self-hosted worker. Run{" "}
          <code className="text-primary">docker compose up</code> with{" "}
          <code className="text-primary">NEXT_PUBLIC_ENABLE_DOWNLOADS=1</code>.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-6">
        {tool.inputs.map((input) => {
          if (input.type === "file" && input.multiple) {
            return (
              <Field key={input.id} label={input.label} help={input.help}>
                <FileDropzone
                  files={multiFiles}
                  onChange={setMultiFiles}
                  multiple
                  accept={
                    tool.category === "pdf" && tool.id === "pdf-merge"
                      ? { "application/pdf": [".pdf"] }
                      : tool.id === "images-to-pdf"
                        ? { "image/*": [] }
                        : undefined
                  }
                />
              </Field>
            );
          }
          if (input.type === "file") {
            return (
              <Field key={input.id} label={input.label} help={input.help}>
                <FileDropzone
                  files={files}
                  onChange={setFiles}
                  accept={
                    tool.category === "pdf"
                      ? { "application/pdf": [".pdf"] }
                      : { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".tiff", ".tif", ".bmp", ".heic", ".heif", ".svg"] }
                  }
                />
              </Field>
            );
          }
          if (input.type === "select") {
            return (
              <Field key={input.id} label={input.label} htmlFor={input.id} help={input.help}>
                <Select
                  id={input.id}
                  value={mergedValues[input.id] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [input.id]: e.target.value }))}
                >
                  {(input.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          }
          if (input.type === "number") {
            return (
              <Field key={input.id} label={input.label} htmlFor={input.id} help={input.help}>
                <Input
                  id={input.id}
                  type="number"
                  step="any"
                  min={input.min}
                  max={input.max}
                  value={mergedValues[input.id] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [input.id]: e.target.value }))}
                />
              </Field>
            );
          }
          if (input.type === "text") {
            return (
              <Field key={input.id} label={input.label} htmlFor={input.id} help={input.help}>
                <Textarea
                  id={input.id}
                  placeholder={input.placeholder}
                  value={mergedValues[input.id] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [input.id]: e.target.value }))}
                />
              </Field>
            );
          }
          return (
            <Field key={input.id} label={input.label} htmlFor={input.id} help={input.help}>
              <Input
                id={input.id}
                type="url"
                placeholder={input.placeholder}
                value={mergedValues[input.id] ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, [input.id]: e.target.value }))}
              />
            </Field>
          );
        })}

        <Button type="submit" size="lg" disabled={loading} className={cn("w-full sm:w-auto", loading && "animate-pulse-glow")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? "Processing…" : tool.mode === "sync" ? "Process" : "Start job"}
        </Button>
      </form>

      {error && tool.mode === "sync" && <Alert variant="destructive">{error}</Alert>}

      {/* Sync result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="relative space-y-4 overflow-visible rounded-lg border border-success/30 bg-card p-5 shadow-[0_24px_60px_-30px_hsl(var(--success)/0.5)]"
        >
          <Confetti />
          <div className="flex items-center justify-between">
            <p className="font-mono-accent flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-success">
              <span className="animate-pop-in flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                <Check className="h-3 w-3" />
              </span>
              Ready · {formatBytes(result.size)}
            </p>
            {result.kind === "text" ? (
              <Button type="button" variant="ghost" size="sm" onClick={copyText}>
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            ) : null}
          </div>

          {result.kind === "file" && result.mimeType.startsWith("image/") && (
            <div className="space-y-3">
              {result.beforeUrl ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <figure className="space-y-1.5">
                      <figcaption className="font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground">
                        before
                      </figcaption>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.beforeUrl}
                        alt="before"
                        className="w-full rounded-md border border-border bg-[repeating-conic-gradient(#2a2a30_0%_25%,#1c1c22_0%_50%)] bg-[length:18px_18px] object-contain"
                      />
                    </figure>
                    <figure className="space-y-1.5">
                      <figcaption className="font-mono-accent text-[10px] uppercase tracking-widest text-primary">
                        after
                      </figcaption>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.url}
                        alt="after"
                        className="w-full rounded-md border border-primary/40 bg-[repeating-conic-gradient(#2a2a30_0%_25%,#1c1c22_0%_50%)] bg-[length:18px_18px] object-contain"
                      />
                    </figure>
                  </div>
                  {result.beforeSize !== undefined && (
                    <SizeComparison before={result.beforeSize} after={result.size} />
                  )}
                </>
              ) : (
                <figure className="space-y-1">
                  <figcaption className="font-mono-accent text-[10px] uppercase tracking-widest text-primary">
                    result
                  </figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.url} alt="result" className="w-full rounded-md border border-border" />
                </figure>
              )}
            </div>
          )}

          {result.kind === "text" && (
            <pre className="thin-scroll max-h-[360px] overflow-auto rounded-md border border-border bg-background p-4 font-mono-accent text-xs leading-relaxed">
              {result.text}
            </pre>
          )}

          <a
            href={result.kind === "text" ? `data:${result.mimeType},${encodeURIComponent(result.text || "")}` : result.url}
            download={result.filename}
            onClick={() => toast({ title: "Download started", description: result.filename, variant: "info", duration: 2000 })}
            className="sheen relative inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.8)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Download {result.filename}
          </a>
        </motion.div>
      )}

      {tool.mode === "async" && (
        <div className="relative overflow-visible">
          {jobConfetti > 0 && <Confetti key={jobConfetti} />}
          <JobProgress job={jobQuery.data ?? null} isLoading={loading || jobQuery.isLoading} error={error} />
        </div>
      )}
    </ToolShell>
  );
}

const categoryAccentTop: Record<string, string> = {
  image:    "from-sky-500/20 to-transparent",
  pdf:      "from-rose-500/20 to-transparent",
  download: "from-emerald-500/20 to-transparent",
  audio:    "from-fuchsia-500/20 to-transparent",
  utility:  "from-primary/20 to-transparent",
};

const categoryBorderTop: Record<string, string> = {
  image:    "border-t-sky-500/60",
  pdf:      "border-t-rose-500/60",
  download: "border-t-emerald-500/60",
  audio:    "border-t-fuchsia-500/60",
  utility:  "border-t-primary/60",
};

const categoryTextColor: Record<string, string> = {
  image:    "text-sky-400",
  pdf:      "text-rose-400",
  download: "text-emerald-400",
  audio:    "text-fuchsia-400",
  utility:  "text-primary",
};

const CATEGORY_LABELS_LOCAL: Record<string, string> = {
  image: "Images", pdf: "PDF", download: "Downloads", audio: "Audio", utility: "Utilities",
};

function ToolShell({ tool, children }: { tool: NonNullable<ReturnType<typeof getToolById>>; children: React.ReactNode }) {
  const accentTop = categoryAccentTop[tool.category] ?? "from-primary/20 to-transparent";
  const borderTop = categoryBorderTop[tool.category] ?? "border-primary/50";
  const textColor = categoryTextColor[tool.category] ?? "text-primary";
  const { recordTool } = useRecentTools();

  useEffect(() => {
    recordTool(tool.id);
  }, [tool.id, recordTool]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Home</a>
        <span>/</span>
        <a href={`/#${tool.category}`} className={cn("hover:text-foreground transition-colors", textColor)}>
          {CATEGORY_LABELS_LOCAL[tool.category] ?? tool.category}
        </a>
        <span>/</span>
        <span className="text-foreground/70">{tool.name}</span>
      </nav>

      {/* Tool header with category accent */}
      <div className={cn("relative overflow-hidden rounded-lg border border-t-2 border-border bg-card px-6 py-6", borderTop)}>
        {/* Gradient overlay */}
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50", accentTop)} />
        <div className="relative">
          <p className={cn("font-mono-accent text-[10px] uppercase tracking-[0.2em] mb-2", textColor)}>
            {tool.category} / {tool.id}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      {children}
    </motion.div>
  );
}

function SizeComparison({ before, after }: { before: number; after: number }) {
  const delta = before > 0 ? ((after - before) / before) * 100 : 0;
  const smaller = after < before;
  const pct = before > 0 ? Math.min(100, (after / before) * 100) : 100;
  return (
    <div className="rounded-md border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-mono-accent text-muted-foreground">
          {formatBytes(before)} <span className="opacity-50">before</span>
        </span>
        <span
          className={cn(
            "font-mono-accent font-semibold",
            smaller ? "text-success" : delta === 0 ? "text-muted-foreground" : "text-amber-400",
          )}
        >
          {delta === 0 ? "no change" : `${smaller ? "−" : "+"}${Math.abs(delta).toFixed(0)}%`}
        </span>
        <span className="font-mono-accent text-foreground">
          {formatBytes(after)} <span className="opacity-50">after</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700", smaller ? "bg-success" : "bg-amber-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help && <p className="font-mono-accent text-[10px] tracking-wide text-muted-foreground/70">{help}</p>}
    </div>
  );
}
