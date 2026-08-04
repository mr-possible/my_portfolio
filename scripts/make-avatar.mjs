/**
 * Downscales the source portrait into the avatar the homepage actually serves.
 *
 * The source is a 1815x1699 JPEG (~1.2MB) that was being served raw and
 * rendered at 112x112 — a megabyte of download for a thumbnail, on the
 * homepage's LCP path. This emits a 224x224 WebP (2x for retina) instead.
 *
 * Kept as a script rather than an astro:assets import because the avatar is
 * referenced by path from siteConfig (and from JSON-LD, where it must be an
 * absolute URL), not imported as a module.
 *
 * Run with: npm run avatar
 */
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const SRC = 'assets/dp-source.jpg';
const OUT = 'public/images/dp.webp';

/** Rendered at 112px; 2x covers retina without paying for more. */
const SIZE = 224;

const { width, height } = await sharp(SRC).metadata();
// sharp's metadata().size is only populated for buffer inputs, not file paths.
const kb = async (path) => ((await stat(path)).size / 1024).toFixed(0);
const srcKB = await kb(SRC);

// Square-crop from the centre before resizing so the portrait isn't squashed.
const side = Math.min(width, height);
await sharp(SRC)
  .extract({
    left: Math.round((width - side) / 2),
    top: Math.round((height - side) / 2),
    width: side,
    height: side,
  })
  .resize(SIZE, SIZE, { kernel: 'lanczos3' })
  .webp({ quality: 82 })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log(
  `wrote ${OUT} (${out.width}x${out.height}, ${await kb(OUT)}KB from ${srcKB}KB)`
);
