import "dotenv/config";
import express from "express";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import path from "path";
import { adminRouter } from "./routes/admin";
import { publicRouter } from "./routes/public";
import { postsApiRouter } from "./routes/api/posts";
import { uploadsRouter } from "./routes/api/uploads";
import { leadsApiRouter } from "./routes/api/leads";

const SITE_ROOT = path.join(__dirname, "..", "..");
const SQLiteStore = connectSqlite3(session);

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: path.join(__dirname, "..") }) as any,
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true },
  })
);

app.use("/vendor", express.static(path.join(__dirname, "..", "public", "vendor")));

// Public lead-capture endpoints (no auth required).
app.use(leadsApiRouter);

// Admin pages (each route applies requireAuth itself).
app.use(adminRouter);

// Admin-only APIs (each router applies requireAuth to itself).
app.use("/api/posts", postsApiRouter);
app.use("/api/uploads", uploadsRouter);

// Dynamic public blog routes (must come before the static file fallback below).
app.use(publicRouter);

// Everything else: the existing static site (index.html, keynote.html, sss.html,
// events.html, case-studies.html, assets/, uploads/, and the legacy blog-posts/*.html
// files kept as an on-disk backup).
app.use(express.static(SITE_ROOT));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Tafse server running at http://localhost:${PORT}`);
});
