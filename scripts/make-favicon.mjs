/**
 * Generates the favicon set from assets/logo-portfolio.png.
 *
 * The source is the SD mark photographed on a cream paper field. To get a mark
 * that reads on both light and dark browser chrome we key the cream out by
 * luminance: the paper sits at L 210-250, the metallic letterforms at L 20-200,
 * so a soft ramp between the two separates them.
 *
 * Two things in the source fight that ramp, and each has a stage below:
 *   - a vignette that drags the corner paper down to L~209, close enough to the
 *     ramp to register as logo (handled by locating the mark first)
 *   - a drop shadow and paper grain under the letters, which key to partial
 *     alpha and read as a dusty halo on dark chrome (handled by the cleanup)
 *
 * Run with: npm run favicon
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'assets/logo-portfolio.png';
const OUT = 'public';

/** Only letterform pixels get this dark; the paper bottoms out around L 209. */
const L_MARK_CORE = 150;
/** Slack around the located mark, as a fraction of its bbox, to catch soft edges. */
const LOCATE_PAD = 0.08;
/** Luminance at or below this is fully opaque (letterform). */
const L_OPAQUE = 188;
/** Luminance at or above this is fully transparent (paper). */
const L_CLEAR = 212;
/**
 * Saturation at or below this is paper or silver; at or above it, gold. The
 * gold S peaks at L 210, all but indistinguishable from paper by brightness,
 * so it needs a second key. Measured on the source, paper and silver sit at
 * 0.06-0.11 and gold at 0.33-0.40, with nothing in between.
 */
const SAT_PAPER = 0.16;
const SAT_INK = 0.24;
/** Alpha below this is shadow or grain, not letterform. */
const CRUSH_LO = 0.5;
/** Alpha at or above this is solid letterform. Between the two is the edge ramp. */
const CRUSH_HI = 0.85;
/** Opaque islands smaller than this are grain specks the crush missed. */
const MIN_SPECK_AREA = 200;
/** Enclosed transparent blobs smaller than this are specular highlights, not counters. */
const MIN_COUNTER_AREA = 1500;
/** Padding around the mark, as a fraction of the square canvas. */
const MARGIN = 0.04;
/** Cream matte for apple-touch-icon, sampled from the source paper. */
const CREAM = { r: 240, g: 235, b: 224 };

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const saturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Hermite ramp; flattens to 0 below `lo` and to 1 above `hi`. */
function smoothstep(lo, hi, v) {
  const t = clamp01((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
}

/**
 * Walks the 4-connected region of pixels satisfying `matches`, starting at
 * `seed`. Marks each visited pixel in `seen` and returns the region's pixel
 * indices plus whether it reached the image border.
 */
function floodRegion(seed, W, H, seen, matches) {
  const pixels = [];
  const stack = [seed];
  let touchesBorder = false;
  seen[seed] = 1;

  while (stack.length) {
    const i = stack.pop();
    pixels.push(i);
    const x = i % W;
    const y = (i / W) | 0;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesBorder = true;

    if (x > 0 && !seen[i - 1] && matches(i - 1)) { seen[i - 1] = 1; stack.push(i - 1); }
    if (x < W - 1 && !seen[i + 1] && matches(i + 1)) { seen[i + 1] = 1; stack.push(i + 1); }
    if (y > 0 && !seen[i - W] && matches(i - W)) { seen[i - W] = 1; stack.push(i - W); }
    if (y < H - 1 && !seen[i + W] && matches(i + W)) { seen[i + W] = 1; stack.push(i + W); }
  }
  return { pixels, touchesBorder };
}

/** Replaces each alpha value with the median of its 3x3 neighbourhood. */
function medianFilter(alpha, W, H) {
  const out = new Uint8Array(alpha);
  const win = new Uint8Array(9);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) win[n++] = alpha[(y + dy) * W + x + dx];
      }
      win.sort();
      out[y * W + x] = win[4];
    }
  }
  alpha.set(out);
}

/**
 * Refills enclosed transparent regions too small to be a real counter, so that
 * specular highlights inside the S and D don't get punched out as holes. The
 * D's counter is far larger than the threshold and survives.
 */
function fillHighlightHoles(alpha, W, H) {
  const seen = new Uint8Array(W * H);
  const isClear = (i) => alpha[i] === 0;
  let filled = 0;

  for (let i = 0; i < W * H; i++) {
    if (alpha[i] !== 0 || seen[i]) continue;
    const { pixels, touchesBorder } = floodRegion(i, W, H, seen, isClear);
    if (!touchesBorder && pixels.length < MIN_COUNTER_AREA) {
      for (const p of pixels) alpha[p] = 255;
      filled++;
    }
  }
  return filled;
}

