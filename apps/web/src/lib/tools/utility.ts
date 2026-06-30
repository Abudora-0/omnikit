import { createHash } from "crypto";
import QRCode from "qrcode";

export type UtilityResult =
  | { kind: "file"; buffer: Buffer; mimeType: string }
  | { kind: "text"; text: string };

export async function generateQr(text: string, size: number, ecc: string): Promise<UtilityResult> {
  const width = Math.min(2048, Math.max(64, Math.round(size)));
  const level = (["L", "M", "Q", "H"].includes(ecc) ? ecc : "M") as "L" | "M" | "Q" | "H";
  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    width,
    errorCorrectionLevel: level,
    margin: 2,
    color: { dark: "#000000ff", light: "#ffffffff" },
  });
  return { kind: "file", buffer, mimeType: "image/png" };
}

const ALGOS = new Set(["md5", "sha1", "sha256", "sha512"]);

export function generateHash(text: string, algorithm: string): UtilityResult {
  const algo = ALGOS.has(algorithm) ? algorithm : "sha256";
  const digest = createHash(algo).update(text, "utf8").digest("hex");
  return { kind: "text", text: digest };
}
