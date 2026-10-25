const storageKey = "hendra-k-posts-v1";
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

function loadTutorials() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Data postingan lokal tidak dapat dibaca.", error);
  }
  return defaultTutorials.map((tutorial) => ({ ...tutorial }));
}

let tutorials = loadTutorials();

const grid = document.querySelector("#tutorial-grid");
const searchInput = document.querySelector("#tutorial-search");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#article-dialog");
const dialogContent = document.querySelector("#dialog-content");
const adminDialog = document.querySelector("#admin-dialog");
const adminOpen = document.querySelector("#admin-open");
const postForm = document.querySelector("#post-form");
const adminPostList = document.querySelector("#admin-post-list");
function updateAdminVisibility() {
  adminOpen.hidden = new URLSearchParams(window.location.search).get("admin") !== "1";
}

updateAdminVisibility();
window.addEventListener("pageshow", updateAdminVisibility);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function saveTutorials() {
  localStorage.setItem(storageKey, JSON.stringify(tutorials));
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

function renderAdminPosts() {
  document.querySelector("#admin-post-count").textContent = `(${tutorials.length})`;
  adminPostList.innerHTML = tutorials.map((tutorial) => `
    <article class="admin-post-row">
      <div><strong>${escapeHtml(tutorial.title)}</strong><span>${escapeHtml(tutorial.category)} · ${escapeHtml(tutorial.date)}</span></div>
      <div class="admin-row-actions">
        <button type="button" data-edit="${escapeHtml(tutorial.id)}">Edit</button>
        <button type="button" data-delete="${escapeHtml(tutorial.id)}" aria-label="Hapus ${escapeHtml(tutorial.title)}">Hapus</button>
      </div>
    </article>
  `).join("") || '<p class="admin-empty">Belum ada postingan. Tambahkan lewat formulir di atas.</p>';
}

function resetPostForm() {
  postForm.reset();
  document.querySelector("#post-id").value = "";
  document.querySelector("#post-read-time").value = "5 MENIT";
  document.querySelector("#post-save").textContent = "Tambah postingan";
  document.querySelector("#post-cancel").hidden = true;
}

adminOpen.addEventListener("click", () => {
  renderAdminPosts();
  adminDialog.showModal();
});
document.querySelector(".admin-close").addEventListener("click", () => adminDialog.close());
document.querySelector("#post-cancel").addEventListener("click", resetPostForm);
postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#post-id").value || `post-${crypto.randomUUID()}`;
  const body = document.querySelector("#post-body").value.trim();
  const post = {
    id,
    title: document.querySelector("#post-title").value.trim(),
    category: document.querySelector("#post-category").value,
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()).toUpperCase(),
    readTime: document.querySelector("#post-read-time").value.trim(),
    description: document.querySelector("#post-description").value.trim(),
    image: document.querySelector("#post-image").value.trim(),
    alt: document.querySelector("#post-alt").value.trim(),
    content: [{ heading: "Isi postingan", text: body }]
  };
  const existingIndex = tutorials.findIndex((tutorial) => tutorial.id === id);
  if (existingIndex === -1) tutorials.unshift(post);
  else tutorials[existingIndex] = post;
  saveTutorials();
  renderCards();
  renderAdminPosts();
  resetPostForm();
});

adminPostList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const post = tutorials.find((tutorial) => tutorial.id === editButton.dataset.edit);
    if (!post) return;
    document.querySelector("#post-id").value = post.id;
    document.querySelector("#post-title").value = post.title;
    document.querySelector("#post-category").value = post.category;
    document.querySelector("#post-read-time").value = post.readTime;
    document.querySelector("#post-description").value = post.description;
    document.querySelector("#post-image").value = post.image;
    document.querySelector("#post-alt").value = post.alt;
    document.querySelector("#post-body").value = post.content.map((section) => section.text || (section.list || []).join("\n")).join("\n\n");
    document.querySelector("#post-save").textContent = "Simpan perubahan";
    document.querySelector("#post-cancel").hidden = false;
    document.querySelector("#post-title").focus();
  }
  if (deleteButton) {
    const post = tutorials.find((tutorial) => tutorial.id === deleteButton.dataset.delete);
    if (!post || !window.confirm(`Hapus postingan “${post.title}”?`)) return;
    tutorials = tutorials.filter((tutorial) => tutorial.id !== post.id);
    saveTutorials();
    renderCards();
    renderAdminPosts();
    if (document.querySelector("#post-id").value === post.id) resetPostForm();
  }
});

renderCards();