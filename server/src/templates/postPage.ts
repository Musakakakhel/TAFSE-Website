import type { Post } from "@prisma/client";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderPostPage(post: Post): string {
  const dateLabel = post.publishedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const heroThumb = post.thumbnailUrl
    ? `    <img class="hero-thumb" src="${post.thumbnailUrl}" alt="${escapeHtml(post.title)}">\n`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(post.title)} | The Academy for Sales Excellence</title>
<meta name="description" content="${escapeHtml(post.excerpt)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--navy:#2C3D50;--navy-deep:#0E2841;--navy-ink:#0E2841;--passion:#D66677;--passion-deep:#C9545F;--gold:#5B9BD5;--gold-soft:#B8D6ED;--chalk:#FAFAFA;--grey:#F1F5F8;--ink:#2C3D50;--muted:#6B7A8D;--white:#FFFFFF;--dim:#9BA9B8;--teal:#2A9D8F;--pink-wash:#FDF5F6;}
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:'Figtree',sans-serif;color:var(--ink);background:radial-gradient(1400px 850px at 8% 10%,var(--pink-wash) 0%,var(--pink-wash) 42%,rgba(253,245,246,0) 75%),radial-gradient(950px 500px at 98% 4%,rgba(184,214,237,.55) 0%,rgba(241,245,248,0) 55%),var(--chalk);line-height:1.65;font-size:17px}
  h1,h2,h3{line-height:1.15}
  .display{font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.01em;text-transform:uppercase}
  .wrap{max-width:760px;margin:0 auto;padding:0 24px}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:600;color:var(--passion)}
  a{color:var(--gold)}
  nav{background:radial-gradient(900px 300px at 6% 0%,var(--pink-wash) 0%,var(--pink-wash) 40%,rgba(253,245,246,0) 85%),radial-gradient(700px 260px at 98% 100%,rgba(184,214,237,.5) 0%,rgba(241,245,248,0) 65%),var(--white);border-bottom:1px solid #E7E6E6;position:sticky;top:0;z-index:50;padding:14px 0}
  nav .wrap{max-width:1080px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .logo{font-family:'Anton',sans-serif;color:var(--navy);font-size:16px;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;display:flex;align-items:center}
  .logo img{height:34px;width:auto;display:block}
  nav .back{color:var(--muted);text-decoration:none;font-size:14px;font-family:'IBM Plex Mono',monospace}
  nav .back:hover{color:var(--gold)}
  .ahead{padding:56px 0 28px}
  .ahead .meta{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--dim);letter-spacing:.04em;margin-top:14px}
  .ahead h1{font-size:clamp(28px,4.4vw,44px);color:var(--navy);margin:16px 0 6px}
  .hero-thumb{width:100%;border-radius:14px;margin-top:24px;display:block;box-shadow:0 12px 40px rgba(44,61,80,.12)}
  article{padding:8px 0 60px}
  article p{margin-bottom:20px;color:var(--ink)}
  article h2{font-size:24px;color:var(--navy);margin:38px 0 16px}
  article img{max-width:100%;border-radius:10px;margin:16px 0}
  .continue{background:var(--white);border:1px solid #E7E6E6;border-radius:12px;padding:26px 28px;margin-top:40px}
  .cta-block{text-align:center;background:var(--navy-deep);color:#fff;border-radius:12px;padding:40px 30px;margin-top:40px}
  .cta-block p{color:var(--gold-soft);margin-bottom:18px}
  .cta-block a.btn{display:inline-block;background:var(--passion);color:#fff;font-weight:700;padding:14px 34px;border-radius:6px;text-decoration:none}
  .cta-block a.btn:hover{background:var(--passion-deep)}
  footer{background:var(--navy-ink);color:var(--dim);padding:56px 0 40px;font-size:13px;margin-top:60px}
  footer .wrap{max-width:1080px;text-align:center;font-size:12px}
  footer a{color:var(--gold-soft);text-decoration:none}
</style>
</head>
<body>

<nav>
  <div class="wrap">
    <a class="logo" href="/"><img src="/assets/logo.png" alt="The Academy for Sales Excellence"></a>
    <a class="back" href="/blog.html">&larr; Back to Blog</a>
  </div>
</nav>

<header class="ahead">
  <div class="wrap">
    <p class="eyebrow">${escapeHtml(post.topic || post.category)}</p>
    <h1 class="display">${escapeHtml(post.title)}</h1>
    <p class="meta">By The Academy For Sales &middot; ${dateLabel}</p>
${heroThumb}  </div>
</header>

<article>
  <div class="wrap">
${post.bodyHtml}

    <div class="cta-block">
      <p class="eyebrow" style="color:var(--gold)">Need Sales Training and Coaching Support?</p>
      <p>If you face similar challenges and need support to achieve your sales goals, book a complimentary consultation with us.</p>
      <a class="btn" href="https://bookings.tafse.ae/#/4514384000001834018" target="_blank" rel="noopener">Book a Consultation</a>
    </div>
  </div>
</article>

<footer>
  <div class="wrap">
    <p>The Academy for Sales Excellence &middot; Dubai, UAE &middot; <a href="https://theacademyforsales.com">theacademyforsales.com</a></p>
  </div>
</footer>

</body>
</html>
`;
}
