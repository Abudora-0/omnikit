// Copies the pdf.js worker into /public so the PDF-to-Images tool can load it
// same-origin (no CDN dependency, keeps processing fully local). Runs on
// predev/prebuild so the worker version always matches the installed package.
import { copyFileSync, mkdirSync } from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkgPath = require.resolve("pdfjs-dist/package.json");
const src = path.join(path.dirname(pkgPath), "build", "pdf.worker.min.mjs");
const destDir = path.join(process.cwd(), "public");
const dest = path.join(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-pdf-worker] ${src} -> ${dest}`);
