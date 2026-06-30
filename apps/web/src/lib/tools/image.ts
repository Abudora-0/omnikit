import sharp from "sharp";

export type ImageResult = { buffer: Buffer; ext: string; mimeType: string };

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  tiff: "image/tiff",
  gif: "image/gif",
};

function mimeFor(ext: string): string {
  return MIME[ext] ?? `image/${ext}`;
}

/** Normalize a Sharp-detected format to one we can re-encode. */
function normalizeFormat(format?: string): "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" {
  switch (format) {
    case "jpeg":
    case "jpg":
      return "jpeg";
    case "webp":
      return "webp";
    case "avif":
    case "heif":
      return "avif";
    case "tiff":
      return "tiff";
    case "gif":
      return "gif";
    default:
      return "png";
  }
}

async function encode(
  pipeline: sharp.Sharp,
  format: string,
  quality?: number,
): Promise<ImageResult> {
  const q = quality ? Math.min(100, Math.max(1, Math.round(quality))) : undefined;
  let p = pipeline;
  let ext = format;

  switch (format) {
    case "png":
      p = p.png({ compressionLevel: 9 });
      ext = "png";
      break;
    case "jpg":
    case "jpeg":
      p = p.jpeg({ quality: q ?? 90, mozjpeg: true });
      ext = "jpg";
      break;
    case "webp":
      p = p.webp({ quality: q ?? 90 });
      ext = "webp";
      break;
    case "avif":
      p = p.avif({ quality: q ?? 60 });
      ext = "avif";
      break;
    case "tiff":
      p = p.tiff({ quality: q ?? 90 });
      ext = "tiff";
      break;
    case "gif":
      p = p.gif();
      ext = "gif";
      break;
    default:
      p = p.png();
      ext = "png";
  }

  const buffer = await p.toBuffer();
  return { buffer, ext, mimeType: mimeFor(ext) };
}

/** Base pipeline: auto-orient from EXIF so portrait photos aren't sideways. */
function base(input: Buffer): sharp.Sharp {
  return sharp(input, { failOn: "none" }).rotate();
}

async function originalFormat(input: Buffer): Promise<ReturnType<typeof normalizeFormat>> {
  const meta = await sharp(input).metadata();
  return normalizeFormat(meta.format);
}

export async function convertImage(input: Buffer, format: string, quality?: number): Promise<ImageResult> {
  const fmt = format === "jpg" ? "jpeg" : format;
  return encode(base(input), fmt, quality);
}

export async function resizeImage(
  input: Buffer,
  width: number,
  height: number,
  mode: string,
): Promise<ImageResult> {
  const fit = mode === "exact" ? "fill" : mode === "cover" ? "cover" : "inside";
  const pipeline = base(input).resize(Math.max(1, width), Math.max(1, height), {
    fit,
    withoutEnlargement: false,
  });
  return encode(pipeline, await originalFormat(input));
}

export async function compressImage(input: Buffer, quality: number): Promise<ImageResult> {
  const fmt = await originalFormat(input);
  // PNG is lossless; route it through webp-style palette compression instead.
  if (fmt === "png") {
    const buffer = await base(input)
      .png({ compressionLevel: 9, quality: Math.min(100, Math.max(1, quality)), palette: true })
      .toBuffer();
    return { buffer, ext: "png", mimeType: "image/png" };
  }
  return encode(base(input), fmt, quality);
}

export async function cropImage(
  input: Buffer,
  left: number,
  top: number,
  width: number,
  height: number,
): Promise<ImageResult> {
  const meta = await base(input).metadata();
  const imgW = meta.width ?? 0;
  const imgH = meta.height ?? 0;
  const l = Math.max(0, Math.min(left, imgW - 1));
  const t = Math.max(0, Math.min(top, imgH - 1));
  const w = Math.max(1, Math.min(width, imgW - l));
  const h = Math.max(1, Math.min(height, imgH - t));
  const pipeline = base(input).extract({ left: l, top: t, width: w, height: h });
  return encode(pipeline, await originalFormat(input));
}

