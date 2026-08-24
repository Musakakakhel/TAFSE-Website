import { Router } from "express";
import { prisma } from "../db";
import { hashPassword, verifyPassword, requireAuth } from "../auth";

export const adminRouter = Router();

adminRouter.get("/admin", (req, res) => res.redirect("/admin/posts"));

adminRouter.get("/admin/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin/posts");
  res.render("admin/login", { error: null });
});

adminRouter.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.render("admin/login", { error: "Incorrect username or password." });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.displayName = user.displayName;
  if (user.mustChangePw) return res.redirect("/admin/change-password");
  res.redirect("/admin/posts");
});

adminRouter.post("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

adminRouter.get("/admin/change-password", requireAuth, (req, res) => {
  res.render("admin/change-password", { error: null, displayName: req.session.displayName });
});

adminRouter.post("/admin/change-password", requireAuth, async (req, res) => {
  const { password, confirm } = req.body;
  if (!password || password.length < 8) {
    return res.render("admin/change-password", {
      error: "Password must be at least 8 characters.",
      displayName: req.session.displayName,
    });
  }
  if (password !== confirm) {
    return res.render("admin/change-password", {
      error: "Passwords do not match.",
      displayName: req.session.displayName,
    });
  }
  await prisma.user.update({
    where: { id: req.session.userId! },
    data: { passwordHash: hashPassword(password), mustChangePw: false },
  });
  res.redirect("/admin/posts");
});

adminRouter.get("/admin/posts", requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: true },
  });
  res.render("admin/dashboard", { posts, displayName: req.session.displayName });
});

adminRouter.get("/admin/posts/new", requireAuth, (req, res) => {
  res.render("admin/editor", { post: null, displayName: req.session.displayName });
});

adminRouter.get("/admin/posts/:id/edit", requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });
  if (!post) return res.status(404).send("Post not found.");
  res.render("admin/editor", { post, displayName: req.session.displayName });
});

adminRouter.get("/admin/leads", requireAuth, async (req, res) => {
  const [discoveryLeads, scorecardLeads] = await Promise.all([
    prisma.discoveryLead.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.scorecardLead.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  res.render("admin/leads", { discoveryLeads, scorecardLeads, displayName: req.session.displayName });
});
