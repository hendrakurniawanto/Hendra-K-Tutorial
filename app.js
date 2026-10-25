import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

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

const grid = document.querySelector("#tutorial-grid");
const searchInput = document.querySelector("#tutorial-search");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#article-dialog");
const dialogContent = document.querySelector("#dialog-content");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderCards() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const filtered = tutorials.filter((tutorial) => {
    const searchable = `${tutorial.title} ${tutorial.description} ${tutorial.category}`.toLocaleLowerCase("id");
    return searchable.includes(query);
  });

  grid.innerHTML = filtered.map((tutorial, index) => `
    <article class="tutorial-card" style="animation-delay:${index * 55}ms">
      <div class="card-image-wrap">
        <img src="${escapeHtml(tutorial.image)}" alt="${escapeHtml(tutorial.alt)}" loading="lazy">
        <span class="card-category">${escapeHtml(tutorial.category).toUpperCase()}</span>
      </div>
      <div class="card-body">
        <div class="card-meta"><span>${escapeHtml(tutorial.date)}</span><span>${escapeHtml(tutorial.readTime)}</span></div>
        <h3>${escapeHtml(tutorial.title)}</h3>
        <p>${escapeHtml(tutorial.description)}</p>
        <button class="read-link" type="button" data-article="${escapeHtml(tutorial.id)}">Baca tutorial <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  `).join("");

  resultsCount.textContent = `${String(filtered.length).padStart(2, "0")} TUTORIAL`;
  emptyState.hidden = filtered.length > 0;
}

function openArticle(articleId) {
  const tutorial = tutorials.find((item) => item.id === articleId);
  if (!tutorial) return;

  const content = tutorial.content.map((section) => `
    <section>
      <h3>${escapeHtml(section.heading)}</h3>
      ${section.text ? `<p>${escapeHtml(section.text)}</p>` : ""}
      ${section.list ? `<ol>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : ""}
    </section>
  `).join("");

  dialogContent.innerHTML = `
    <img class="dialog-image" src="${escapeHtml(tutorial.image)}" alt="${escapeHtml(tutorial.alt)}">
    <article class="dialog-article">
      <p class="eyebrow">${escapeHtml(tutorial.category).toUpperCase()} &nbsp; / &nbsp; ${escapeHtml(tutorial.readTime)}</p>
      <h2 id="dialog-title">${escapeHtml(tutorial.title)}</h2>
      <p class="dialog-summary">${escapeHtml(tutorial.description)}</p>
      ${content}
      <p class="eyebrow">TETAP BELAJAR, TETAP BERBAGI. &nbsp; — HENDRA K.</p>
    </article>
  `;
  dialog.showModal();
}

searchInput.addEventListener("input", renderCards);
grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-article]");
  if (button) openArticle(button.dataset.article);
});
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput && !dialog.open) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderCards();

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    const database = getFirestore(app);
    const snapshot = await getDocs(collection(database, "posts"));
    if (!snapshot.empty) {
      tutorials = snapshot.docs.map((postDocument) => ({ id: postDocument.id, ...postDocument.data() }));
      tutorials.sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
      renderCards();
    }
  } catch (error) {
    console.warn("Postingan Firebase gagal dimuat; menampilkan konten lokal.", error);
  }
}