export async function rotateImage(input: Buffer, angle: number): Promise<ImageResult> {
  // Two passes: chaining .rotate().rotate(angle) in one pipeline drops the explicit
  // angle, so auto-orient to a buffer first, then rotate that by the requested angle.
  const oriented = await sharp(input, { failOn: "none" }).rotate().toBuffer();
  const fmt = await originalFormat(input);
  const pipeline = sharp(oriented).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  // Preserve transparency for non-multiple-of-90 angles that introduce corners.
  return encode(pipeline, fmt === "jpeg" ? "png" : fmt);
}

export async function flipImage(input: Buffer, direction: string): Promise<ImageResult> {
  let pipeline = base(input);
  if (direction === "horizontal" || direction === "both") pipeline = pipeline.flop();
  if (direction === "vertical" || direction === "both") pipeline = pipeline.flip();
  return encode(pipeline, await originalFormat(input));
}

export async function grayscaleImage(input: Buffer): Promise<ImageResult> {
  return encode(base(input).grayscale(), await originalFormat(input));
}

export async function blurImage(input: Buffer, sigma: number): Promise<ImageResult> {
  const s = Math.min(60, Math.max(0.3, sigma));
  return encode(base(input).blur(s), await originalFormat(input));
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] ?? c),
  );
}

const GRAVITY: Record<string, string> = {
  "bottom-right": "southeast",
  "bottom-left": "southwest",
  "top-right": "northeast",
  "top-left": "northwest",
  center: "center",
};

export async function watermarkImage(
  input: Buffer,
  text: string,
  position: string,
  opacity: number,
): Promise<ImageResult> {
  const oriented = await base(input).toBuffer();
  const meta = await sharp(oriented).metadata();
  const W = meta.width ?? 800;
  const H = meta.height ?? 600;
  const fontSize = Math.max(18, Math.round(Math.min(W, H) / 18));
  const pad = Math.round(fontSize * 0.6);
  const boxW = Math.min(W, Math.round(text.length * fontSize * 0.62) + pad * 2);
  const boxH = fontSize + pad * 2;
  const op = Math.min(1, Math.max(0.05, opacity / 100));

  const svg = `<svg width="${boxW}" height="${boxH}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700"
      fill="#ffffff" fill-opacity="${op}" stroke="#000000" stroke-opacity="${op * 0.5}" stroke-width="1">${escapeXml(text)}</text>
  </svg>`;

  const buffer = await sharp(oriented)
    .composite([{ input: Buffer.from(svg), gravity: GRAVITY[position] ?? "southeast" }])
    .toBuffer();
  const fmt = normalizeFormat(meta.format);
  return encode(sharp(buffer), fmt);
}

export async function stripMetadataImage(input: Buffer): Promise<ImageResult> {
  // base() auto-orients then re-encodes WITHOUT withMetadata(), dropping EXIF/GPS.
  return encode(base(input), await originalFormat(input));
}

export async function adjustImage(
  input: Buffer,
  brightness: number,
  saturation: number,
  hue: number,
): Promise<ImageResult> {
  const pipeline = base(input).modulate({
    brightness: Math.min(3, Math.max(0.2, brightness)),
    saturation: Math.min(3, Math.max(0, saturation)),
    hue: Math.round(hue),
  });
  return encode(pipeline, await originalFormat(input));
}

export async function removeWatermark(
  input: Buffer,
  left: number,
  top: number,
  width: number,
  height: number,
): Promise<ImageResult> {
  const oriented = await base(input).toBuffer();
  const meta = await sharp(oriented).metadata();
  const imgW = meta.width ?? 0;
  const imgH = meta.height ?? 0;

  // Clamp region to image bounds.
  const l = Math.max(0, Math.min(Math.round(left), imgW - 1));
  const t = Math.max(0, Math.min(Math.round(top), imgH - 1));
  const w = Math.max(1, Math.min(Math.round(width), imgW - l));
  const h = Math.max(1, Math.min(Math.round(height), imgH - t));

  // Extract the region, scale it up slightly to blur across boundaries, then
  // shrink back and apply a heavy blur — effectively smears surrounding pixels
  // into the watermark area.
  const patch = await sharp(oriented)
    .extract({ left: l, top: t, width: w, height: h })
    .blur(Math.max(20, Math.min(w, h) / 2))
    .toBuffer();

  const result = await sharp(oriented)
    .composite([{ input: patch, left: l, top: t }])
    .toBuffer();

  const fmt = normalizeFormat(meta.format);
  return encode(sharp(result), fmt);
}
