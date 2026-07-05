import type { OmniTool } from "./types";

export const TOOLS: OmniTool[] = [
  // ─────────────────────────────────────────────  IMAGE  ──────────
  {
    id: "image-convert",
    name: "Image Converter",
    description: "Convert between PNG, JPG, WebP, and AVIF formats",
    category: "image",
    mode: "sync",
    icon: "Image",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      {
        id: "format",
        type: "select",
        label: "Output format",
        required: true,
        defaultValue: "webp",
        options: [
          { label: "WebP", value: "webp" },
          { label: "PNG", value: "png" },
          { label: "JPEG", value: "jpeg" },
          { label: "AVIF", value: "avif" },
          { label: "TIFF", value: "tiff" },
          { label: "GIF", value: "gif" },
        ],
      },
      {
        id: "quality",
        type: "number",
        label: "Quality (1–100)",
        required: false,
        defaultValue: 90,
        min: 1,
        max: 100,
        help: "Ignored for PNG (lossless)",
      },
    ],
  },
  {
    id: "image-resize",
    name: "Image Resize",
    description: "Resize images by exact dimensions or fit-to-box",
    category: "image",
    mode: "sync",
    icon: "Maximize2",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "width", type: "number", label: "Width (px)", required: true, defaultValue: 800, min: 1 },
      { id: "height", type: "number", label: "Height (px)", required: true, defaultValue: 600, min: 1 },
      {
        id: "mode",
        type: "select",
        label: "Resize mode",
        required: true,
        defaultValue: "fit",
        options: [
          { label: "Fit inside (keep aspect ratio)", value: "fit" },
          { label: "Exact (stretch to size)", value: "exact" },
          { label: "Cover (crop to fill)", value: "cover" },
        ],
      },
    ],
  },
  {
    id: "image-compress",
    name: "Image Compress",
    description: "Reduce file size while keeping acceptable quality",
    category: "image",
    mode: "sync",
    icon: "Minimize2",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "quality", type: "number", label: "Quality (1–100)", required: true, defaultValue: 75, min: 1, max: 100 },
    ],
  },
  {
    id: "image-crop",
    name: "Image Crop",
    description: "Drag a box over your image to crop it visually — no typing coordinates",
    category: "image",
    mode: "sync",
    clientSide: true,
    icon: "Crop",
    inputs: [{ id: "file", type: "file", label: "Image file", required: true }],
  },
  {
    id: "image-rotate",
    name: "Image Rotate",
    description: "Rotate an image by any angle",
    category: "image",
    mode: "sync",
    icon: "RotateCw",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      {
        id: "angle",
        type: "select",
        label: "Angle",
        required: true,
        defaultValue: "90",
        options: [
          { label: "90° clockwise", value: "90" },
          { label: "180°", value: "180" },
          { label: "270° clockwise", value: "270" },
        ],
      },
    ],
  },
  {
    id: "image-flip",
    name: "Image Flip",
    description: "Mirror an image horizontally or vertically",
    category: "image",
    mode: "sync",
    icon: "FlipHorizontal2",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      {
        id: "direction",
        type: "select",
        label: "Direction",
        required: true,
        defaultValue: "horizontal",
        options: [
          { label: "Horizontal (mirror)", value: "horizontal" },
          { label: "Vertical (flip)", value: "vertical" },
          { label: "Both", value: "both" },
        ],
      },
    ],
  },
  {
    id: "image-grayscale",
    name: "Grayscale",
    description: "Convert an image to black and white",
    category: "image",
    mode: "sync",
    icon: "Contrast",
    inputs: [{ id: "file", type: "file", label: "Image file", required: true }],
  },
  {
    id: "image-blur",
    name: "Image Blur",
    description: "Apply a Gaussian blur to an image",
    category: "image",
    mode: "sync",
    icon: "Aperture",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "sigma", type: "number", label: "Strength (0.3–60)", required: true, defaultValue: 8, min: 0.3, max: 60 },
    ],
  },
  {
    id: "image-watermark",
    name: "Image Watermark",
    description: "Stamp text over an image",
    category: "image",
    mode: "sync",
    icon: "Stamp",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "text", type: "text", label: "Watermark text", required: true, placeholder: "© OmniKit" },
      {
        id: "position",
        type: "select",
        label: "Position",
        required: true,
        defaultValue: "bottom-right",
        options: [
          { label: "Bottom right", value: "bottom-right" },
          { label: "Bottom left", value: "bottom-left" },
          { label: "Top right", value: "top-right" },
          { label: "Top left", value: "top-left" },
          { label: "Center", value: "center" },
        ],
      },
      { id: "opacity", type: "number", label: "Opacity (1–100)", required: true, defaultValue: 50, min: 1, max: 100 },
    ],
  },
  {
    id: "image-strip-metadata",
    name: "Strip Metadata",
    description: "Remove EXIF, GPS, and other embedded metadata",
    category: "image",
    mode: "sync",
    icon: "Tags",
    inputs: [{ id: "file", type: "file", label: "Image file", required: true }],
  },
  {
    id: "image-adjust",
    name: "Color Adjust",
    description: "Tune brightness, saturation, and hue",
    category: "image",
    mode: "sync",
    icon: "SlidersHorizontal",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "brightness", type: "number", label: "Brightness (0.2–3)", required: true, defaultValue: 1, min: 0.2, max: 3 },
      { id: "saturation", type: "number", label: "Saturation (0–3)", required: true, defaultValue: 1, min: 0, max: 3 },
      { id: "hue", type: "number", label: "Hue shift (°)", required: true, defaultValue: 0, min: -360, max: 360 },
    ],
  },
  {
    id: "watermark-remove",
    name: "Watermark Remover",
    description: "Blur out a rectangular region to erase a watermark or logo",
    category: "image",
    mode: "sync",
    icon: "Eraser",
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      { id: "left", type: "number", label: "Left (x, px)", required: true, defaultValue: 0, min: 0 },
      { id: "top", type: "number", label: "Top (y, px)", required: true, defaultValue: 0, min: 0 },
      { id: "width", type: "number", label: "Region width (px)", required: true, defaultValue: 200, min: 1 },
      { id: "height", type: "number", label: "Region height (px)", required: true, defaultValue: 80, min: 1 },
    ],
  },
  {
    id: "bg-remove-client",
    name: "Background Remover",
    description: "Remove image backgrounds with AI — runs entirely in your browser, nothing uploaded",
    category: "image",
    mode: "sync",
    icon: "Sparkles",
    clientSide: true,
    inputs: [{ id: "file", type: "file", label: "Image file", required: true }],
  },
  {
    id: "bg-remove",
    name: "Background Remover (GPU)",
    description: "Remove image backgrounds using AI — higher quality, requires self-hosted worker",
    category: "image",
    mode: "async",
    icon: "Wand2",
    selfHostOnly: true,
    heavyWorkerOnly: true,
    inputs: [
      { id: "file", type: "file", label: "Image file", required: true },
      {
        id: "model",
        type: "select",
        label: "Model",
        required: true,
        defaultValue: "u2net",
        options: [
          { label: "Fast (u2net)", value: "u2net" },
          { label: "Quality (isnet-general-use)", value: "isnet-general-use" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────  PDF  ──────────
  {
    id: "pdf-merge",
    name: "PDF Merger",
    description: "Combine multiple PDF files into one document",
    category: "pdf",
    mode: "sync",
    icon: "Files",
    inputs: [{ id: "files", type: "file", label: "PDF files", required: true, multiple: true }],
  },
  {
    id: "pdf-split",
    name: "PDF Splitter",
    description: "Extract a page range from a PDF document",
    category: "pdf",
    mode: "sync",
    icon: "Scissors",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      { id: "startPage", type: "number", label: "Start page", required: true, defaultValue: 1, min: 1 },
      { id: "endPage", type: "number", label: "End page", required: true, defaultValue: 1, min: 1 },
    ],
  },
  {
    id: "pdf-rotate",
    name: "PDF Rotate",
    description: "Rotate every page of a PDF",
    category: "pdf",
    mode: "sync",
    icon: "RotateCcw",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      {
        id: "angle",
        type: "select",
        label: "Angle",
        required: true,
        defaultValue: "90",
        options: [
          { label: "90° clockwise", value: "90" },
          { label: "180°", value: "180" },
          { label: "270° clockwise", value: "270" },
        ],
      },
    ],
  },
  {
    id: "pdf-delete-pages",
    name: "Delete PDF Pages",
    description: "Remove specific pages (e.g. 1,3,5-7)",
    category: "pdf",
    mode: "sync",
    icon: "FileMinus",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      { id: "pages", type: "text", label: "Pages to delete", required: true, placeholder: "1,3,5-7" },
    ],
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    description: "Combine JPG/PNG images into a single PDF",
    category: "pdf",
    mode: "sync",
    icon: "FileImage",
    inputs: [
      { id: "files", type: "file", label: "Image files", required: true, multiple: true },
      {
        id: "pageSize",
        type: "select",
        label: "Page size",
        required: true,
        defaultValue: "fit",
        options: [
          { label: "Fit to image", value: "fit" },
          { label: "A4", value: "a4" },
          { label: "Letter", value: "letter" },
        ],
      },
    ],
  },
  {
    id: "pdf-page-numbers",
    name: "Add Page Numbers",
    description: "Stamp page numbers onto a PDF",
    category: "pdf",
    mode: "sync",
    icon: "ListOrdered",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      {
        id: "position",
        type: "select",
        label: "Position",
        required: true,
        defaultValue: "bottom-center",
        options: [
          { label: "Bottom center", value: "bottom-center" },
          { label: "Bottom right", value: "bottom-right" },
          { label: "Bottom left", value: "bottom-left" },
        ],
      },
    ],
  },
  {
    id: "pdf-watermark",
    name: "PDF Watermark",
    description: "Add a diagonal text watermark to every page",
    category: "pdf",
    mode: "sync",
    icon: "Droplets",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      { id: "text", type: "text", label: "Watermark text", required: true, placeholder: "CONFIDENTIAL" },
      { id: "opacity", type: "number", label: "Opacity (1–100)", required: true, defaultValue: 20, min: 1, max: 100 },
    ],
  },
  {
    id: "pdf-extract-text",
    name: "Extract Text",
    description: "Pull all text out of a PDF into a .txt file",
    category: "pdf",
    mode: "sync",
    icon: "FileText",
    inputs: [{ id: "file", type: "file", label: "PDF file", required: true }],
  },
  {
    id: "pdf-to-images",
    name: "PDF to Images",
    description: "Render each PDF page to a PNG (zipped)",
    category: "pdf",
    mode: "sync",
    icon: "Images",
    clientSide: true,
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      {
        id: "scale",
        type: "select",
        label: "Resolution",
        required: true,
        defaultValue: "2",
        options: [
          { label: "Standard (1×)", value: "1" },
          { label: "High (2×)", value: "2" },
          { label: "Ultra (3×)", value: "3" },
        ],
      },
    ],
  },
  {
    id: "pdf-compress",
    name: "Compress PDF",
    description: "Reduce PDF file size by re-compressing embedded images",
    category: "pdf",
    mode: "sync",
    icon: "PackageOpen",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      {
        id: "imageQuality",
        type: "number",
        label: "Image quality (1–100)",
        required: true,
        defaultValue: 70,
        min: 1,
        max: 100,
        help: "Lower = smaller file, but images look worse",
      },
    ],
  },
  {
    id: "pdf-unlock",
    name: "Unlock PDF",
    description: "Remove the password from a PDF you already have access to",
    category: "pdf",
    mode: "sync",
    icon: "LockOpen",
    inputs: [
      { id: "file", type: "file", label: "Password-protected PDF", required: true },
      { id: "password", type: "text", label: "Current password", required: false, placeholder: "Leave blank if unknown (attempts anyway)" },
    ],
  },
  {
    id: "pdf-organize",
    name: "Organize Pages",
    description: "Reorder PDF pages by specifying the new page order",
    category: "pdf",
    mode: "sync",
    icon: "GripVertical",
    inputs: [
      { id: "file", type: "file", label: "PDF file", required: true },
      {
        id: "order",
        type: "text",
        label: "New page order",
        required: true,
        placeholder: "3,1,2,4",
        help: "List all page numbers in the order you want them",
      },
    ],
  },
  {
    id: "pdf-repair",
    name: "Repair PDF",
    description: "Attempt to recover a corrupted or malformed PDF",
    category: "pdf",
    mode: "sync",
    icon: "Wrench",
    inputs: [{ id: "file", type: "file", label: "PDF file", required: true }],
  },

  // ─────────────────────────────────────────────  DOWNLOAD  ──────────
  {
    id: "video-download",
    name: "Video Downloader",
    description: "Download videos from YouTube, TikTok, Instagram, and more",
    category: "download",
    mode: "async",
    icon: "Download",
    selfHostOnly: true,
    disclaimer:
      "For personal use only. Downloading may violate platform Terms of Service. Use at your own risk.",
    inputs: [
      { id: "url", type: "url", label: "Video URL", placeholder: "https://...", required: true },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp4",
        options: [
          { label: "MP4 (video)", value: "mp4" },
          { label: "MP3 (audio only)", value: "mp3" },
        ],
      },
      {
        id: "quality",
        type: "select",
        label: "Quality",
        required: true,
        defaultValue: "best",
        options: [
          { label: "Best available", value: "best" },
          { label: "1080p max", value: "1080" },
          { label: "720p max", value: "720" },
          { label: "480p max", value: "480" },
        ],
      },
    ],
  },
  {
    id: "youtube-download",
    name: "YouTube Downloader",
    description: "Download YouTube videos or audio",
    category: "download",
    mode: "async",
    icon: "Youtube",
    selfHostOnly: true,
    disclaimer:
      "For personal use only. Downloading from YouTube may violate YouTube Terms of Service.",
    inputs: [
      {
        id: "url",
        type: "url",
        label: "YouTube URL",
        placeholder: "https://youtube.com/watch?v=...",
        required: true,
      },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp4",
        options: [
          { label: "MP4", value: "mp4" },
          { label: "MP3", value: "mp3" },
        ],
      },
      {
        id: "quality",
        type: "select",
        label: "Quality",
        required: true,
        defaultValue: "best",
        options: [
          { label: "Best available", value: "best" },
          { label: "1080p max", value: "1080" },
          { label: "720p max", value: "720" },
        ],
      },
    ],
  },
  {
    id: "spotify-download",
    name: "Spotify Downloader",
    description: "Download tracks, albums, or playlists from Spotify links",
    category: "audio",
    mode: "async",
    icon: "Music",
    selfHostOnly: true,
    disclaimer:
      "For personal use only. Spotify content is protected; downloads may be unavailable or lower quality.",
    inputs: [
      {
        id: "url",
        type: "url",
        label: "Spotify URL",
        placeholder: "https://open.spotify.com/track/...",
        required: true,
      },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp3",
        options: [
          { label: "MP3", value: "mp3" },
          { label: "FLAC", value: "flac" },
        ],
      },
    ],
  },

  {
    id: "instagram-download",
    name: "Instagram Downloader",
    description: "Download Reels, posts, and stories from Instagram",
    category: "download",
    mode: "async",
    icon: "Instagram",
    selfHostOnly: true,
    disclaimer: "For personal use only. Downloading may violate Instagram Terms of Service.",
    inputs: [
      { id: "url", type: "url", label: "Instagram URL", placeholder: "https://www.instagram.com/reel/...", required: true },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp4",
        options: [
          { label: "MP4 (video)", value: "mp4" },
          { label: "MP3 (audio only)", value: "mp3" },
        ],
      },
    ],
  },
  {
    id: "tiktok-download",
    name: "TikTok Downloader",
    description: "Download TikTok videos without watermark",
    category: "download",
    mode: "async",
    icon: "Video",
    selfHostOnly: true,
    disclaimer: "For personal use only. Downloading may violate TikTok Terms of Service.",
    inputs: [
      { id: "url", type: "url", label: "TikTok URL", placeholder: "https://www.tiktok.com/@user/video/...", required: true },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp4",
        options: [
          { label: "MP4 (video)", value: "mp4" },
          { label: "MP3 (audio only)", value: "mp3" },
        ],
      },
    ],
  },
  {
    id: "twitter-download",
    name: "Twitter / X Downloader",
    description: "Download videos and GIFs from Twitter / X posts",
    category: "download",
    mode: "async",
    icon: "Twitter",
    selfHostOnly: true,
    disclaimer: "For personal use only. Downloading may violate Twitter/X Terms of Service.",
    inputs: [
      { id: "url", type: "url", label: "Tweet URL", placeholder: "https://x.com/user/status/...", required: true },
      {
        id: "format",
        type: "select",
        label: "Format",
        required: true,
        defaultValue: "mp4",
        options: [
          { label: "MP4 (video)", value: "mp4" },
          { label: "MP3 (audio only)", value: "mp3" },
        ],
      },
    ],
  },
  {
    id: "mp3-download",
    name: "MP3 Downloader",
    description: "Extract audio as MP3 from any YouTube, SoundCloud, TikTok, Instagram, or Twitter URL",
    category: "audio",
    mode: "async",
    icon: "FileAudio",
    selfHostOnly: true,
    disclaimer: "For personal use only. Downloading may violate the platform's Terms of Service.",
    inputs: [
      {
        id: "url",
        type: "url",
        label: "URL",
        placeholder: "https://youtube.com/watch?v=... or any supported link",
        required: true,
      },
      {
        id: "quality",
        type: "select",
        label: "Audio quality",
        required: true,
        defaultValue: "best",
        options: [
          { label: "Best available", value: "best" },
          { label: "320 kbps", value: "320" },
          { label: "192 kbps", value: "192" },
          { label: "128 kbps", value: "128" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────  UTILITY  ──────────
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate a QR code PNG from text or a URL",
    category: "utility",
    mode: "sync",
    icon: "QrCode",
    inputs: [
      { id: "text", type: "text", label: "Text or URL", required: true, placeholder: "https://example.com" },
      { id: "size", type: "number", label: "Size (px)", required: true, defaultValue: 512, min: 64, max: 2048 },
      {
        id: "ecc",
        type: "select",
        label: "Error correction",
        required: true,
        defaultValue: "M",
        options: [
          { label: "Low", value: "L" },
          { label: "Medium", value: "M" },
          { label: "Quartile", value: "Q" },
          { label: "High", value: "H" },
        ],
      },
    ],
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Validate, pretty-print, or minify JSON — instantly in your browser",
    category: "utility",
    mode: "sync",
    icon: "Braces",
    clientSide: true,
    inputs: [{ id: "json", type: "text", label: "JSON input", required: true }],
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes",
    category: "utility",
    mode: "sync",
    icon: "Hash",
    inputs: [
      { id: "text", type: "text", label: "Input text", required: true },
      {
        id: "algorithm",
        type: "select",
        label: "Algorithm",
        required: true,
        defaultValue: "sha256",
        options: [
          { label: "SHA-256", value: "sha256" },
          { label: "SHA-1", value: "sha1" },
          { label: "SHA-512", value: "sha512" },
          { label: "MD5", value: "md5" },
        ],
      },
    ],
  },
  {
    id: "url-encode",
    name: "URL Encoder / Decoder",
    description: "Percent-encode or decode URLs and query strings — instantly in your browser",
    category: "utility",
    mode: "sync",
    icon: "Link2",
    clientSide: true,
    inputs: [{ id: "text", type: "text", label: "Text", required: true }],
  },
  {
    id: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode text to Base64 or decode it back — handles full Unicode",
    category: "utility",
    mode: "sync",
    icon: "Binary",
    clientSide: true,
    inputs: [{ id: "text", type: "text", label: "Text", required: true }],
  },
  {
    id: "color-convert",
    name: "Color Converter",
    description: "Convert colors between HEX, RGB, and HSL with a live preview",
    category: "utility",
    mode: "sync",
    icon: "Palette",
    clientSide: true,
    inputs: [{ id: "color", type: "text", label: "Color", required: true }],
  },
  {
    id: "jwt-decode",
    name: "JWT Decoder",
    description: "Inspect a JSON Web Token's header and payload — no secret key needed",
    category: "utility",
    mode: "sync",
    icon: "KeyRound",
    clientSide: true,
    inputs: [{ id: "token", type: "text", label: "JWT", required: true }],
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions against sample text with live highlighted matches",
    category: "utility",
    mode: "sync",
    icon: "Regex",
    clientSide: true,
    inputs: [{ id: "pattern", type: "text", label: "Pattern", required: true }],
  },
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    description: "Write Markdown and see it rendered live, side by side",
    category: "utility",
    mode: "sync",
    icon: "FileCode",
    clientSide: true,
    inputs: [{ id: "markdown", type: "text", label: "Markdown", required: true }],
  },
];

export function getToolById(id: string): OmniTool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: OmniTool["category"]): OmniTool[] {
  return TOOLS.filter((tool) => tool.category === category);
}

/**
 * Downloaders / bg-remove need the self-hosted Python worker. They are hidden
 * unless NEXT_PUBLIC_ENABLE_DOWNLOADS=1 (set in docker-compose, unset on Vercel).
 */
export function downloadsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DOWNLOADS === "1";
}

/**
 * bg-remove's worker path loads an ONNX model into memory (~200-400MB) — too
 * much for a 1GB free-tier VPS. Defaults to enabled; set to "0" to hide it on
 * low-RAM self-host deployments (the client-side bg-remove-client still works
 * everywhere, since it runs in the browser).
 */
export function heavyWorkerToolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_HEAVY_WORKER_TOOLS !== "0";
}

export function getAvailableTools(): OmniTool[] {
  const downloads = downloadsEnabled();
  const heavy = heavyWorkerToolsEnabled();
  return TOOLS.filter((tool) => {
    if (tool.selfHostOnly && !downloads) return false;
    if (tool.heavyWorkerOnly && !heavy) return false;
    return true;
  });
}
