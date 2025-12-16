/**
 * Pre-compress large static assets for production.
 * Creates .gz versions of files that can be served directly
 * without runtime compression overhead.
 * 
 * Uses Bun's built-in gzip: https://bun.sh/docs/api/utils#bun-gzipsync
 */
import { join } from "node:path";

const DIST_DIR = join(import.meta.dir, "..", "dist");

// Files to pre-compress (relative to dist/)
const ASSETS_TO_COMPRESS = [
  "tanaki-animation.glb",
];

async function compressAssets() {
  console.log("[compress] Starting asset compression...");

  for (const assetPath of ASSETS_TO_COMPRESS) {
    const fullPath = join(DIST_DIR, assetPath);
    const gzPath = `${fullPath}.gz`;

    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      console.log(`[compress] Skipping ${assetPath} (not found)`);
      continue;
    }

    const originalSize = file.size;
    console.log(`[compress] Compressing ${assetPath} (${(originalSize / 1024 / 1024).toFixed(2)} MB)...`);

    const content = await file.arrayBuffer();
    const compressed = Bun.gzipSync(new Uint8Array(content), { level: 9 });

    await Bun.write(gzPath, compressed);

    const compressedSize = compressed.byteLength;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(
      `[compress] Created ${assetPath}.gz: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${ratio}% reduction)`
    );
  }

  console.log("[compress] Done!");
}

compressAssets().catch((err) => {
  console.error("[compress] Error:", err);
  process.exit(1);
});

