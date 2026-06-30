# OmniKit — CLAUDE.md

## Project overview
Self-hosted personal web toolkit. Monorepo (pnpm workspaces) with three packages:
- `apps/web` — Next.js 15 frontend (App Router, TypeScript, Tailwind CSS)
- `packages/shared` — shared types, tool definitions, Zod schemas
- `services/worker` — Python FastAPI async worker (background removal, video/Spotify download)

## Architecture

```
User → Next.js (apps/web)
         ├── Sync tools  → API route → registry handler → Sharp/pdf-lib (IN MEMORY)
         │                 → streams result bytes straight back (NOTHING written to disk)
         ├── Client tools → run fully in the browser (json-formatter, pdf-to-images)
         └── Async tools  → API route → Redis/file queue → Python worker (SELF-HOST ONLY)
                                                           ↑
                                            services/worker/worker.py
```

### Tool modes
- **sync**: processed in-memory inside the API route via `lib/tools/registry.ts`. Uploads are read into `Buffer`s, processed, and the result is **streamed back as raw bytes** (`Content-Disposition` + `X-Result-Filename`/`X-Result-Kind` headers). **No `saveUpload`/`saveResult` — nothing touches `data/storage/`.** This makes sync tools Vercel-safe and privacy-preserving.
- **clientSide** (`tool.clientSide`): never hits the API. Each is a dedicated client component wired through the **`CLIENT_TOOL_COMPONENTS` registry map** in `tool-runner.tsx` (id → component). Current set: `json-formatter`, `pdf-to-images`, `bg-remove-client`, `image-crop` (interactive canvas crop — drag/resize a box with the mouse, no server round-trip), plus the text utilities `url-encode`, `base64`, `color-convert`, `jwt-decode`, `regex-tester`, `markdown-preview`. pdf-to-images uses `pdfjs-dist` + `jszip`; the worker is served same-origin from `/public/pdf.worker.min.mjs` (copied by `scripts/copy-pdf-worker.mjs` on predev/prebuild). markdown-preview renders via the dependency-free, XSS-safe `lib/markdown.tsx` (real React nodes, no `dangerouslySetInnerHTML`). To add a clientSide tool: set `clientSide: true`, build the component, register it in the map (no more if-chain branching).
- **async** (`tool.selfHostOnly`): downloaders + bg-remove. Job → queue → Python worker. **Gated behind `NEXT_PUBLIC_ENABLE_DOWNLOADS=1`** — hidden/blocked on Vercel, enabled in Docker. `saveUpload` (disk) is used only on this path.

### Gating (`downloadsEnabled()` in `packages/shared/src/tools.ts`)
`selfHostOnly` tools are filtered out by `getAvailableTools()` and 404/503 from the API/pages when the flag is unset. `NEXT_PUBLIC_*` is inlined at build time, so Docker sets it as a build ARG (see Dockerfile + docker-compose).

## Key files

| File | Purpose |
|------|---------|
| `packages/shared/src/tools.ts` | Single source of truth for tool defs + `downloadsEnabled`/`getAvailableTools` |
| `packages/shared/src/types.ts` | `OmniTool`, `Job`, `ToolInput` Zod schemas (+ `multiple`, `selfHostOnly`, `clientSide`) |
| `apps/web/src/lib/tools/registry.ts` | **`SYNC_HANDLERS` map** — central dispatch for every in-memory sync tool |
| `apps/web/src/lib/tools/image.ts` | Sharp image ops (Buffer in → Buffer out, EXIF auto-rotate) |
| `apps/web/src/lib/tools/pdf.ts` | pdf-lib + pdfjs-dist PDF ops (Buffer-based) |
| `apps/web/src/lib/tools/utility.ts` | qr (qrcode) + hash (crypto) |
| `apps/web/src/app/api/tools/[toolId]/route.ts` | Sync = stream bytes; async = enqueue (gated) |
| `apps/web/src/components/tools/tool-runner.tsx` | Generic form; routes clientSide tools to dedicated components |
| `apps/web/src/components/tools/tool-search.tsx` | Homepage search + category filter + animated grid |
| `apps/web/src/lib/storage.ts` | Disk helpers — **async/self-host path only** |
| `services/worker/app/tools/` | `bg_remove.py`, `video.py` (live progress), `spotify.py` |

## Adding a new tool

1. Add entry to `packages/shared/src/tools.ts` (`id`, `name`, `category`, `mode`, `icon`, `inputs`). Multi-file input → `multiple: true`.
2. **sync** tool: add the handler to `SYNC_HANDLERS` in `lib/tools/registry.ts` (return `{ kind: "file"|"text", buffer/text, filename, mimeType }`); put the actual Sharp/pdf-lib logic in `image.ts`/`pdf.ts`/`utility.ts`.
3. **clientSide** tool: set `clientSide: true`, build a client component, and branch to it in `tool-runner.tsx`.
4. **async** tool: set `selfHostOnly: true`; add Python handler in `services/worker/app/tools/` + register in `tasks.py`.
5. Icons are Lucide names; add to `iconMap` in `src/lib/tool-icons.ts` (shared by the card + command palette).

