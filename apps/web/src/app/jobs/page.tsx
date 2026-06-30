"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Job } from "@omnikit/shared";
import { getToolById } from "@omnikit/shared";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";

type JobsResponse = { jobs: Job[]; disabled?: boolean };

async function fetchJobs(): Promise<JobsResponse> {
  const response = await fetch("/api/jobs", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load jobs");
  return response.json();
}

export default function JobsPage() {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 10_000,
  });

  const jobs = data?.jobs ?? [];
  const disabled = data?.disabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recent jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Async jobs from background remover, video, and Spotify tools.
        </p>
      </div>

      {disabled && (
        <Card className="p-6 text-sm text-muted-foreground">
          Downloaders and the background remover require the self-hosted Python worker. They are
          disabled on this deployment. Run the full stack with{" "}
          <code className="text-primary">docker compose up</code> to enable them.
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading jobs...</p>}
      {error && (
        <p className="text-sm text-destructive">
          Failed to load jobs. Restart the web app if this keeps happening.
        </p>
      )}
      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">Refreshing...</p>
      )}

      <div className="space-y-3">
        {jobs.length === 0 && !isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">No jobs yet.</Card>
        ) : (
          jobs.map((job) => {
            const tool = getToolById(job.toolId);
            return (
              <Card key={job.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{tool?.name ?? job.toolId}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.createdAt)} · {job.progress}%
                  </p>
                  {job.error && <p className="mt-1 text-xs text-destructive">{job.error}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{job.status}</Badge>
                  {job.status === "completed" && job.resultFilename && (
                    <Link href={`/api/jobs/${job.id}/download`} className="text-sm text-primary hover:underline">
                      Download
                    </Link>
                  )}
                  <Link href={`/tools/${job.toolId}`} className="text-sm text-muted-foreground hover:text-foreground">
                    Open tool
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
