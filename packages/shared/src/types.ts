import { z } from "zod";

export const toolCategories = [
  "image",
  "pdf",
  "download",
  "audio",
  "utility",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

export const jobStatuses = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export const toolInputTypes = ["file", "url", "text", "select", "number"] as const;
export type ToolInputType = (typeof toolInputTypes)[number];

export const ToolInputSchema = z.object({
  id: z.string(),
  type: z.enum(toolInputTypes),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
  multiple: z.boolean().optional(),
  accept: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  help: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  defaultValue: z.union([z.string(), z.number()]).optional(),
});

export type ToolInput = z.infer<typeof ToolInputSchema>;

export const OmniToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(toolCategories),
  mode: z.enum(["sync", "async"]),
  icon: z.string(),
  inputs: z.array(ToolInputSchema),
  disclaimer: z.string().optional(),
  comingSoon: z.boolean().optional(),
  /** Async tools that require the self-hosted Python worker; hidden on Vercel. */
  selfHostOnly: z.boolean().optional(),
  /** Runs entirely in the browser (no API round-trip), e.g. pdf-to-images. */
  clientSide: z.boolean().optional(),
  /** Short tagline shown on the tool card / runner header. */
  badge: z.string().optional(),
});

export type OmniTool = z.infer<typeof OmniToolSchema>;

export const CreateJobSchema = z.object({
  toolId: z.string(),
  payload: z.record(z.unknown()),
});

export type CreateJobRequest = z.infer<typeof CreateJobSchema>;

export const JobSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  status: z.enum(jobStatuses),
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
  error: z.string().optional(),
  resultFilename: z.string().optional(),
  resultMimeType: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().optional(),
});

export type Job = z.infer<typeof JobSchema>;

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  image: "Image Tools",
  pdf: "PDF Tools",
  download: "Video Download",
  audio: "Audio Download",
  utility: "Utilities",
};

export const CATEGORY_DESCRIPTIONS: Record<ToolCategory, string> = {
  image: "Convert, resize, crop, watermark, and more — all in your browser",
  pdf: "Merge, split, rotate, watermark, and transform PDF documents",
  download: "Download videos from YouTube, Instagram, TikTok, Twitter/X, and more",
  audio: "Download Spotify tracks or extract MP3 audio from YouTube, SoundCloud, TikTok, and more",
  utility: "QR codes, hashing, JSON, Base64, color, JWT, regex, and Markdown — all in your browser",
};
