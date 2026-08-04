/**
 * Generates the default social-share card (public/og-default.png, 1200x630).
 *
 * Text is rasterized with resvg rather than sharp because sharp renders SVG via
 * librsvg, which resolves fonts through fontconfig — JetBrains Mono is not a
 * system font here, so librsvg would silently substitute another monospace and
 * the card would render off-brand, differently on different machines. resvg
 * takes explicit font file paths instead, so output is identical everywhere.
 *
 * Two font quirks drove the file choices below:
 *   - resvg cannot decode woff2, and @fontsource ships nothing else, so the
 *     woff2 is decompressed to TTF in memory first (wawoff2).
 *   - resvg pins a variable font to its default instance and ignores
 *     font-weight, so the *static* @fontsource/jetbrains-mono is used here for
 *     a real 700. The site itself uses the variable package, which is smaller.
 *     Verified: rendering @700 against the variable font is pixel-identical
 *     to @400.
 *
 * The mark is keyed off its cream paper field by the same two-axis approach as
 * make-favicon.mjs; see that file's header for why luminance alone won't do it.
 *
 * Run with: npm run og
 */
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { decompress } from 'wawoff2';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { siteConfig } from '../src/data/site.ts';

const SRC = 'assets/logo-portfolio.png';
const OUT = 'public/og-default.png';

const FONT_REGULAR = 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2';
const FONT_BOLD = 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2';

/** OpenGraph's canonical card size; 1.91:1, what LinkedIn/Twitter/Slack expect. */
const W = 1200;
const H = 630;

// Dark theme tokens, mirroring src/styles/global.css. Duplicated as literals
// because CSS custom properties aren't readable from Node — if the theme
// changes, this list changes with it.
const BG = '#0a0a0a';
const FG = '#e5e5e0';
const MUTED = '#8a8a85';
const ACCENT = '#f5a623';
const BORDER = '#262622';

/** Mark size and its inset from the card's left/top edge. */
const MARK = 132;
const PAD = 84;

// --- Keying constants, carried over from make-favicon.mjs ---------------------
const L_MARK_CORE = 150;
const LOCATE_PAD = 0.08;
const L_OPAQUE = 188;
const L_CLEAR = 212;
const SAT_PAPER = 0.16;
const SAT_INK = 0.24;
const CRUSH_LO = 0.5;
const CRUSH_HI = 0.85;
const CREAM = { r: 240, g: 235, b: 224 };
const DECONTAM_FLOOR = 40;

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const saturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (lo, hi, v) => {
  const t = clamp01((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

function boundingBox(alpha, w, h, threshold) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Returns the SD mark as a transparent PNG buffer, trimmed to its bounds. */
async function keyedMark() {
  const probe = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: PW, height: PH, channels: PC } = probe.info;

  const core = new Uint8Array(PW * PH);
  for (let i = 0; i < PW * PH; i++) {
    const l = luminance(probe.data[i * PC], probe.data[i * PC + 1], probe.data[i * PC + 2]);
    core[i] = l < L_MARK_CORE ? 255 : 0;
  }
  const found = boundingBox(core, PW, PH, 0);
  if (!found) throw new Error(`No pixels below L=${L_MARK_CORE} — is the source the SD mark?`);

  const padX = Math.round(found.width * LOCATE_PAD);
  const padY = Math.round(found.height * LOCATE_PAD);
  const left = Math.max(0, found.x - padX);
  const top = Math.max(0, found.y - padY);
  const window = {
    left,
    top,
    width: Math.min(PW, found.x + found.width + padX) - left,
    height: Math.min(PH, found.y + found.height + padY) - top,
  };

  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .extract(window)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * c];
    const g = data[i * c + 1];
    const b = data[i * c + 2];
    const byLuma = clamp01((L_CLEAR - luminance(r, g, b)) / (L_CLEAR - L_OPAQUE));
    const byChroma = clamp01((saturation(r, g, b) - SAT_PAPER) / (SAT_INK - SAT_PAPER));
    alpha[i] = Math.round(smoothstep(CRUSH_LO, CRUSH_HI, Math.max(byLuma, byChroma)) * 255);
  }

  const box = boundingBox(alpha, w, h, 24);
  if (!box) throw new Error('Nothing survived keying — check L_OPAQUE / L_CLEAR / CRUSH_*.');

  // Unblend the cream out of edge pixels so the mark doesn't carry a light
  // fringe onto the dark card. See make-favicon.mjs for the algebra.
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = alpha[i];
    const src = [data[i * c], data[i * c + 1], data[i * c + 2]];
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

  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: box.x, top: box.y, width: box.width, height: box.height })
    .png()
    .toBuffer();
}

/**
 * woff2 -> TTF on disk, because resvg can't read woff2 and honours only
 * `fontFiles` (paths). Its `fontBuffers` option is silently ignored: passing
 * buffers renders the card in a fallback sans-serif with no error.
 */
async function ttfPaths(...woff2Paths) {
  const dir = await mkdtemp(join(tmpdir(), 'og-fonts-'));
  return Promise.all(
    woff2Paths.map(async (src, i) => {
      const out = join(dir, `font-${i}.ttf`);
      await writeFile(out, Buffer.from(await decompress(await readFile(src))));
      return out;
    })
  );
}

const [firstName, ...restName] = siteConfig.author.split(' ');
const surname = restName.join(' ');

// The name echoes the homepage h1 (first word in accent) and the $ glyph echoes
// PromptLabel, so a shared link reads as the same object as the site.
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${ACCENT}"/>
  <rect x="${PAD}" y="${PAD + MARK + 52}" width="${W - PAD * 2}" height="1" fill="${BORDER}"/>
  <text x="${PAD}" y="${PAD + MARK + 24}" font-family="JetBrains Mono" font-size="30" font-weight="400" fill="${MUTED}">
    <tspan fill="${ACCENT}">$ </tspan>whoami
  </text>
  <text x="${PAD}" y="${PAD + MARK + 158}" font-family="JetBrains Mono" font-size="82" font-weight="700">
    <tspan fill="${ACCENT}">${firstName}</tspan><tspan fill="${FG}"> ${surname}</tspan>
  </text>
  <text x="${PAD}" y="${PAD + MARK + 222}" font-family="JetBrains Mono" font-size="34" font-weight="400" fill="${MUTED}">${siteConfig.description}</text>
  <text x="${PAD}" y="${H - 60}" font-family="JetBrains Mono" font-size="26" font-weight="400" fill="${MUTED}">${siteConfig.url.replace(/^https?:\/\//, '')}</text>
</svg>`;

const rendered = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: {
    fontFiles: await ttfPaths(FONT_REGULAR, FONT_BOLD),
    loadSystemFonts: false,
    defaultFontFamily: 'JetBrains Mono',
  },
}).render().asPng();

const mark = await keyedMark();
const card = await sharp(rendered)
  .composite([
    {
      // `contain` mattes onto opaque black unless the background is explicitly
      // transparent, which boxes the mark in on the dark card.
      input: await sharp(mark)
        .resize(MARK, MARK, {
          fit: 'contain',
          kernel: 'lanczos3',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer(),
      left: W - PAD - MARK,
      top: PAD,
    },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(OUT, card);
const { width, height } = await sharp(card).metadata();
console.log(`wrote ${OUT} (${width}x${height}, ${(card.length / 1024).toFixed(0)}KB)`);
