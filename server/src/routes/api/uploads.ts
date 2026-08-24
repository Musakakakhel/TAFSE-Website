import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAuth } from "../../auth";

const SITE_ROOT = path.join(__dirname, "..", "..", "..", "..");
const UPLOADS_DIR = path.join(SITE_ROOT, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.json({ url: `/uploads/${req.file.filename}` });
});
