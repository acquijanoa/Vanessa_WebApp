import sharp from "sharp";

export type WatermarkOptions = {
  userLabel: string;
  timestampIso: string;
};

/**
 * Server-side dynamic watermark: user name + timestamp overlay.
 * Use for verified client views; pair with short-lived signed URLs in production.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions,
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;

  const text = `${options.userLabel} · ${options.timestampIso}`;
  const svg = `
    <svg width="${width}" height="${height}">
      <style>
        .w { fill: rgba(255,255,255,0.22); font-family: system-ui, sans-serif; font-size: ${Math.max(
          14,
          Math.round(width / 42),
        )}px; }
      </style>
      <text x="50%" y="92%" text-anchor="middle" class="w">${escapeXml(text)}</text>
      <text x="50%" y="50%" text-anchor="middle" transform="rotate(-32 ${width / 2} ${height / 2})" class="w" opacity="0.12">${escapeXml(
        options.userLabel,
      )}</text>
    </svg>
  `;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
