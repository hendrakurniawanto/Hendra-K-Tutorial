export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function normalizeImageUrl(value) {
  const imageUrl = String(value ?? "").trim();
  try {
    const parsed = new URL(imageUrl);
    if (!["drive.google.com", "www.drive.google.com", "docs.google.com"].includes(parsed.hostname)) return imageUrl;
    const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || parsed.searchParams.get("id");
    return fileId
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`
      : imageUrl;
  } catch {
    return imageUrl;
  }
}

function renderLink(url, label = "") {
  const safeUrl = escapeHtml(url);
  const restrictedDownloads = new Set([
    "https://pastelink.net/q7emda9i",
    "https://pastelink.net/6oet3337"
  ]);
  if (restrictedDownloads.has(url.replace(/\/$/, ""))) {
    return '<span class="article-link-disabled">Tautan unduhan ini tidak ditampilkan.</span>';
  }

  const linkText = label ? escapeHtml(label) : safeUrl;
  return `<a class="article-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkText}<span aria-hidden="true"> ↗</span></a>`;
}

export function renderLinkedText(value) {
  const lines = String(value ?? "").split("\n");
  return lines.map((line) => {
    const parts = [];
    const urlPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>"']+/gi;
    let cursor = 0;
    for (const match of line.matchAll(urlPattern)) {
      const start = match.index;
      const label = match[1] || "";
      let url = match[2] || match[0];
      const punctuation = url.match(/[),.!?;:\]]+$/)?.[0] || "";
      if (punctuation) url = url.slice(0, -punctuation.length);
      if (!url) continue;
      parts.push(escapeHtml(line.slice(cursor, start)));
      parts.push(renderLink(url, label));
      parts.push(escapeHtml(punctuation));
      cursor = start + match[0].length;
    }
    parts.push(escapeHtml(line.slice(cursor)));
    return parts.join("");
  }).join("<br>");
}
