"use client";

import { motion } from "framer-motion";
import { Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Job } from "@omnikit/shared";
import { Alert, Badge, ProgressBar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type JobProgressProps = {
  job: Job | null;
  isLoading?: boolean;
  error?: string | null;
};

export function JobProgress({ job, isLoading, error }: JobProgressProps) {
  if (error) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  if (isLoading && !job) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Starting job…
      </div>
    );
  }

  if (!job) return null;

  const done = job.status === "completed";
  const failed = job.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "space-y-4 rounded-lg border bg-card p-5",
        done ? "border-success/30" : failed ? "border-destructive/30" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {done ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : failed ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <div>
            <p className="font-mono-accent text-xs font-semibold uppercase tracking-widest">Job status</p>
            <p className="text-sm text-muted-foreground">{job.message ?? "Processing…"}</p>
          </div>
        </div>
        <Badge variant={failed ? "outline" : "default"}>{job.status}</Badge>
      </div>

      {!done && !failed && <ProgressBar value={job.progress} />}

      {job.error && <Alert variant="destructive">{job.error}</Alert>}

      {done && job.resultFilename && (
        <a
          href={`/api/jobs/${job.id}/download`}
          className="sheen relative inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.8)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </motion.div>
  );
}
