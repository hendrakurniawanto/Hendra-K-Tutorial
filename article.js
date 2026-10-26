import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultPosts } from "./posts-data.js";
import { escapeHtml, renderLinkedText } from "./content-utils.js?v=2";

const loading = document.querySelector("#article-loading");
const articleElement = document.querySelector("#article-detail");
const notFound = document.querySelector("#article-not-found");
const articleId = new URLSearchParams(window.location.search).get("id");

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
  if (!post.youtubeId) {
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
    embedUrl: `https://www.youtube-nocookie.com/embed/${post.youtubeId}`,
    contentUrl: post.youtubeUrl || `https://www.youtube.com/watch?v=${post.youtubeId}`,
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
  const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : "";
  const paragraph = section.text ? `<p>${renderLinkedText(section.text)}</p>` : "";
  const list = Array.isArray(section.list) && section.list.length
    ? `<ol>${section.list.map((item) => `<li>${renderLinkedText(item)}</li>`).join("")}</ol>`
    : "";
  return `<section class="article-content-section">${heading}${paragraph}${list}</section>`;
}

function renderPost(post) {
  const content = Array.isArray(post.content) ? post.content.map(renderSection).join("") : "";
  const image = post.image
    ? `<img class="article-cover" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt || post.title)}">`
    : "";
  const video = post.youtubeId
    ? `<div class="article-video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(post.youtubeId)}?rel=0" title="${escapeHtml(post.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
    : "";
  const youtubeButton = post.youtubeUrl
    ? `<a class="button button-dark" href="${escapeHtml(post.youtubeUrl)}" target="_blank" rel="noopener noreferrer">Tonton di YouTube <span aria-hidden="true">↗</span></a>`
    : "";

  const canonicalUrl = new URL(`article.html?id=${encodeURIComponent(post.id)}`, window.location.href).href;
  updateSeoMetadata(post, canonicalUrl);
  updateVideoSchema(post, canonicalUrl);
  articleElement.innerHTML = `
    ${image}
    ${video}
    <header class="article-heading">
      <p class="eyebrow">${escapeHtml(post.category || "TUTORIAL").toUpperCase()} &nbsp; / &nbsp; ${escapeHtml(post.readTime || "")}</p>
      <p class="article-date">${escapeHtml(post.date || "")}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="article-summary">${escapeHtml(post.description || "")}</p>
      ${youtubeButton}
      <div class="article-byline"><span class="byline-mark">HK</span><span>HENDRA K.<br><small>CATATAN BELAJAR</small></span></div>
    </header>
    <div class="article-content">${content}</div>
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
      const app = initializeApp(firebaseConfig);
      const database = getFirestore(app);
      const snapshot = await getDoc(doc(database, "posts", articleId));
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
