import type { Post } from "@prisma/client";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderCard(post: Post): string {
  const href = post.externalUrl
    ? post.externalUrl
    : `blog-posts/${post.slug}.html`;
  const extraAttrs = post.externalUrl ? ' target="_blank" rel="noopener"' : "";
  const thumbTag = post.thumbnailUrl
    ? `<img class="bthumb" src="${post.thumbnailUrl}" alt="${escapeHtml(post.title)}">\n        `
    : "";
  return `      <a class="bcard" href="${href}"${extraAttrs}>
        ${thumbTag}<span class="bcat">${escapeHtml(post.category)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p class="bdesc">${escapeHtml(post.excerpt)}</p>
        <span class="bread">Read the article &rarr;</span>
      </a>`;
}

export function renderCardGrid(posts: Post[]): string {
  return posts.map(renderCard).join("\n");
}
