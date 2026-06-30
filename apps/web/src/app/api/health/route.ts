import { NextResponse } from "next/server";
import { isQueueAvailable } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET() {
  const queue = await isQueueAvailable();
  return NextResponse.json({
    ok: true,
    queue: queue.mode,
    message:
      queue.mode === "file"
        ? "Using local file queue (Redis not required). Start the Python worker to process async jobs."
        : "Connected to Redis",
  });
}
