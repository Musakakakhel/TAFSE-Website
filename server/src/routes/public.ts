import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { renderCardGrid } from "../templates/blogList";
import { renderPostPage } from "../templates/postPage";

const SITE_ROOT = path.join(__dirname, "..", "..", "..");
const BLOG_SHELL_PATH = path.join(SITE_ROOT, "blog.html");
const BGRID_OPEN = '<div class="bgrid">';

let cachedShell: { head: string; tail: string } | null = null;

function getShell(): { head: string; tail: string } {
  if (cachedShell) return cachedShell;
  const html = fs.readFileSync(BLOG_SHELL_PATH, "utf8");
  const openIdx = html.indexOf(BGRID_OPEN);
  if (openIdx === -1) {
    throw new Error(`Could not find ${BGRID_OPEN} in blog.html`);
  }
  const afterOpen = openIdx + BGRID_OPEN.length;
  const sectionCloseIdx = html.indexOf("</section>", afterOpen);
  if (sectionCloseIdx === -1) {
    throw new Error("Could not find closing </section> after bgrid in blog.html");
  }
  cachedShell = {
    head: html.slice(0, afterOpen),
    tail: html.slice(sectionCloseIdx),
  };
  return cachedShell;
}

export const publicRouter = Router();

publicRouter.get(["/blog", "/blog.html"], async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  const { head, tail } = getShell();
  res.type("html").send(`${head}\n${renderCardGrid(posts)}\n${tail}`);
});

publicRouter.get("/blog-posts/:slug.html", async (req, res) => {
  const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
  if (!post || !post.published) {
    return res.status(404).send("Post not found.");
  }
  res.type("html").send(renderPostPage(post));
});
