"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, Download, Sparkles, RotateCcw, ChevronsLeftRight } from "lucide-react";
import { Button, Alert, ProgressBar } from "@/components/ui/primitives";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type BgMode = "transparent" | "white" | "black" | "custom";

const BG_OPTIONS: { id: BgMode; label: string; preview: string }[] = [
  { id: "transparent", label: "Transparent", preview: "repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 12px 12px" },
  { id: "white",       label: "White",       preview: "#ffffff" },
  { id: "black",       label: "Black",       preview: "#000000" },
  { id: "custom",      label: "Custom",      preview: "" },
];

async function flattenWithBackground(pngUrl: string, color: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = pngUrl;
  });
}

export function BgRemoveTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    pngUrl: string;
    name: string;
    size: number;
    beforeUrl: string;
  } | null>(null);
  const [bgMode, setBgMode] = useState<BgMode>("transparent");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [sliderX, setSliderX] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pngBlobRef = useRef<Blob | null>(null);

  // Preview URL for the selected-but-not-yet-processed file
  const previewUrl = files[0] ? URL.createObjectURL(files[0]) : null;

  const getSliderX = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setSliderX(getSliderX(e));
  }, [getSliderX]);

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent | TouchEvent) => setSliderX(getSliderX(e));
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [isDragging, getSliderX]);

  const run = async () => {
    setError(null);
    setResult(null);
    setProgress(0);
    if (!files[0]) { setError("Please add an image file."); return; }
    setBusy(true);
    const beforeUrl = URL.createObjectURL(files[0]);
    try {
      setStatusText("Loading AI model…");
      const { removeBackground } = await import("@imgly/background-removal");
      setStatusText("Analysing image…");
      const blob = await removeBackground(files[0], {
        progress: (key, current, total) => {
          if (key === "compute:inference") {
            const pct = Math.round((current / total) * 100);
            setProgress(pct);
            setStatusText(`Processing… ${pct}%`);
          }
        },
      });
      pngBlobRef.current = blob;
      const pngUrl = URL.createObjectURL(blob);
      const name = files[0].name.replace(/\.[^.]+$/, "") + "-nobg.png";
      setResult({ pngUrl, name, size: blob.size, beforeUrl });
      setProgress(100);
      setSliderX(50);
    } catch (err) {
      URL.revokeObjectURL(beforeUrl);
      setError(err instanceof Error ? err.message : "Background removal failed");
    } finally {
      setBusy(false);
      setStatusText("");
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
    pngBlobRef.current = null;
  };

  const handleDownload = async () => {
    if (!result) return;
    let src = result.pngUrl;
    if (bgMode !== "transparent") {
      const color = bgMode === "custom" ? customColor : bgMode === "white" ? "#ffffff" : "#000000";
      src = await flattenWithBackground(result.pngUrl, color);
    }
    const a = document.createElement("a");
    a.href = src;
    a.download = bgMode === "transparent" ? result.name : result.name.replace("-nobg", `-${bgMode}`);
    a.click();
  };

  const bgForPreview =
    bgMode === "transparent"
      ? "repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 14px 14px"
      : bgMode === "white"
        ? "#ffffff"
        : bgMode === "black"
          ? "#000000"
          : customColor;

  return (
    <div className="space-y-5">
      <Alert>
        Runs entirely in your browser using WebAssembly — your image never leaves this device. Model weights (~50 MB)
        are downloaded from CDN on first use and cached automatically.
      </Alert>

      {!result && (
        <>
          <FileDropzone
            files={files}
            onChange={setFiles}
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif", ".tiff", ".gif"] }}
          />

          {/* Thumbnail preview before processing */}
          {files[0] && !busy && previewUrl && (
            <div className="relative border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="preview" className="max-h-64 w-full object-contain bg-secondary" />
            </div>
          )}

          {/* Processing state */}
          {busy && files[0] && previewUrl && (
            <div className="relative border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="processing" className="max-h-64 w-full object-contain bg-secondary opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-mono-accent text-xs uppercase tracking-widest text-foreground">{statusText}</p>
              </div>
            </div>
          )}

          {busy && (
            <div className="space-y-1.5">
              <ProgressBar value={progress} />
              <p className="font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground">
                {progress > 0 ? `${progress}% complete` : "Initialising…"}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="button" onClick={run} disabled={busy || !files[0]}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Processing…" : "Remove background"}
            </Button>
            {files[0] && !busy && (
              <button
                type="button"
                onClick={reset}
                className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Result panel */}
      {result && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Success header */}
          <div className="flex items-center justify-between">
            <p className="font-mono-accent text-xs font-semibold uppercase tracking-widest text-emerald-400">
              ✓ Ready · {formatBytes(result.size)}
            </p>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 font-mono-accent text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New image
            </button>
          </div>

          {/* Before / After comparison slider */}
          <div className="space-y-1.5">
            <p className="font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ChevronsLeftRight className="h-3 w-3" />
              Drag to compare
            </p>
            <div
              ref={containerRef}
              className={cn(
                "relative border border-border overflow-hidden select-none",
                isDragging ? "cursor-col-resize" : "cursor-col-resize",
              )}
              style={{ background: bgForPreview }}
              onMouseDown={onMouseDown}
              onTouchStart={onMouseDown}
            >
              {/* After image (full) — shown as the base */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.pngUrl}
                alt="result"
                className="w-full block"
                draggable={false}
              />
              {/* Before image clipped to the right portion */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${sliderX}%)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.beforeUrl}
                  alt="original"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* Divider line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)]"
                style={{ left: `${sliderX}%`, transform: "translateX(-50%)" }}
              >
                {/* Handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-lg flex items-center justify-center">
                  <ChevronsLeftRight className="h-4 w-4 text-gray-800" />
                </div>
              </div>

              {/* Labels */}
              <span className="absolute bottom-2 left-2 font-mono-accent text-[9px] uppercase tracking-widest bg-black/60 text-white px-1.5 py-0.5 pointer-events-none">
                After
              </span>
              <span className="absolute bottom-2 right-2 font-mono-accent text-[9px] uppercase tracking-widest bg-black/60 text-white px-1.5 py-0.5 pointer-events-none">
                Before
              </span>
            </div>
          </div>

          {/* Background options */}
          <div className="space-y-2">
            <p className="font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground">
              Background fill
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBgMode(opt.id)}
                  className={cn(
                    "flex items-center gap-2 border px-2.5 py-1.5 font-mono-accent text-[10px] uppercase tracking-widest transition-colors",
                    bgMode === opt.id
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  )}
                >
                  {opt.id !== "custom" && (
                    <span
                      className="h-3 w-3 border border-white/20"
                      style={{ background: opt.preview }}
                    />
                  )}
                  {opt.label}
                </button>
              ))}
              {bgMode === "custom" && (
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer border border-border bg-transparent p-0.5"
                  title="Pick background color"
                />
              )}
            </div>
          </div>

          {/* Download */}
          <Button type="button" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download{bgMode !== "transparent" ? ` (${bgMode === "custom" ? customColor : bgMode} bg)` : " PNG"}
          </Button>
        </div>
      )}
    </div>
  );
}
