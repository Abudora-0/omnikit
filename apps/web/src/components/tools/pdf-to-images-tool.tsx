"use client";

import { useState } from "react";
import { Loader2, Download, Images } from "lucide-react";
import { Button, Label, Select, Alert } from "@/components/ui/primitives";
import { FileDropzone } from "@/components/tools/file-dropzone";

async function renderPdfToZip(file: File, scale: number, onProgress: (p: string) => void): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is served same-origin from /public (copied by scripts/copy-pdf-worker.mjs).
  // Nothing — not even the worker script — is fetched from a third party.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  for (let i = 1; i <= doc.numPages; i++) {
    onProgress(`Rendering page ${i} of ${doc.numPages}…`);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser");

    const task = page.render({ canvasContext: ctx, viewport });
    // Guard against a stalled rasterization (e.g. a throttled background tab) so
    // the UI never spins forever.
    let timer: ReturnType<typeof setTimeout>;
    await Promise.race([
      task.promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          task.cancel();
          reject(new Error(`Page ${i} timed out while rendering. Try a lower resolution or keep this tab focused.`));
        }, 60_000);
      }),
    ]).finally(() => clearTimeout(timer));

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render page"))), "image/png"),
    );
    zip.file(`page-${String(i).padStart(3, "0")}.png`, blob);
    canvas.width = canvas.height = 0;
  }

  await doc.cleanup();
  onProgress("Packaging ZIP…");
  return zip.generateAsync({ type: "blob" });
}

export function PdfToImagesTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [scale, setScale] = useState("2");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);

  const run = async () => {
    setError(null);
    setResult(null);
    if (!files[0]) {
      setError("Please add a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const blob = await renderPdfToZip(files[0], Number(scale), setStatus);
      const name = files[0].name.replace(/\.pdf$/i, "") + "-images.zip";
      setResult({ url: URL.createObjectURL(blob), name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert PDF");
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-5">
      <Alert>Runs entirely in your browser — your PDF never leaves this device.</Alert>

      <div className="space-y-2">
        <Label>PDF file</Label>
        <FileDropzone files={files} onChange={setFiles} accept={{ "application/pdf": [".pdf"] }} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scale">Resolution</Label>
        <Select id="scale" value={scale} onChange={(e) => setScale(e.target.value)}>
          <option value="1">Standard (1×)</option>
          <option value="2">High (2×)</option>
          <option value="3">Ultra (3×)</option>
        </Select>
      </div>

      <Button type="button" onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Images className="h-4 w-4" />}
        {busy ? "Converting…" : "Convert to images"}
      </Button>

      {busy && status && (
        <p className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground">{status}</p>
      )}
      {error && <Alert variant="destructive">{error}</Alert>}

      {result && (
        <div className="space-y-3 border border-border bg-card p-5 animate-fade-in-up">
          <p className="text-sm text-muted-foreground">Your images are ready.</p>
          <a
            href={result.url}
            download={result.name}
            className="inline-flex h-10 items-center justify-center gap-2 bg-primary px-4 font-mono-accent text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Download ZIP
          </a>
        </div>
      )}
    </div>
  );
}