## UI design system

**Aesthetic:** "Sleek Dark Pro" — Linear/Vercel/Raycast-inspired. Near-black canvas, indigo→violet→cyan brand gradient, fine gradient borders, soft rounded corners, cursor spotlight, smooth springs + staggered reveals. (This replaced the older "industrial workshop / orange / sharp-corner" look.)

### Color tokens (CSS variables in `globals.css`)
- `--primary`: indigo-violet (HSL 252 88% 67%) — accents, active states, CTA buttons
- `--background`: near-black (HSL 240 10% 3.5%)
- `--card`: HSL 240 9% 6.5% · `--border`: HSL 240 7% 15% · `--muted-foreground`: HSL 240 6% 60%
- `--success`: HSL 158 72% 47% (green checks/ready states)
- `--radius`: **0.7rem** (soft rounding, ~11px)
- **Brand gradient stops** `--brand-1/2/3` (indigo / violet / cyan) power `.text-gradient`, the logo, progress bars, and the scroll bar.

### Typography (fonts via `next/font` in `layout.tsx`)
- Body / UI: **Inter** (`--font-sans`, set directly on `body` in globals.css — do NOT rely on a Tailwind `font-sans` utility, the dev CSS cache can serve it stale)
- Mono labels: **JetBrains Mono** via `.font-mono-accent` (references `var(--font-mono)`)
- Technical labels, badges, category codes: `.font-mono-accent`, usually uppercase + wide tracking

### Signature effects (`globals.css`)
- `.spotlight-card` — cursor-following radial wash + masked gradient ring (pointer published as `--mx`/`--my` by `SpotlightCard`). Accent hue comes from `--cat` (set via `cat-{category}` class).
- `.text-gradient` — animated brand-gradient clipped text. `.glass` — blurred translucent surface (nav, command palette).
- Ambient `body::before` aurora drifts via **transform only** (no blur filter — it tanks GPU/compositing). `body::after` is faint SVG noise.
- All infinite animations are gated by `prefers-reduced-motion`.

### Component conventions (`src/components/ui/primitives.tsx`)
- **Soft rounding everywhere** (`rounded-md`/`rounded-lg`); no more sharp-corner rule.
- **Buttons**: primary = solid indigo with `.sheen` hover sweep + soft glow shadow; sentence-case, not uppercase.
- **Inputs/Select/Textarea**: `bg-secondary/40`, focus ring = `ring-4 ring-primary/10` + `border-primary/60`.
- **Badges**: pill (`rounded-full`), bordered; `success` variant added. **ProgressBar**: 2px, rounded, brand-gradient fill.
- **Alert**: rounded + left-border accent (indigo info, red destructive).

### Layout (`app-shell.tsx`)
- Sticky **glass** top nav, no sidebar; framer-motion **scroll-progress bar** (brand gradient) across the top edge.
- Logo: gradient rounded square with a 2×2 module glyph + `Omni`<gradient>`Kit`</gradient> wordmark.
- Nav: full category names with colored dots; **⌘K command-palette trigger**; Jobs (downloads only) + GitHub. Mobile hamburger included.
- Max content width `max-w-7xl`, `px-6`.

### Command palette (`command-palette.tsx`)
- Global ⌘K / Ctrl+K (and the `omnikit:open-command` window event from the nav/hero buttons). Fuzzy-filters all tools + Home/Jobs, full keyboard nav (↑/↓/Enter/Esc), routes via `next/navigation`. Mounted once in `AppShell`.

### Shared UX building blocks
- **Toasts**: `ToastProvider` (mounted in `providers.tsx`) + `useToast()` → `toast({ title, description?, variant: success|error|info, duration? })`. Top-right (below the sticky nav, `top-20`), framer-motion, portal'd. Used for copy/download/result/job feedback + the one-time ⌘K "Pro tip" (gated by `omnikit:seen-tip` in `app-shell.tsx`).
- **Favorites + recents** (`src/lib/use-tool-prefs.ts`): `useFavorites()` (pin star on cards → localStorage `omnikit:favorites`) and `useRecentTools()` (recorded in `ToolShell` on mount → `omnikit:recent`, capped 8). `useSyncExternalStore`-backed so all components stay in sync; SSR snapshot is empty. Surfaced on the home page via **`QuickAccess`** (Pinned + Recently used pill rows) above `ToolSearch`.
- **Delight**: `CountUp` (hero stats — has a hidden-tab `setTimeout` fallback because rAF is throttled in background tabs), `ScrollToTop` FAB (appears after `scrollY>480`, bottom-left to avoid the toast stack), `PageTransition` (enter anim keyed by pathname, wraps `main` children), `Tooltip` (hover/focus, for icon-only nav buttons).
- **Global drag-and-drop** (`components/global-drop.tsx`, mounted in `AppShell`): drop a file anywhere → overlay suggests matching tools by type (image/pdf). Picking one stashes the file via `lib/file-handoff.ts` (`setPendingFiles`/`consumePendingFiles` — a module singleton, since `File`s can't be serialized) and routes to the tool; `GenericToolRunner` consumes it on mount and pre-fills the dropzone. **Suppressed when the current page already has a `[data-omnikit-dropzone]`** (set on `FileDropzone`) so it never fights the in-page dropzone.
- **Tool settings memory** (`loadToolSettings`/`saveToolSettings` in `use-tool-prefs.ts`, key `omnikit:settings:<toolId>`): `GenericToolRunner` restores a tool's last-used **select/number** options on mount and persists changes. Text/url/password fields are intentionally NOT persisted (content, not settings). Restore runs in an effect keyed on `tool.id` (SSR-safe; guarded by `settingsToolRef` so the first empty render doesn't wipe saved values).
- **Before/after compare**: image sync results render the original and result **side by side** (2-col grid, before/after captions) plus a `SizeComparison` bar (before vs after bytes + % change). Only when input+output are both images (`beforeUrl`/`beforeSize` on the result state). (The old draggable wipe `before-after-slider.tsx` is no longer wired into the runner.)
- **Confetti** (`components/ui/confetti.tsx`): one-shot burst that fires on mount inside success panels (sync result + async job-completed, the latter keyed by a `jobConfetti` counter). Inert under `prefers-reduced-motion`. Parent panels need `relative overflow-visible`.

