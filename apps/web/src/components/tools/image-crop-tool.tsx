"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop as CropIcon, Download, RotateCcw, Scissors } from "lucide-react";
import { Button, Alert, Label, Select } from "@/components/ui/primitives";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Rect = { x: number; y: number; w: number; h: number };
type Handle = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type OutFormat = "png" | "jpeg" | "webp";
const FORMATS: { value: OutFormat; label: string; mime: string; ext: string }[] = [
  { value: "png", label: "PNG (lossless)", mime: "image/png", ext: "png" },
  { value: "jpeg", label: "JPEG", mime: "image/jpeg", ext: "jpg" },
  { value: "webp", label: "WebP", mime: "image/webp", ext: "webp" },
];

const MIN_SIZE = 24; // minimum crop box in display px

const HANDLES: { id: Handle; className: string; cursor: string }[] = [
  { id: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { id: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { id: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { id: "e", className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { id: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
  { id: "s", className: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { id: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { id: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function ImageCropTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [display, setDisplay] = useState({ w: 0, h: 0 }); // rendered img size
  const [natural, setNatural] = useState({ w: 0, h: 0 }); // intrinsic img size
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [format, setFormat] = useState<OutFormat>("png");
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ mode: Handle; startX: number; startY: number; start: Rect } | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  const file = files[0] ?? null;

  // Build / tear down the object URL for the selected file.
  useEffect(() => {
    if (!file) {
      setSrcUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    setResult(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  // Measure the rendered image and reset the crop box to a centered 70%.
  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    setDisplay({ w, h });
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setRect({ x: w * 0.15, y: h * 0.15, w: w * 0.7, h: h * 0.7 });
  }, []);

  // Keep the overlay aligned if the container resizes.
  useEffect(() => {
    if (!srcUrl) return;
    const onResize = () => {
      const img = imgRef.current;
      if (!img || !img.clientWidth) return;
      setDisplay((prev) => {
        const w = img.clientWidth;
        const h = img.clientHeight;
        if (prev.w === 0) return prev;
        // Scale the existing rect proportionally to the new display size.
        const sx = w / prev.w;
        const sy = h / prev.h;
        setRect((r) => ({ x: r.x * sx, y: r.y * sy, w: r.w * sx, h: r.h * sy }));
        return { w, h };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [srcUrl]);

  const startDrag = (mode: Handle) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { mode, startX: e.clientX, startY: e.clientY, start: { ...rect } };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const { w: DW, h: DH } = display;
      let { x, y, w, h } = d.start;

      if (d.mode === "move") {
        x = clamp(d.start.x + dx, 0, DW - w);
        y = clamp(d.start.y + dy, 0, DH - h);
      } else {
        let left = d.start.x;
        let top = d.start.y;
        let right = d.start.x + d.start.w;
        let bottom = d.start.y + d.start.h;
        if (d.mode.includes("w")) left = clamp(d.start.x + dx, 0, right - MIN_SIZE);
        if (d.mode.includes("n")) top = clamp(d.start.y + dy, 0, bottom - MIN_SIZE);
        if (d.mode.includes("e")) right = clamp(d.start.x + d.start.w + dx, left + MIN_SIZE, DW);
        if (d.mode.includes("s")) bottom = clamp(d.start.y + d.start.h + dy, top + MIN_SIZE, DH);
        x = left;
        y = top;
        w = right - left;
        h = bottom - top;
      }
      setRect({ x, y, w, h });
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [display]);

  const scaleX = display.w ? natural.w / display.w : 1;
  const scaleY = display.h ? natural.h / display.h : 1;
  const cropPx = {
    w: Math.round(rect.w * scaleX),
    h: Math.round(rect.h * scaleY),
    x: Math.round(rect.x * scaleX),
    y: Math.round(rect.y * scaleY),
  };

  const doCrop = () => {
    const img = imgRef.current;
    if (!img || cropPx.w < 1 || cropPx.h < 1) return;
    const fmt = FORMATS.find((f) => f.value === format)!;
    const canvas = document.createElement("canvas");
    canvas.width = cropPx.w;
    canvas.height = cropPx.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff"; // JPEG has no alpha — flatten onto white
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, cropPx.x, cropPx.y, cropPx.w, cropPx.h, 0, 0, cropPx.w, cropPx.h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast({ title: "Crop failed", description: "Could not render the image.", variant: "error" });
          return;
        }
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const base = (file?.name ?? "image").replace(/\.[^.]+$/, "");
        setResult({ url, size: blob.size, name: `${base}-cropped.${fmt.ext}` });
        toast({ title: "Cropped!", description: `${cropPx.w}×${cropPx.h} · ${formatBytes(blob.size)}`, variant: "success" });
      },
      fmt.mime,
      format === "png" ? undefined : 0.92,
    );
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setRect({ x: 0, y: 0, w: 0, h: 0 });
  };

  return (
    <div className="space-y-5">
      <Alert>
        Drag the box to move it, or pull any handle to resize — then crop. Everything runs in your
        browser; the image never leaves your device.
      </Alert>

      {!srcUrl && (
        <FileDropzone
          files={files}
          onChange={setFiles}
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp"] }}
        />
      )}

      {srcUrl && (
        <div className="space-y-4">
          {/* Crop stage */}
          <div className="flex justify-center rounded-lg border border-border bg-background/60 p-4">
            <div className="relative inline-block select-none leading-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={srcUrl}
                alt="to crop"
                onLoad={measure}
                draggable={false}
                className="block max-h-[60vh] max-w-full"
              />

              {display.w > 0 && (
                <div
                  className="absolute cursor-move border border-primary shadow-[0_0_0_9999px_hsl(var(--background)/0.62)]"
                  style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                  onPointerDown={startDrag("move")}
                >
                  {/* Rule-of-thirds guides */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
                    <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
                    <div className="absolute top-1/3 left-0 w-full h-px bg-white/30" />
                    <div className="absolute top-2/3 left-0 w-full h-px bg-white/30" />
                  </div>

                  {/* Resize handles */}
                  {HANDLES.map((handle) => (
                    <span
                      key={handle.id}
                      onPointerDown={startDrag(handle.id)}
                      style={{ cursor: handle.cursor }}
                      className={cn(
                        "absolute h-3 w-3 rounded-[2px] border border-background bg-primary shadow",
                        handle.className,
                      )}
                    />
                  ))}

                  {/* Live dimensions */}
                  <span className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 font-mono-accent text-[10px] font-medium text-primary-foreground">
                    {cropPx.w} × {cropPx.h}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full space-y-2 sm:max-w-[14rem]">
              <Label htmlFor="crop-format">Output format</Label>
              <Select id="crop-format" value={format} onChange={(e) => setFormat(e.target.value as OutFormat)}>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={doCrop}>
                <Scissors className="h-4 w-4" /> Crop image
              </Button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 font-mono-accent text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 rounded-lg border border-success/30 bg-card p-5 animate-fade-in-up">
          <p className="font-mono-accent flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-success">
            <CropIcon className="h-3.5 w-3.5" /> Cropped · {cropPx.w}×{cropPx.h} · {formatBytes(result.size)}
          </p>
          <figure className="space-y-1.5">
            <figcaption className="font-mono-accent text-[10px] uppercase tracking-widest text-primary">result</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt="cropped result"
              className="max-h-[50vh] w-auto rounded-md border border-border bg-[repeating-conic-gradient(#2a2a30_0%_25%,#1c1c22_0%_50%)] bg-[length:18px_18px]"
            />
          </figure>
          <a
            href={result.url}
            download={result.name}
            className="sheen relative inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.8)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Download {result.name}
          </a>
        </div>
      )}
    </div>
  );
}
