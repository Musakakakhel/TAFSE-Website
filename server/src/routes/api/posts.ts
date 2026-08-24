import { Router } from "express";
import { prisma } from "../../db";
import { requireAuth } from "../../auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let slug = base || `post-${Date.now()}`;
  let n = 2;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${n++}`;
  }
}

export const postsApiRouter = Router();
postsApiRouter.use(requireAuth);

postsApiRouter.get("/", async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });
  res.json(posts);
});

postsApiRouter.get("/:id", async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json(post);
});

postsApiRouter.post("/", async (req, res) => {
  const { title, excerpt, category, topic, bodyHtml, thumbnailUrl, externalUrl, published, slug } = req.body;
  if (!title || !excerpt) {
    return res.status(400).json({ error: "Title and excerpt are required." });
  }
  const finalSlug = await uniqueSlug(slugify(slug || title));
  const post = await prisma.post.create({
    data: {
      title,
      excerpt,
      category: category || "Blog",
      topic: topic || "",
      bodyHtml: bodyHtml || "",
      thumbnailUrl: thumbnailUrl || null,
      externalUrl: externalUrl || null,
      published: published !== false,
      slug: finalSlug,
      createdById: req.session.userId!,
      updatedById: req.session.userId!,
    },
  });
  res.status(201).json(post);
});

postsApiRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { title, excerpt, category, topic, bodyHtml, thumbnailUrl, externalUrl, published, slug } = req.body;
  let finalSlug = existing.slug;
  if (slug && slugify(slug) !== existing.slug) {
    finalSlug = await uniqueSlug(slugify(slug), id);
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      excerpt: excerpt ?? existing.excerpt,
      category: category ?? existing.category,
      topic: topic ?? existing.topic,
      bodyHtml: bodyHtml ?? existing.bodyHtml,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
      externalUrl: externalUrl !== undefined ? externalUrl : existing.externalUrl,
      published: published !== undefined ? published : existing.published,
      slug: finalSlug,
      updatedById: req.session.userId!,
    },
  });
  res.json(post);
});

postsApiRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.post.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
