import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { collection, doc, getDoc, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultSiteSettings } from "./site-settings.js";
import { normalizeImageUrl } from "./content-utils.js";

const defaultTutorials = [
  {
    id: "ctr-remote-play",
    title: "Main CTR PS4 di PC dengan PS Remote Play",
    category: "Game",
    date: "25 OKT 2026",
    readTime: "5 MENIT",
    description: "Mainkan CTR: Crash Team Racing Nitro-Fueled dari PS4 di layar PC menggunakan aplikasi resmi Remote Play dan game yang kamu miliki.",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80",
    alt: "Controller PlayStation untuk bermain game di PC",
    content: [
      { heading: "Yang perlu disiapkan", list: ["Konsol PS4 dengan CTR: Crash Team Racing Nitro-Fueled yang kamu miliki secara sah.", "PC Windows atau Mac, koneksi internet stabil, dan controller yang kompatibel.", "Akun PlayStation Network yang sama pada konsol dan aplikasi Remote Play."] },
      { heading: "Hubungkan PS4 ke PC", list: ["Buka panduan resmi PlayStation Remote Play dan unduh aplikasi untuk sistem operasi PC-mu.", "Di PS4, buka Settings → Remote Play Connection Settings dan aktifkan Enable Remote Play.", "Jalankan PS Remote Play di PC, masuk dengan akun yang sama, lalu pilih PS4 untuk menghubungkan konsol.", "Nyalakan CTR di PS4 dan mainkan dari layar PC. Untuk koneksi lokal yang lebih stabil, sambungkan PS4 ke router menggunakan kabel LAN."] },
      { heading: "Catatan", text: "Cara ini men-stream permainan dari PS4 ke PC, bukan memasang salinan game PS4 di PC. Gunakan game dan akun milikmu sendiri, serta ikuti ketentuan resmi PlayStation. Panduan resmi: https://www.playstation.com/support/games/playstation-remote-play-on-pc-and-mac/" }
    ]
  }
];

let tutorials = defaultTutorials.map((tutorial) => ({ ...tutorial }));
let youtubePosts = [];
let viewCounts = {};

const grid = document.querySelector("#tutorial-grid");
const searchInput = document.querySelector("#tutorial-search");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const loadMoreButton = document.querySelector("#load-more-tutorials");
const youtubeFeedStatus = document.querySelector("#youtube-feed-status");
const youtubeFeedRetry = document.querySelector("#youtube-feed-retry");
const feedbackForm = document.querySelector("#feedback-form");
const feedbackStatus = document.querySelector("#feedback-status");
const homeViews = document.querySelectorAll(".home-view");
const homeTabs = document.querySelectorAll(".home-tabs [data-home-tab]");
const homeTabTriggers = document.querySelectorAll("[data-home-tab]");
const tutorialsPerPage = 6;
const youtubeCacheKey = "hendra-youtube-posts-v1";
const youtubeCacheTtl = 6 * 60 * 60 * 1000;
let visibleTutorialCount = tutorialsPerPage;

function showHomeTab(tabName) {
  homeViews.forEach((view) => {
    view.hidden = view.id !== `home-view-${tabName}`;
  });
  homeTabs.forEach((tab) => {
    const isActive = tab.dataset.homeTab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
}

homeTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    showHomeTab(trigger.dataset.homeTab);
  });
});

homeTabs.forEach((tab) => {
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const currentIndex = [...homeTabs].indexOf(tab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = homeTabs[(currentIndex + direction + homeTabs.length) % homeTabs.length];
    showHomeTab(nextTab.dataset.homeTab);
    nextTab.focus();
  });
});

