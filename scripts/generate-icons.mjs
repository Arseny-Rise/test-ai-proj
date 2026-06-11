import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

async function createPng(size) {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563eb"/>
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial,sans-serif" font-size="${size * 0.42}" font-weight="700" fill="white">✓</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

async function main() {
  try {
    await import("sharp");
  } catch {
    console.log("sharp not installed, skipping icon generation");
    return;
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "icon-192.png"), await createPng(192));
  await writeFile(join(outDir, "icon-512.png"), await createPng(512));
  console.log("Icons generated");
}

main();
