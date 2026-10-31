import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { addDoc, collection, doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultPosts } from "./posts-data.js";
import { escapeHtml, renderLinkedText, sanitizeRichHtml } from "./content-utils.js?v=6";

const loading = document.querySelector("#article-loading");
const articleElement = document.querySelector("#article-detail");
const notFound = document.querySelector("#article-not-found");
const articleId = new URLSearchParams(window.location.search).get("id");
let database;

function getDatabase() {
  if (!database && isFirebaseConfigured) database = getFirestore(initializeApp(firebaseConfig));
  return database;
}

const youtubeChannelUrl = "https://www.youtube.com/@hendra.k?sub_confirmation=1";

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

function setMeta(selector, attribute, value) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, selector.includes("[property=") ? selector.match(/property="([^"]+)"/)?.[1] : selector.match(/name="([^"]+)"/)?.[1]);
    document.head.append(element);
  }
  element.content = value;
}

function updateSeoMetadata(post, canonicalUrl) {
  const title = `${post.title} — HENDRA K`;
  const description = post.description || post.title;
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector("#canonical-url").href = canonicalUrl;
  for (const [selector, value] of Object.entries({
    'meta[property="og:title"]': title,
    'meta[property="og:description"]': description,
    'meta[property="og:url"]': canonicalUrl,
    'meta[property="og:image"]': post.image || "",
    'meta[name="twitter:title"]': title,
    'meta[name="twitter:description"]': description
  })) setMeta(selector, selector.includes("property=") ? "property" : "name", value);
}

function updateVideoSchema(post, canonicalUrl) {
  const schemaElement = document.querySelector("#video-schema");
  const videoId = post.youtubeId || getYouTubeVideoId(post.youtubeUrl || "");
  if (!videoId) {
    schemaElement.textContent = "{}";
    return;
  }
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.title,
    description: post.fullDescription || post.description || post.title,
    thumbnailUrl: post.image ? [post.image] : [],
    uploadDate: post.uploadDate || post.date,
    duration: post.duration,
    contentUrl: post.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "HENDRA K"
    }
  };
  schemaElement.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
}

function renderSection(section) {
  if (section.html) return `<section class="article-content-section">${sanitizeRichHtml(section.html)}</section>`;
  const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : "";
  const paragraph = section.text ? `<p>${renderLinkedText(section.text)}</p>` : "";
  const list = Array.isArray(section.list) && section.list.length
    ? `<ol>${section.list.map((item) => `<li>${renderLinkedText(item)}</li>`).join("")}</ol>`
    : "";
  return `<section class="article-content-section">${heading}${paragraph}${list}</section>`;
}

function renderPost(post) {
  const content = Array.isArray(post.content) ? post.content.map(renderSection).join("") : "";
  const videoId = post.youtubeId || getYouTubeVideoId(post.youtubeUrl || "");
  const videoUrl = post.youtubeUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
  const hasVideo = Boolean(videoId || post.youtubeUrl);
  const image = post.image && !hasVideo
    ? `<img class="article-cover" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt || post.title)}">`
    : "";
  const video = hasVideo
    ? `<section class="article-video-card" aria-label="Video YouTube">
        <a class="article-video-thumbnail" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Tonton ${escapeHtml(post.title)} di YouTube">
          <img src="${escapeHtml(post.image || `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`)}" alt="Thumbnail ${escapeHtml(post.title)}" loading="lazy">
        </a>
        <div class="article-video-card-body">
          <p class="eyebrow">VIDEO YOUTUBE</p>
          <h2>${escapeHtml(post.title)}</h2>
          <div class="article-video-actions">
            <a class="button button-dark" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">Tonton &amp; Komentar di YouTube <span aria-hidden="true">↗</span></a>
            <a class="button button-light" href="${youtubeChannelUrl}" target="_blank" rel="noopener noreferrer">Subscribe Channel Hendra K <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>`
    : "";
  const canonicalUrl = new URL(`article.html?id=${encodeURIComponent(post.id)}`, window.location.href).href;
  updateSeoMetadata(post, canonicalUrl);
  updateVideoSchema(post, canonicalUrl);
  articleElement.innerHTML = `
    ${image}
    <header class="article-heading">
      <p class="eyebrow">${escapeHtml(post.category || "TUTORIAL").toUpperCase()} &nbsp; / &nbsp; ${escapeHtml(post.readTime || "")}</p>
      <p class="article-date">${escapeHtml(post.date || "")}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="article-summary">${escapeHtml(post.description || "")}</p>
      <div class="article-byline"><span class="byline-mark">HK</span><span>HENDRA K.<br><small>CATATAN BELAJAR</small></span></div>
    </header>
    <div class="article-content">${content}</div>
    ${video}
    <div class="article-end"><span>✳</span> TETAP BELAJAR, TETAP BERBAGI.</div>
  `;
  const restrictedDownloads = new Set([
    "https://pastelink.net/q7emda9i",
    "https://pastelink.net/6oet3337"
  ]);
  articleElement.querySelectorAll("a[href]").forEach((link) => {
    if (!restrictedDownloads.has(link.href.replace(/\/$/, ""))) return;
    const replacement = document.createElement("span");
    replacement.className = "article-link-disabled";
    replacement.textContent = "Tautan unduhan ini tidak ditampilkan.";
    link.replaceWith(replacement);
  });
  articleElement.hidden = false;
  loading.hidden = true;
  recordPageView(post.id);
}

async function recordPageView(postId) {
  if (!isFirebaseConfigured || !postId) return;
  const month = new Date().toISOString().slice(0, 7);
  const storageKey = `hendra-page-view:${postId}:${month}`;
  try {
    if (localStorage.getItem(storageKey)) return;
    await addDoc(collection(getDatabase(), "pageViews"), { postId, month, createdAt: Date.now() });
    localStorage.setItem(storageKey, "1");
  } catch (error) {
    console.warn("Kunjungan artikel gagal dicatat.", error);
  }
}

async function loadPost() {
  let post = defaultPosts.find((item) => item.id === articleId);
  if (!post && articleId?.startsWith("youtube-")) {
    try {
      const response = await fetch(`youtube-posts.json?v=${Date.now()}`);
      const youtubePosts = response.ok ? await response.json() : [];
      post = youtubePosts.find((item) => item.id === articleId);
    } catch (error) {
      console.warn("Feed YouTube gagal dimuat pada halaman artikel.", error);
    }
  }
  if (isFirebaseConfigured && articleId) {
    try {
      const snapshot = await getDoc(doc(getDatabase(), "posts", articleId));
      if (snapshot.exists()) post = { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.warn("Postingan online gagal dimuat; mencoba konten lokal.", error);
    }
  }

  if (!post) {
    loading.hidden = true;
    notFound.hidden = false;
    return;
  }

  renderPost(post);
}

loadPost();
