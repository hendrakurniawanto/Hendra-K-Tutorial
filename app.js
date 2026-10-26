import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { collection, doc, getDoc, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultSiteSettings } from "./site-settings.js";

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

const grid = document.querySelector("#tutorial-grid");
const searchInput = document.querySelector("#tutorial-search");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");

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

function renderCards() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const filtered = tutorials.filter((tutorial) => {
    const searchable = `${tutorial.title} ${tutorial.description} ${tutorial.category}`.toLocaleLowerCase("id");
    return searchable.includes(query);
  });

  grid.innerHTML = filtered.map((tutorial, index) => `
    <article class="tutorial-card" style="animation-delay:${index * 55}ms">
      <a class="card-image-wrap" href="article.html?id=${encodeURIComponent(tutorial.id)}" aria-label="Buka ${escapeHtml(tutorial.title)}">
        <img src="${escapeHtml(tutorial.image)}" alt="${escapeHtml(tutorial.alt)}" loading="lazy">
        <span class="card-category">${escapeHtml(tutorial.category).toUpperCase()}</span>
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${escapeHtml(tutorial.date)}</span><span>${escapeHtml(tutorial.readTime)}</span></div>
        <h3><a href="article.html?id=${encodeURIComponent(tutorial.id)}">${escapeHtml(tutorial.title)}</a></h3>
        <p>${escapeHtml(getDescriptionPreview(tutorial.description))}</p>
        <div class="card-actions">
          <a class="read-link" href="article.html?id=${encodeURIComponent(tutorial.id)}">Baca selengkapnya <span aria-hidden="true">↗</span></a>
          ${tutorial.youtubeUrl ? `<a class="read-link" href="${escapeHtml(tutorial.youtubeUrl)}" target="_blank" rel="noopener noreferrer">Tonton di YouTube <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </div>
    </article>
  `).join("");

  resultsCount.textContent = `${String(filtered.length).padStart(2, "0")} TUTORIAL`;
  emptyState.hidden = filtered.length > 0;
}

function applySiteSettings(settings) {
  const merged = { ...defaultSiteSettings, ...settings };
  document.title = merged.pageTitle;
  document.querySelector('meta[name="description"]').content = merged.metaDescription;
  const heroImage = document.querySelector("#hero-image");
  try {
    const imageUrl = new URL(merged.heroImage);
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

async function loadYoutubePosts() {
  try {
    const response = await fetch(`youtube-posts.json?v=${Date.now()}`);
    if (!response.ok) return [];
    const posts = await response.json();
    return Array.isArray(posts) ? posts : [];
  } catch (error) {
    console.warn("Feed YouTube gagal dimuat; melanjutkan tanpa postingan YouTube.", error);
    return [];
  }
}

searchInput.addEventListener("input", renderCards);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderCards();
applySiteSettings(defaultSiteSettings);

youtubePosts = await loadYoutubePosts();
if (youtubePosts.length) {
  tutorials = [...youtubePosts, ...defaultTutorials];
  renderCards();
}

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    const database = getFirestore(app);
    const settingsSnapshot = await getDoc(doc(database, "settings", "site"));
    if (settingsSnapshot.exists()) applySiteSettings(settingsSnapshot.data());
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
}