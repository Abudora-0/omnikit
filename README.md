# OmniKit

OmniKit is a self-hosted, all-in-one web toolkit for personal use. It combines image tools, PDF utilities, AI background removal, video downloaders, and Spotify downloads in one dashboard.

## Features

- **Image tools:** convert, resize, compress, crop, rotate, flip, grayscale, blur, watermark, strip metadata, color adjust
- **PDF tools:** merge, split, rotate, delete pages, images→PDF, page numbers, watermark, extract text, PDF→images
- **Utilities:** QR code generator, JSON formatter, hash generator
- **Background remover** *(self-host only)*: powered by `rembg`
- **Video downloader** *(self-host only)*: YouTube and social URLs via `yt-dlp`
- **Spotify downloader** *(self-host only)*: tracks, albums, and playlists via `spotdl`

Image, PDF, and utility tools are processed **entirely in memory** — uploads are never written to disk — so they run anywhere, including serverless (Vercel). The downloaders and AI background remover require the self-hosted Python worker and are gated behind `NEXT_PUBLIC_ENABLE_DOWNLOADS=1`.

## Deploy to Vercel (image + PDF + utilities)

The downloaders/bg-remover can't run on Vercel (no persistent worker, no Redis, serverless filesystem), but the rest of the toolkit is fully Vercel-ready.

1. Import the repo into Vercel and set **Root Directory** to `apps/web`.
2. Vercel auto-detects pnpm + Next.js. Leave `NEXT_PUBLIC_ENABLE_DOWNLOADS` **unset** (downloaders stay hidden).
3. Set `MAX_FILE_SIZE_MB=4` — Vercel serverless functions cap request bodies at ~4.5 MB. (Self-hosting has no such limit.)
4. Deploy. No database or worker required.

## Legal disclaimer

Downloader tools are provided for **personal, self-hosted use only**. Downloading content from YouTube, social platforms, or Spotify may violate those services' Terms of Service and applicable copyright laws. You are responsible for how you use these features.

Image and PDF tools process files locally on your server and carry no third-party ToS concerns.

## Quick start (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

1. Copy environment defaults:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Open [http://localhost:3000](http://localhost:3000)

If you see `docker : The term 'docker' is not recognized`, Docker is not installed. Use the **Windows local setup** below instead.

## Quick start (Windows, no Docker)

1. Open PowerShell in the project folder:

```powershell
cd "D:\Code\Summer Projects\omnikit"
.\scripts\start-local.ps1
```

2. Open [http://localhost:3000](http://localhost:3000)

**Image and PDF tools work immediately.** Async tools (background remover, video, Spotify) also need:

- **Redis** on port 6379 — install [Memurai](https://www.memurai.com/get-memurai) (Redis-compatible for Windows), or run Redis in WSL
- The **Python worker** — `start-local.ps1` opens this automatically when Redis is detected

Manual start (three terminals):

```powershell
# Terminal 1 — web app
cd "D:\Code\Summer Projects\omnikit"
npx pnpm@9.15.4 install
npx pnpm@9.15.4 dev

# Terminal 2 — worker (after Redis is running)
cd "D:\Code\Summer Projects\omnikit\services\worker"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python worker.py
```

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Redis
- ffmpeg (for video/audio tools)

### Setup

```bash
pnpm install
cd services/worker
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Start Redis locally, then run:

```bash
# Terminal 1
pnpm dev

# Terminal 2
cd services/worker
python worker.py
```

Set these env vars for local runs:

```env
REDIS_URL=redis://127.0.0.1:6379/0
STORAGE_PATH=./data/storage
MAX_CONCURRENT_JOBS=2
JOB_TTL_HOURS=24
```

### Cleanup expired files

```bash
curl -X POST http://localhost:3000/api/cleanup
```

Run this on a schedule (e.g. daily cron) to remove uploads and results older than `JOB_TTL_HOURS`.

## Architecture

- `apps/web` — Next.js UI and sync tool APIs (Sharp, pdf-lib)
- `services/worker` — Python worker for async jobs (rembg, yt-dlp, spotdl)
- `packages/shared` — shared tool definitions and Zod schemas
- `redis` — job queue and status storage

Sync tools return files immediately. Async tools create a Redis job, the Python worker processes it, and the UI polls `/api/jobs/:id` until complete.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Redis connection |
| `STORAGE_PATH` | `./data/storage` | Temp uploads and results |
| `MAX_FILE_SIZE_MB` | `100` | Upload size limit |
| `MAX_CONCURRENT_JOBS` | `2` | Async job concurrency |
| `JOB_TTL_HOURS` | `24` | File retention window |

## Troubleshooting

- **Jobs stay pending:** ensure Redis is running and the Python worker is started.
- **Video download fails:** update `yt-dlp` — platforms change frequently.
- **Spotify download fails:** `spotdl` is fragile; verify ffmpeg is installed and try a direct track URL.
- **Background removal is slow:** first run downloads ML models; later runs are faster.

## Project structure

```
omnikit/
├── apps/web/              Next.js frontend + API routes
├── services/worker/       Python async worker
├── packages/shared/       Tool registry and types
├── docker-compose.yml
└── .env.example
```
