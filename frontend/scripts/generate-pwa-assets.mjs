#!/usr/bin/env node
/**
 * Generates every PWA raster asset (app icons, maskable icons, apple-touch-icon,
 * iOS launch screens) from the MediaLayer logomark.
 *
 * Rendering is done with headless Chrome, so there is no extra dependency to
 * install — set CHROME=/path/to/binary if yours lives somewhere unusual.
 *
 *   node scripts/generate-pwa-assets.mjs
 *
 * Install-dialog screenshots are captured separately, against a running site
 * (the landing page animates on scroll, so it needs a real page load):
 *
 *   node scripts/generate-pwa-assets.mjs --screenshots https://medialayer.app
 *
 * Add a matching entry to public/manifest.webmanifest for each new screenshot;
 * every screenshot of one form_factor must share the same aspect ratio.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const SPLASH_DIR = path.join(ROOT, "public", "splash");
const SHOTS_DIR = path.join(ROOT, "public", "screenshots");

const screenshotFlag = process.argv.indexOf("--screenshots");
const screenshotUrl = screenshotFlag === -1 ? null : process.argv[screenshotFlag + 1];

const BRAND_BLACK = "#111111";
const BRAND_WHITE = "#ffffff";

/** The MediaLayer logomark, viewBox 99×80. */
const MARK_PATHS = [
  "M0 0H84.4861V15.3439H0V0Z",
  "M69.1422 79.4536V0.000427246L84.4861 0L84.4861 79.4536H69.1422Z",
  "M87.7656 79.4531L69.1422 79.4536L69.1422 64.1092H98.9436L87.7656 79.4531Z",
  "M53.2581 79.4536H35.4255V64.1096H63.9616L53.2581 79.4536Z",
  "M0 33.5363V79.4544H15.3439V15.3452L0 33.5363Z",
  "M35.4253 52.9371L35.4255 79.4536L50.7692 79.4531V34.9072L35.4253 52.9371Z",
  "M18.6234 79.4536L0 79.4544L2.78891e-05 64.1096H29.8015L18.6234 79.4536Z",
];

const mark = (fill, width) => `
  <svg viewBox="0 0 99 80" width="${width}" xmlns="http://www.w3.org/2000/svg"
       style="display:block;height:auto">
    ${MARK_PATHS.map((d) => `<path d="${d}" fill="${fill}" />`).join("\n    ")}
  </svg>`;

/** @param {{w:number,h:number,bg:string,fg:string,markWidth:number}} o */
const page = ({ w, h, bg, fg, markWidth }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden}
  body{background:${bg};display:flex;align-items:center;justify-content:center}
</style></head><body>${mark(fg, markWidth)}</body></html>`;

const tmp = mkdtempSync(path.join(tmpdir(), "medialayer-pwa-"));

function shoot(target, outFile, w, h, extraArgs = []) {
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${w},${h}`,
      `--screenshot=${outFile}`,
      ...extraArgs,
      target,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  console.log(`  ✓ ${path.relative(ROOT, outFile)}  (${w}×${h})`);
}

if (screenshotUrl) {
  // Screenshot mode only — icons are unchanged.
  mkdirSync(SHOTS_DIR, { recursive: true });
  console.log(`Install-dialog screenshots from ${screenshotUrl}`);
  shoot(screenshotUrl, path.join(SHOTS_DIR, "wide-1280x800.png"), 1280, 800, [
    "--virtual-time-budget=8000",
  ]);
  shoot(screenshotUrl, path.join(SHOTS_DIR, "narrow-390x844.png"), 390, 844, [
    "--virtual-time-budget=8000",
  ]);
  rmSync(tmp, { recursive: true, force: true });
  console.log("\nDone. Check both files before shipping — scroll-triggered");
  console.log("animations occasionally capture mid-flight.");
  process.exit(0);
}

function render(name, outFile, html, w, h) {
  const htmlFile = path.join(tmp, `${name}.html`);
  writeFileSync(htmlFile, html);
  shoot(htmlFile, outFile, w, h);
}

mkdirSync(ICONS_DIR, { recursive: true });
mkdirSync(SPLASH_DIR, { recursive: true });

// ── App icons ────────────────────────────────────────────────────────────────
// "any" icons fill the tile; maskable icons keep the mark inside the 80% safe
// zone so Android's circle/squircle masks never clip it.
console.log("App icons");
const icons = [
  { file: "icon-192.png", size: 192, ratio: 0.56 },
  { file: "icon-512.png", size: 512, ratio: 0.56 },
  { file: "icon-maskable-192.png", size: 192, ratio: 0.4 },
  { file: "icon-maskable-512.png", size: 512, ratio: 0.4 },
  { file: "apple-touch-icon.png", size: 180, ratio: 0.56 },
  { file: "icon-96.png", size: 96, ratio: 0.56 },
];
for (const { file, size, ratio } of icons) {
  render(
    file,
    path.join(ICONS_DIR, file),
    page({
      w: size,
      h: size,
      bg: BRAND_BLACK,
      fg: BRAND_WHITE,
      markWidth: Math.round(size * ratio),
    }),
    size,
    size,
  );
}

// ── iOS launch screens ───────────────────────────────────────────────────────
// Light background to match the app shell, so the launch never flashes.
console.log("iOS launch screens");
const splashes = [
  [1290, 2796], // iPhone 15/14 Pro Max, 16 Pro
  [1179, 2556], // iPhone 15/14 Pro
  [1284, 2778], // iPhone 13/12 Pro Max
  [1170, 2532], // iPhone 15/14/13/12
  [1125, 2436], // iPhone 13 mini, X/XS/11 Pro
  [1242, 2688], // iPhone XS Max / 11 Pro Max
  [828, 1792], //  iPhone XR / 11
  [750, 1334], //  iPhone SE (2nd/3rd), 8
  [1242, 2208], // iPhone 8 Plus
  [1620, 2160], // iPad 10.2"
  [1668, 2388], // iPad Pro 11"
  [2048, 2732], // iPad Pro 12.9"
];
for (const [w, h] of splashes) {
  render(
    `splash-${w}x${h}`,
    path.join(SPLASH_DIR, `splash-${w}x${h}.png`),
    page({
      w,
      h,
      bg: BRAND_WHITE,
      fg: BRAND_BLACK,
      markWidth: Math.round(Math.min(w, h) * 0.22),
    }),
    w,
    h,
  );
}

rmSync(tmp, { recursive: true, force: true });
console.log("\nDone. Assets written to public/icons and public/splash.");