showHomeTab("content");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function getDescriptionPreview(value, maxLength = 150) {
  const description = String(value ?? "").trim();
  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength).trimEnd()}...`;
}

function updateVideoListSchema() {
  const schemaElement = document.querySelector("#video-list-schema");
  if (!schemaElement) return;
  const items = tutorials
    .filter((tutorial) => tutorial.youtubeId && tutorial.youtubeUrl)
    .map((tutorial, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: tutorial.youtubeUrl,
      item: {
        "@type": "VideoObject",
        name: tutorial.title,
        description: tutorial.fullDescription || tutorial.description || tutorial.title,
        thumbnailUrl: tutorial.image ? [tutorial.image] : [],
        uploadDate: tutorial.uploadDate || undefined,
        contentUrl: tutorial.youtubeUrl,
        url: tutorial.youtubeUrl
      }
    }));
  schemaElement.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items
  }).replace(/</g, "\\u003c");
}

function renderCards() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const filtered = tutorials.filter((tutorial) => {
    const searchable = `${tutorial.title} ${tutorial.description} ${tutorial.category}`.toLocaleLowerCase("id");
    return searchable.includes(query);
  });

  grid.innerHTML = filtered.slice(0, visibleTutorialCount).map((tutorial, index) => `
    <article class="tutorial-card" style="animation-delay:${index * 55}ms">
      <a class="card-image-wrap" href="article.html?id=${encodeURIComponent(tutorial.id)}" aria-label="Buka ${escapeHtml(tutorial.title)}">
        <img src="${escapeHtml(tutorial.image)}" alt="${escapeHtml(tutorial.alt)}" loading="lazy">
        <span class="card-category">${escapeHtml(tutorial.category).toUpperCase()}</span>
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${escapeHtml(tutorial.date)}</span><span>${escapeHtml(tutorial.readTime)}</span></div>
        <h3><a href="article.html?id=${encodeURIComponent(tutorial.id)}">${escapeHtml(tutorial.title)}</a></h3>
        <p>${escapeHtml(getDescriptionPreview(tutorial.description))}</p>
        <p class="card-views">${viewCounts[tutorial.id] || 0} kunjungan</p>
        <div class="card-actions">
          <a class="read-link" href="article.html?id=${encodeURIComponent(tutorial.id)}">Baca selengkapnya <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </article>
  `).join("");

  resultsCount.textContent = `${String(filtered.length).padStart(2, "0")} TUTORIAL`;
  emptyState.hidden = filtered.length > 0;
  loadMoreButton.hidden = visibleTutorialCount >= filtered.length || filtered.length === 0;
  updateVideoListSchema();
}

function applySiteSettings(settings) {
  const merged = { ...defaultSiteSettings, ...settings };
  document.title = merged.pageTitle;
  document.querySelector('meta[name="description"]').content = merged.metaDescription;
  const heroImage = document.querySelector("#hero-image");
  try {
    const imageUrl = new URL(normalizeImageUrl(merged.heroImage));
    if (imageUrl.protocol === "https:") heroImage.src = imageUrl.href;
  } catch {
    heroImage.src = defaultSiteSettings.heroImage;
  }
  heroImage.alt = merged.heroImageAlt || defaultSiteSettings.heroImageAlt;
  heroImage.style.objectPosition = `${merged.heroImagePositionX ?? defaultSiteSettings.heroImagePositionX}% ${merged.heroImagePositionY ?? defaultSiteSettings.heroImagePositionY}%`;
  heroImage.style.transform = `scale(${Number(merged.heroImageZoom ?? defaultSiteSettings.heroImageZoom) / 100})`;
  document.querySelector("#site-brand").textContent = merged.brandName;
  document.querySelector("#footer-brand").textContent = merged.brandName;
  document.querySelector("#site-brand").setAttribute("aria-label", `${merged.brandName}, beranda`);

  for (const [key, id] of Object.entries({
    heroEyebrow: "hero-eyebrow",
    heroTitleLine1: "hero-title-line-1",
    heroTitleAccent: "hero-title-accent",
    heroTitleLine2: "hero-title-line-2",
    heroDescription: "hero-description",
    heroButtonLabel: "hero-button-label",
    tutorialEyebrow: "tutorial-eyebrow",
    tutorialTitle: "tutorial-title",
    tutorialAsideLine1: "tutorial-aside-line-1",
    tutorialAsideLine2: "tutorial-aside-line-2",
    aboutEyebrow: "about-eyebrow",
    aboutTitleLine1: "about-title-line-1",
    aboutTitleLine2: "about-title-line-2",
    aboutDescription: "about-description"
  })) {
    document.getElementById(id).textContent = merged[key];
  }
}

function readYoutubeCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(youtubeCacheKey) || "null");
    if (!Array.isArray(cached?.posts) || !Number.isFinite(cached.savedAt)) return null;
    return cached;
  } catch (error) {
    console.warn("Cache video YouTube tidak dapat dibaca.", error);
    return null;
  }
}

function writeYoutubeCache(posts) {
  try {
    localStorage.setItem(youtubeCacheKey, JSON.stringify({ posts, savedAt: Date.now() }));
  } catch (error) {
    console.warn("Cache video YouTube tidak dapat disimpan.", error);
  }
}

function showYoutubeFeedStatus(message, isError = false, canRetry = false) {
  youtubeFeedStatus.textContent = message;
  youtubeFeedStatus.classList.toggle("is-error", isError);
  youtubeFeedStatus.hidden = !message;
  youtubeFeedRetry.hidden = !canRetry;
}

function mergeYoutubePosts(posts) {
  youtubePosts = posts;
  const nonYoutubePosts = tutorials.filter((tutorial) => !tutorial.id.startsWith("youtube-"));
  tutorials = [...youtubePosts, ...nonYoutubePosts];
  visibleTutorialCount = tutorialsPerPage;
  renderCards();
}

function applyViewCounts(snapshot) {
  viewCounts = {};
  snapshot.forEach((view) => {
    const postId = view.data().postId;
    if (postId) viewCounts[postId] = (viewCounts[postId] || 0) + 1;
  });
  renderCards();
}

async function loadYoutubePosts(forceRefresh = false) {
  const cached = readYoutubeCache();
  if (!forceRefresh && cached && Date.now() - cached.savedAt < youtubeCacheTtl) {
    return cached.posts;
  }

  try {
    const response = await fetch("youtube-posts.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Feed YouTube gagal (${response.status}).`);
    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error("Format feed YouTube tidak valid.");
    writeYoutubeCache(posts);
    showYoutubeFeedStatus("");
    return posts;
  } catch (error) {
    console.warn("Feed YouTube gagal dimuat.", error);
    if (cached?.posts?.length) {
      showYoutubeFeedStatus("Gagal memuat video terbaru. Menampilkan video tersimpan.");
      return cached.posts;
    }
    showYoutubeFeedStatus("Gagal memuat video, silakan coba lagi nanti.", true, true);
    return [];
  }
}

