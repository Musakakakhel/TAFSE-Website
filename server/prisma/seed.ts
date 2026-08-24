import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SITE_ROOT = path.join(__dirname, "..", "..");
const BLOG_HTML_PATH = path.join(SITE_ROOT, "blog.html");
const BLOG_POSTS_DIR = path.join(SITE_ROOT, "blog-posts");
const LEGACY_UPLOADS_DIR = path.join(SITE_ROOT, "uploads", "legacy");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function decodeDataUri(dataUri: string, slug: string): string | null {
  const m = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return dataUri; // already a plain URL/path
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  fs.mkdirSync(LEGACY_UPLOADS_DIR, { recursive: true });
  const filename = `${slug}.${ext}`;
  fs.writeFileSync(path.join(LEGACY_UPLOADS_DIR, filename), Buffer.from(m[2], "base64"));
  return `/uploads/legacy/${filename}`;
}

function extractBody(articleWrapHtml: string): string {
  const stopIdx = articleWrapHtml.search(/<div class="continue"|<div class="cta-block"/);
  return (stopIdx === -1 ? articleWrapHtml : articleWrapHtml.slice(0, stopIdx)).trim();
}

async function seedUsers() {
  const accounts = [
    { username: "musa", displayName: "Musa" },
    { username: "jemimah", displayName: "Jemimah" },
  ];
  const created: { username: string; password: string }[] = [];
  const users: Record<string, number> = {};

  for (const acc of accounts) {
    const existing = await prisma.user.findUnique({ where: { username: acc.username } });
    if (existing) {
      users[acc.username] = existing.id;
      continue;
    }
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const user = await prisma.user.create({
      data: {
        username: acc.username,
        displayName: acc.displayName,
        passwordHash: bcrypt.hashSync(tempPassword, 10),
        mustChangePw: true,
      },
    });
    users[acc.username] = user.id;
    created.push({ username: acc.username, password: tempPassword });
  }

  if (created.length > 0) {
    console.log("\n=== New admin accounts created ===");
    created.forEach((c) => console.log(`  ${c.username} / ${c.password}`));
    console.log("You will be asked to set a real password on first login.\n");
  }
  return users;
}

async function seedPosts(defaultOwnerId: number) {
  if (!fs.existsSync(BLOG_HTML_PATH)) {
    console.warn("blog.html not found, skipping post import.");
    return;
  }
  const blogHtml = fs.readFileSync(BLOG_HTML_PATH, "utf8");
  const $ = cheerio.load(blogHtml);
  const cards = $("a.bcard").toArray();
  const usedSlugs = new Set<string>();
  let imported = 0;
  let skipped = 0;

  for (const el of cards) {
    const $el = $(el);
    const href = ($el.attr("href") || "").trim();
    const category = $el.find(".bcat").text().trim() || "Blog";
    const cardTitle = $el.find("h3").text().trim();
    const cardExcerpt = $el.find(".bdesc").text().trim();
    const cardThumb = $el.find("img.bthumb").attr("src") || null;
    if (!href || !cardTitle) continue;

    const isExternal = /^https?:\/\//.test(href);

    let slug: string;
    let title = cardTitle;
    let excerpt = cardExcerpt;
    let topic = "";
    let bodyHtml = "";
    let thumbnailUrl: string | null = cardThumb;
    let publishedAt = new Date();
    let externalUrl: string | null = null;

    if (isExternal) {
      externalUrl = href;
      slug = slugify(cardTitle);
    } else {
      slug = href.replace(/^blog-posts\//, "").replace(/\.html$/, "");
      const postPath = path.join(BLOG_POSTS_DIR, `${slug}.html`);
      if (!fs.existsSync(postPath)) {
        console.warn(`  skipping "${cardTitle}" — local file not found: ${postPath}`);
        skipped++;
        continue;
      }
      const postHtml = fs.readFileSync(postPath, "utf8");
      const $$ = cheerio.load(postHtml);
      topic = $$("header.ahead .eyebrow").first().text().trim();
      title = $$("header.ahead h1").first().text().trim() || cardTitle;
      const metaText = $$("header.ahead .meta").first().text();
      const dateStr = metaText.split("·").pop()?.trim();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) publishedAt = parsed;
      }
      thumbnailUrl = $$(".hero-thumb").attr("src") || cardThumb;
      bodyHtml = extractBody($$("article .wrap").html() || "");
    }

    // de-dupe slugs (mostly relevant for external cards derived from titles)
    let finalSlug = slug || `post-${imported}`;
    let n = 2;
    while (usedSlugs.has(finalSlug)) finalSlug = `${slug}-${n++}`;
    usedSlugs.add(finalSlug);

    if (thumbnailUrl && thumbnailUrl.startsWith("data:")) {
      thumbnailUrl = decodeDataUri(thumbnailUrl, finalSlug);
    }

    const existing = await prisma.post.findUnique({ where: { slug: finalSlug } });
    if (existing) continue;

    await prisma.post.create({
      data: {
        slug: finalSlug,
        title,
        excerpt: excerpt || title,
        category,
        topic,
        bodyHtml,
        thumbnailUrl,
        externalUrl,
        published: true,
        publishedAt,
        createdById: defaultOwnerId,
        updatedById: defaultOwnerId,
      },
    });
    imported++;
  }

  console.log(`Imported ${imported} posts (${skipped} skipped — local file missing).`);
}

async function main() {
  const users = await seedUsers();
  await seedPosts(users.musa);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
