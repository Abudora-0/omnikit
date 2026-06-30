import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getJob } from "@/lib/jobs";
import { getStoragePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = await getJob(id);

  if (!job || job.status !== "completed" || !job.resultFilename) {
    return NextResponse.json({ error: "Result not available" }, { status: 404 });
  }

  const storagePath = getStoragePath();
  const filePath = path.resolve(storagePath, "results", `${id}-${job.resultFilename}`);

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": job.resultMimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${job.resultFilename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
  }
}