/** Clears opaque islands too small to be part of the letterforms. */
function removeSpecks(alpha, W, H) {
  const seen = new Uint8Array(W * H);
  const isInk = (i) => alpha[i] > 0;
  let removed = 0;

  for (let i = 0; i < W * H; i++) {
    if (alpha[i] === 0 || seen[i]) continue;
    const { pixels } = floodRegion(i, W, H, seen, isInk);
    if (pixels.length < MIN_SPECK_AREA) {
      for (const p of pixels) alpha[p] = 0;
      removed++;
    }
  }
  return removed;
}

/** Bounding box of pixels above `threshold`, or null if there are none. */
function boundingBox(alpha, W, H, threshold) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha[y * W + x] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Finds the mark's dark core in the full frame and returns a padded crop around
 * it, so the vignetted corners never reach the keying stage.
 */
async function locateMark() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const core = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    core[i] = luminance(data[i * C], data[i * C + 1], data[i * C + 2]) < L_MARK_CORE ? 255 : 0;
  }

  const box = boundingBox(core, W, H, 0);
  if (!box) throw new Error(`No pixels below L=${L_MARK_CORE} — is the source the SD mark?`);

  const padX = Math.round(box.width * LOCATE_PAD);
  const padY = Math.round(box.height * LOCATE_PAD);
  const left = Math.max(0, box.x - padX);
  const top = Math.max(0, box.y - padY);

  return {
    left,
    top,
    width: Math.min(W, box.x + box.width + padX) - left,
    height: Math.min(H, box.y + box.height + padY) - top,
  };
}

const window = await locateMark();
console.log(`located mark at (${window.left}, ${window.top}) ${window.width}x${window.height}`);

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .extract(window)
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Key the paper out on two axes — darker than paper, or more saturated than
// paper — then crush the soft tail so the drop shadow and grain drop to zero
// while genuine anti-aliased edges keep their ramp.
const alpha = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = data[i * C];
  const g = data[i * C + 1];
  const b = data[i * C + 2];
  const byLuma = clamp01((L_CLEAR - luminance(r, g, b)) / (L_CLEAR - L_OPAQUE));
  const byChroma = clamp01((saturation(r, g, b) - SAT_PAPER) / (SAT_INK - SAT_PAPER));
  alpha[i] = Math.round(smoothstep(CRUSH_LO, CRUSH_HI, Math.max(byLuma, byChroma)) * 255);
}

medianFilter(alpha, W, H);
console.log(`filled ${fillHighlightHoles(alpha, W, H)} highlight holes`);
console.log(`removed ${removeSpecks(alpha, W, H)} grain specks`);

const box = boundingBox(alpha, W, H, 24);
if (!box) throw new Error('Nothing survived keying — check L_OPAQUE / L_CLEAR / CRUSH_*.');
console.log(`mark bbox ${box.width}x${box.height} at (${box.x}, ${box.y})`);

// Edge pixels are a blend of letterform over paper. Left as-is they carry the
// paper's cream into the alpha ramp and ring the mark with a light fringe, so
// solve the blend for the letterform colour: C = a*F + (1-a)*B, giving
// F = (C - (1-a)*B) / a. Below DECONTAM_FLOOR the division amplifies noise more
// than it recovers, so those pixels keep their sampled colour.
const DECONTAM_FLOOR = 40;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const a = alpha[i];
  const src = [data[i * C], data[i * C + 1], data[i * C + 2]];
  const paper = [CREAM.r, CREAM.g, CREAM.b];

  for (let ch = 0; ch < 3; ch++) {
    let v = src[ch];
    if (a > DECONTAM_FLOOR && a < 255) {
      const f = a / 255;
      v = Math.round(Math.max(0, Math.min(255, (v - (1 - f) * paper[ch]) / f)));
    }
    rgba[i * 4 + ch] = v;
  }
  rgba[i * 4 + 3] = a;
}

// Square canvas sized to the longer edge of the mark, plus margin.
const side = Math.round(Math.max(box.width, box.height) * (1 + MARGIN * 2));
const master = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: box.x, top: box.y, width: box.width, height: box.height })
  .extend({
    top: Math.floor((side - box.height) / 2),
    bottom: Math.ceil((side - box.height) / 2),
    left: Math.floor((side - box.width) / 2),
    right: Math.ceil((side - box.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await mkdir(OUT, { recursive: true });

for (const [name, size] of [['favicon-16.png', 16], ['favicon-32.png', 32], ['icon-512.png', 512]]) {
  await sharp(master)
    .resize(size, size, { fit: 'contain', kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${OUT}/${name}`);
  console.log(`wrote ${OUT}/${name} (${size}x${size})`);
}

// iOS composites transparency onto black, so the home-screen icon gets the
// paper matte the mark was designed against.
await sharp(master)
  .resize(160, 160, { fit: 'contain', kernel: 'lanczos3' })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { ...CREAM, alpha: 1 } })
  .flatten({ background: CREAM })
  .png({ compressionLevel: 9, palette: true })
  .toFile(`${OUT}/apple-touch-icon.png`);
console.log(`wrote ${OUT}/apple-touch-icon.png (180x180)`);