searchInput.addEventListener("input", () => {
  visibleTutorialCount = tutorialsPerPage;
  renderCards();
});
loadMoreButton.addEventListener("click", () => {
  visibleTutorialCount += tutorialsPerPage;
  renderCards();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#feedback-name").value.trim() || "Pengunjung website";
  const email = document.querySelector("#feedback-email").value.trim() || "Tidak dicantumkan";
  const message = document.querySelector("#feedback-message").value.trim();
  const subject = encodeURIComponent(`Masukan website dari ${name}`);
  const body = encodeURIComponent(`Nama: ${name}\nEmail: ${email}\n\nMasukan:\n${message}`);
  window.location.href = `mailto:hendrakurniawanto@gmail.com?subject=${subject}&body=${body}`;
  feedbackStatus.textContent = "Aplikasi email sedang dibuka untuk mengirim masukanmu.";
});

renderCards();
applySiteSettings(defaultSiteSettings);

youtubePosts = await loadYoutubePosts();
if (youtubePosts.length) mergeYoutubePosts(youtubePosts);

youtubeFeedRetry.addEventListener("click", async () => {
  youtubeFeedRetry.disabled = true;
  showYoutubeFeedStatus("Mencoba memuat video lagi...");
  const posts = await loadYoutubePosts(true);
  if (posts.length) mergeYoutubePosts(posts);
  youtubeFeedRetry.disabled = false;
});

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    const database = getFirestore(app);
    try {
      const viewSnapshot = await getDocs(collection(database, "pageViews"));
      applyViewCounts(viewSnapshot);
    } catch (error) {
      console.warn("Statistik kunjungan gagal dimuat; postingan tetap ditampilkan.", error);
    }
    try {
      const settingsSnapshot = await getDoc(doc(database, "settings", "site"));
      if (settingsSnapshot.exists()) applySiteSettings(settingsSnapshot.data());
    } catch (error) {
      console.warn("Pengaturan website gagal dimuat; memakai pengaturan lokal.", error);
    }
    try {
      const snapshot = await getDocs(collection(database, "posts"));
      if (!snapshot.empty) {
        tutorials = [
          ...youtubePosts,
          ...snapshot.docs.map((postDocument) => ({ id: postDocument.id, ...postDocument.data() }))
        ];
        tutorials.sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
        renderCards();
      } else if (youtubePosts.length) {
        tutorials = [...youtubePosts, ...defaultTutorials];
        renderCards();
      }
    } catch (error) {
      console.warn("Postingan Firebase gagal dimuat; menampilkan konten lokal.", error);
    }
  } catch (error) {
    console.warn("Postingan Firebase gagal dimuat; menampilkan konten lokal.", error);
  }
}