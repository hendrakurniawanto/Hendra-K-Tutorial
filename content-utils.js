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

function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(parsed.hostname)) return "";
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || "";
    const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    return match ? match[1] : "";
  } catch {
    return "";
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

  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    const linkText = label ? escapeHtml(label) : safeUrl;
    return `<a class="article-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkText}<span aria-hidden="true"> ↗</span></a>`;
  }

  const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  return `<a class="youtube-preview" href="${videoUrl}" target="_blank" rel="noopener noreferrer" aria-label="Tonton video di YouTube">
    <img src="${thumbnail}" alt="Preview video YouTube" loading="lazy">
    <span class="youtube-play" aria-hidden="true">▶</span>
    <span class="youtube-caption"><span>VIDEO YOUTUBE</span><strong>${escapeHtml(label || "Buka video di YouTube")} ↗</strong></span>
  </a>`;
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
