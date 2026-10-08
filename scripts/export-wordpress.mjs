#!/usr/bin/env node
// One-time export of the old WordPress projects into static files (decision D8).
// Fetches every project from the old endpoints, downloads its media into
// public/images/work/<slug>/ (images capped at 2400px, videos re-encoded to a
// web-friendly MP4 with a poster frame), and writes src/content/projects/<slug>.ts.
// Needs sips (macOS), ffmpeg and ffprobe. Run once: node scripts/export-wordpress.mjs

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { basename, extname, join } from "node:path";

const API = "https://wp.theskylineagency.com/wp-admin/admin-ajax.php";
const ROOT = new URL("..", import.meta.url).pathname;
const MEDIA_DIR = join(ROOT, "public/images/work");
const CONTENT_DIR = join(ROOT, "src/content/projects");
const MAX_IMAGE = 2400;
const MAX_VIDEO = 1600;

const json = async (url) => (await fetch(url)).json();

const ENTITIES = { "&#8217;": "'", "&#8216;": "'", "&#8220;": '"', "&#8221;": '"', "&#8211;": "-", "&#8212;": ", ", "&amp;": "&", "&nbsp;": " ", "&#038;": "&", "\u2014": ", ", "\u2019": "'", "\u201c": '"', "\u201d": '"' };
const decode = (text = "") => Object.entries(ENTITIES).reduce((out, [from, to]) => out.split(from).join(to), text);

/** Splits WordPress text into paragraphs, keeping only <strong> and <em>. */
function paragraphs(html = "") {
  return decode(html)
    .replace(/<span[^>]*>|<\/span>/g, "")
    .replace(/<(?!\/?(strong|em)\b)[^>]+>/g, "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const list = (text = "") => decode(text).split(/<br\s*\/?>|,/).map((s) => s.trim()).filter(Boolean);

const seen = new Map();

async function media(url, slug) {
  if (!url) return null;
  const key = `${slug}:${url}`;
  if (seen.has(key)) return seen.get(key);
  const dir = join(MEDIA_DIR, slug);
  mkdirSync(dir, { recursive: true });
  const ext = extname(new URL(url).pathname).toLowerCase();
  const name = basename(new URL(url).pathname, ext).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60);
  const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".webm";
  const file = join(dir, name + (isVideo ? ".mp4" : ext === ".jpeg" ? ".jpg" : ext));
  const publicPath = (path) => path.slice(join(ROOT, "public").length);

  if (!existsSync(file)) {
    const raw = file + ".download";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    writeFileSync(raw, Buffer.from(await response.arrayBuffer()));
    if (isVideo) {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-an", "-vf", `scale='min(${MAX_VIDEO},iw)':-2`, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file]);
      rmSync(raw);
    } else {
      renameSync(raw, file);
      // sips would also upscale, so only shrink what is wider than the cap.
      if (imageSize(file).width > MAX_IMAGE) execFileSync("sips", ["--resampleWidth", String(MAX_IMAGE), file], { stdio: "ignore" });
    }
  }

  let result;
  if (isVideo) {
    const poster = file.replace(/\.mp4$/, "-poster.jpg");
    if (!existsSync(poster)) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-frames:v", "1", "-q:v", "4", poster]);
    const [width, height] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]).toString().trim().split(",").map(Number);
    result = { type: "video", src: publicPath(file), poster: publicPath(poster), width, height };
  } else {
    const { width, height } = imageSize(file);
    result = { type: "image", src: publicPath(file), width, height };
  }
  seen.set(key, result);
  return result;
}

function imageSize(file) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file]).toString();
  return { width: Number(/pixelWidth: (\d+)/.exec(out)[1]), height: Number(/pixelHeight: (\d+)/.exec(out)[1]) };
}

async function block(raw, slug) {
  const m = (url) => media(url, slug);
  switch (raw.acf_fc_layout) {
    case "title-desc":
      return { type: "text", label: decode(raw.left_title), title: decode(raw.heading_title) || undefined, body: paragraphs(raw.text) };
    case "big-element":
      return { type: "feature", media: await m(raw.image), background: raw.background_color || undefined, backdrop: raw.background_image ? true : undefined };
    case "fs-element":
      return { type: "full", media: await m(raw.image) };
    case "grid":
      return { type: "grid", items: await Promise.all([raw.image_1, raw.image_2, raw.image_3].filter(Boolean).map(m)) };
    case "two-blocks-full":
      return { type: "pair", items: await Promise.all([raw.image_1, raw.image_2].map(m)) };
    case "slider":
      return { type: "slider", items: await Promise.all(raw.images.map((i) => m(i.image))) };
    case "marquee": {
      const row = (prefix) => Object.keys(raw).filter((k) => k.startsWith(prefix) && raw[k]).sort().map((k) => raw[k]);
      return { type: "marquee", rows: [await Promise.all(row("first_line").map(m)), await Promise.all(row("second_line").map(m))] };
    }
    case "expanding-grid":
      return {
        type: "mosaic",
        center: await m(raw["image-center"]),
        around: await Promise.all(["image-left", "image-top", "image-right", "image-bottom-left", "image-bottom", "image-bottom-right"].map((k) => m(raw[k]))),
      };
    default:
      console.warn(`skipped block ${raw.acf_fc_layout} in ${slug}`);
      return null;
  }
}

const all = await json(`${API}?action=get_all_projects`);
mkdirSync(CONTENT_DIR, { recursive: true });
const slugs = [];

for (const item of all) {
  const slug = item.name;
  console.log(`exporting ${slug}`);
  const detail = await json(`${API}?action=get_project&name=${slug}`);
  const info = detail.main_info;
  const sizes = info.main_image.sizes ?? {};
  const project = {
    slug,
    title: decode(detail.title),
    subtitle: decode(info.subtitle),
    description: decode(info.description),
    services: list(info.services),
    industries: list(info.industries),
    year: Number(info.date),
    url: info.project_url || undefined,
    color: info.project_color,
    cover: await media(sizes["2048x2048"] ?? info.main_image.url, slug),
    blocks: (await Promise.all(detail.blocks.map((b) => block(b, slug)))).filter(Boolean),
  };
  const name = slug.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  writeFileSync(
    join(CONTENT_DIR, `${slug}.ts`),
    `// Exported once from the old WordPress by scripts/export-wordpress.mjs. Edit freely.\nimport type { Project } from "./types";\n\nexport const ${name}: Project = ${JSON.stringify(project, null, 2)};\n`,
  );
  slugs.push({ slug, name });
}

const size = (dir) => execFileSync("du", ["-sh", dir]).toString().split("\t")[0];
console.log(`done: ${slugs.length} projects, media ${size(MEDIA_DIR)}`);
console.log(slugs.map((s) => `import { ${s.name} } from "./${s.slug}";`).join("\n"));
