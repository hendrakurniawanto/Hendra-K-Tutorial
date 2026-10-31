export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function sanitizeRichHtml(value) {
  const parsed = new DOMParser().parseFromString(String(value ?? ""), "text/html");
  const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A", "SPAN", "H2", "H3", "BLOCKQUOTE"]);
  const blockTags = new Set(["P", "LI", "H2", "H3", "BLOCKQUOTE"]);
  const fontSizes = new Set(["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"]);
  const margins = new Set(["0px", "4px", "8px", "12px", "14px", "16px", "20px", "24px", "32px", "40px", "48px"]);
  const lineHeights = new Set(["1.4", "1.6", "1.8", "2"]);

  function sanitizeStyle(element) {
    const styles = [];
    const fontSize = element.style.fontSize.toLowerCase();
    const marginBottom = element.style.marginBottom.toLowerCase();
    const lineHeight = element.style.lineHeight;
    if (fontSizes.has(fontSize)) styles.push(`font-size:${fontSize}`);
    if (blockTags.has(element.tagName) && margins.has(marginBottom)) styles.push(`margin-bottom:${marginBottom}`);
    if (blockTags.has(element.tagName) && lineHeights.has(lineHeight)) styles.push(`line-height:${lineHeight}`);
    return styles.length ? ` style="${styles.join(";")}"` : "";
  }

  function renderNode(node, insideLink = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      return insideLink ? escapeHtml(node.nodeValue) : renderLinkedText(node.nodeValue);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(node.tagName)) return "";

    const children = [...node.childNodes].map((child) => renderNode(child, insideLink || node.tagName === "A")).join("");
    if (!allowedTags.has(node.tagName)) return children;
    if (node.tagName === "BR") return "<br>";
    if (node.tagName === "A") {
      try {
        const url = new URL(node.getAttribute("href") || "");
        if (!["http:", "https:"].includes(url.protocol)) return children;
        return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${children}</a>`;
      } catch {
        return children;
      }
    }

    const tag = node.tagName.toLowerCase();
    return `<${tag}${sanitizeStyle(node)}>${children}</${tag}>`;
  }

  return [...parsed.body.childNodes].map(renderNode).join("");
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
    const urlPattern = /\[([^\]]+)\]\s*\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>"']+/gi;
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