### Tool cards (`tool-card.tsx`)
- `SpotlightCard` wrapper with `cat-{category}` accent; category-tinted rounded icon tile; `local`/`self-host` pill badges; hover lift + arrow reveal; category + mode in footer. No `categoryColor` prop — colors derive from category maps.

## Category colors
| Category | Accent | Hue |
|----------|--------|-----|
| image | `text-sky-400` | Sky/cyan |
| pdf | `text-rose-400` | Rose |
| download | `text-emerald-400` | Emerald |
| audio | `text-fuchsia-400` | Fuchsia |
| utility | `text-primary` | Indigo (brand) |

## Data storage
**Sync + clientSide tools store NOTHING** — they process in memory and stream/return the result. `data/storage/` is used **only by the async/self-host path**:
- `job-index.json` — list of all job IDs + metadata
- `jobs/{id}.json` — individual job state
- `queue/{timestamp}-{id}.json` — pending jobs for worker to pick up
- `uploads/` — input files (async only) · `results/` — worker outputs

Jobs expire: default TTL managed by `/api/cleanup` route (no-ops when downloads disabled).

## Deploying to Vercel
Image + PDF + utility tools are fully Vercel-ready (in-memory, no disk, no worker). Set **Root Directory = `apps/web`**, leave `NEXT_PUBLIC_ENABLE_DOWNLOADS` unset, set `MAX_FILE_SIZE_MB=4` (serverless body cap ~4.5 MB). `output: "standalone"` is gated behind `NEXT_OUTPUT_STANDALONE=1` (Docker only) because it breaks on Windows/Vercel. Config in root `vercel.json`. Downloaders/bg-remove remain Docker-only.

## Running locally

```powershell
# Web only (sync tools work, async tools need worker)
.\apps\web\node_modules\.bin\next.cmd dev  # from apps/web/

# Full stack (Docker)
docker-compose up

# Or manually start Python worker
cd services/worker
python worker.py
```

No global pnpm required — use `apps/web/node_modules/.bin/next.cmd` directly.

## Worker dependencies (Python)
`services/worker/requirements.txt` — key deps: `rembg`, `yt-dlp`, `spotdl`, `pypdf`

## Environment variables
- `apps/web/.env.local` — `WORKER_URL`, `STORAGE_PATH`
- `services/worker/.env` — `STORAGE_PATH`, model cache paths

## Shared package
`packages/shared/src/index.ts` re-exports everything. Import in web as `@omnikit/shared`.
`CATEGORY_LABELS` and `CATEGORY_DESCRIPTIONS` are also exported from `types.ts`.

## Known patterns to follow
- Sync handlers throw plain `Error`s with user-facing messages; the route returns them as JSON 400. Success responses are raw bytes, so the client checks `content-type`/`!response.ok` before treating a sync response as a file.
- Sharp pipelines start with `.rotate()` (EXIF auto-orient). For the explicit rotate tool, orient to a buffer **then** rotate in a second pass (chaining `.rotate().rotate(angle)` drops the angle).
- Never import from `apps/web` into `packages/shared` (shared is zero-dependency on Next); `process.env.NEXT_PUBLIC_*` is OK there (inlined).
- Tool runner polls async jobs via TanStack Query `refetchInterval` — stops on `completed`/`failed`.
- File dropzone handles single + multi-file (`input.multiple`) and shows image thumbnails.
- Animations use `framer-motion` + CSS keyframes in `globals.css`; respect `prefers-reduced-motion`. Use the soft-rounded "Sleek Dark Pro" system (`rounded-md`/`rounded-lg`, indigo brand gradient, spotlight cards) — see the UI design system section.
- Avoid animating large `filter: blur()` layers (e.g. full-screen ambient glows) — animate `transform` instead; blurred animated layers saturate the compositor.
