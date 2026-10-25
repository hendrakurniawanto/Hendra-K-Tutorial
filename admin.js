import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { adminEmail, firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultPosts } from "./posts-data.js";
import { defaultSiteSettings } from "./site-settings.js";

const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const postForm = document.querySelector("#post-form");
const postList = document.querySelector("#admin-post-list");
const settingsForm = document.querySelector("#site-settings-form");
const googleLogin = document.querySelector("#google-login");
let auth;
let database;
let posts = [];
let siteSettings = { ...defaultSiteSettings };
let activeAdminUid = "";
let signInInProgress = false;
const redirectAttemptKey = "hendra-k-admin-redirect-pending";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function showMessage(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle("is-error", isError);
}

function getErrorMessage(error) {
  const messages = {
    "auth/unauthorized-domain": "Domain website belum diizinkan di Firebase Authentication.",
    "auth/popup-closed-by-user": "Jendela login ditutup sebelum proses selesai.",
    "auth/popup-blocked": "Popup login diblokir browser. Izinkan popup untuk website ini lalu coba lagi.",
    "auth/cancelled-popup-request": "Permintaan login lain sedang berjalan. Tunggu sebentar lalu coba lagi.",
    "auth/network-request-failed": "Koneksi login Google gagal. Periksa koneksi internet lalu coba lagi.",
    "auth/operation-not-allowed": "Login Google belum diaktifkan pada Firebase Authentication.",
    "auth/invalid-credential": "Login Google tidak berhasil. Pilih akun admin yang benar lalu coba lagi.",
    "permission-denied": "Akses ditolak Firestore. Pastikan Firestore Rules dan email admin sudah benar.",
    "unavailable": "Firebase tidak dapat dijangkau. Periksa koneksi internet."
  };
  return messages[error.code] || `Terjadi kendala: ${error.message || error.code || "kesalahan tidak diketahui"}`;
}

function requireConfiguredFirebase() {
  if (isFirebaseConfigured) return true;
  googleLogin.disabled = true;
  showMessage(loginMessage, "Firebase belum dikonfigurasi. Ikuti langkah setup di README.md terlebih dahulu.", true);
  return false;
}

if (requireConfiguredFirebase()) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
    getRedirectResult(auth).then((result) => {
      const returnedFromRedirect = sessionStorage.getItem(redirectAttemptKey) === "1";
      sessionStorage.removeItem(redirectAttemptKey);
      if (result?.user) {
        signInInProgress = false;
        showMessage(loginMessage, "Login berhasil. Membuka dashboard admin...");
        handleAuthenticatedUser(result.user);
      } else if (returnedFromRedirect && !auth.currentUser) {
        signInInProgress = false;
        showMessage(loginMessage, "Google mengembalikan ke website tanpa sesi login. Coba lagi, dan pilih akun admin yang sama.", true);
      }
    }).catch((error) => {
      sessionStorage.removeItem(redirectAttemptKey);
      showMessage(loginMessage, getErrorMessage(error), true);
    });
  } catch (error) {
    googleLogin.disabled = true;
    showMessage(loginMessage, getErrorMessage(error), true);
  }
}

async function loadPosts() {
  const snapshot = await getDocs(collection(database, "posts"));
  posts = snapshot.docs.map((postDocument) => ({ id: postDocument.id, ...postDocument.data() }));
  if (posts.length === 0) {
    for (const post of defaultPosts) {
      const { id, ...postData } = post;
      await setDoc(doc(database, "posts", id), { ...postData, createdAt: Date.now() });
      posts.push({ id, ...postData, createdAt: Date.now() });
    }
    showMessage(dashboardMessage, "Postingan awal berhasil dimasukkan ke database.");
  }
  renderPosts();
}

function fillSettingsForm(settings) {
  for (const [key, value] of Object.entries(defaultSiteSettings)) {
    settingsForm.elements.namedItem(key).value = settings[key] ?? value;
  }
  updateSettingsImagePreview(settings.heroImage ?? defaultSiteSettings.heroImage, settings.heroImageAlt ?? defaultSiteSettings.heroImageAlt);
}

function updateSettingsImagePreview(url, altText) {
  const preview = document.querySelector("#settings-image-preview");
  preview.src = url;
  preview.alt = altText || "Pratinjau gambar utama website";
}

settingsForm.elements.namedItem("heroImage").addEventListener("input", (event) => {
  updateSettingsImagePreview(event.target.value, settingsForm.elements.namedItem("heroImageAlt").value);
});
settingsForm.elements.namedItem("heroImageAlt").addEventListener("input", (event) => {
  updateSettingsImagePreview(settingsForm.elements.namedItem("heroImage").value, event.target.value);
});
document.querySelector("#settings-image-preview").addEventListener("error", (event) => {
  event.currentTarget.classList.add("is-broken");
});
document.querySelector("#settings-image-preview").addEventListener("load", (event) => {
  event.currentTarget.classList.remove("is-broken");
});

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function loadSiteSettings() {
  const snapshot = await getDoc(doc(database, "settings", "site"));
  siteSettings = snapshot.exists()
    ? { ...defaultSiteSettings, ...snapshot.data() }
    : { ...defaultSiteSettings };
  fillSettingsForm(siteSettings);
}

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = document.querySelector("#settings-save");
  submit.disabled = true;
  showMessage(dashboardMessage, "Menyimpan pengaturan website...");
  const updatedSettings = Object.fromEntries(
    Object.keys(defaultSiteSettings).map((key) => [key, settingsForm.elements.namedItem(key).value.trim()])
  );
  if (!isHttpsUrl(updatedSettings.heroImage)) {
    showMessage(dashboardMessage, "URL gambar harus diawali https://.", true);
    submit.disabled = false;
    return;
  }

  try {
    await setDoc(doc(database, "settings", "site"), updatedSettings);
    siteSettings = updatedSettings;
    showMessage(dashboardMessage, "Tampilan website diperbarui untuk semua pengunjung.");
  } catch (error) {
    showMessage(dashboardMessage, getErrorMessage(error), true);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#settings-reset").addEventListener("click", () => {
  fillSettingsForm(defaultSiteSettings);
  showMessage(dashboardMessage, "Nilai default sudah diisikan. Klik Simpan tampilan untuk menerapkannya.");
});

function renderPosts() {
  document.querySelector("#admin-post-count").textContent = `(${posts.length})`;
  postList.innerHTML = posts.map((post) => `
    <article class="admin-post-row">
      <div><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.category)} · ${escapeHtml(post.date)}</span></div>
      <div class="admin-row-actions">
        <button type="button" data-edit="${escapeHtml(post.id)}">Edit</button>
        <button type="button" data-delete="${escapeHtml(post.id)}" aria-label="Hapus ${escapeHtml(post.title)}">Hapus</button>
      </div>
    </article>
  `).join("") || '<p class="admin-empty">Belum ada postingan.</p>';
}

function resetForm() {
  postForm.reset();
  document.querySelector("#post-id").value = "";
  document.querySelector("#post-read-time").value = "5 MENIT";
  document.querySelector("#post-save").textContent = "Tambah postingan";
  document.querySelector("#post-cancel").hidden = true;
}

function handleAuthenticatedUser(user) {
  if (!user) {
    if (signInInProgress || sessionStorage.getItem(redirectAttemptKey) === "1") return;
    activeAdminUid = "";
    loginPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }

  if (user.email?.toLowerCase() !== adminEmail) {
    activeAdminUid = "";
    loginPanel.hidden = false;
    dashboard.hidden = true;
    const account = user.email || "akun tanpa email";
    showMessage(loginMessage, `Kamu masuk sebagai ${account}. Admin yang diizinkan adalah ${adminEmail}. Pilih akun admin saat login.`, true);
    signOut(auth).catch((error) => console.warn("Gagal mengakhiri sesi non-admin.", error));
    return;
  }

  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#signed-in-email").textContent = user.email;
  if (activeAdminUid === user.uid) return;
  activeAdminUid = user.uid;
  if (!user.emailVerified) {
    showMessage(dashboardMessage, "Login berhasil, tetapi Google belum menandai email terverifikasi. Firestore dapat menolak penyimpanan sampai verifikasi email tersedia.", true);
  } else {
    showMessage(loginMessage, "Login berhasil.");
  }
  loadPosts().catch((error) => showMessage(dashboardMessage, getErrorMessage(error), true));
  loadSiteSettings().catch((error) => showMessage(dashboardMessage, getErrorMessage(error), true));
}

if (auth) {
  onAuthStateChanged(auth, (user) => handleAuthenticatedUser(user), (error) => {
    showMessage(loginMessage, getErrorMessage(error), true);
  });
}

googleLogin.addEventListener("click", async () => {
  if (!auth) return;
  signInInProgress = true;
  googleLogin.disabled = true;
  showMessage(loginMessage, "Menghubungkan ke Google...");
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, provider);
      signInInProgress = false;
      handleAuthenticatedUser(result.user);
    } catch (error) {
      if (error.code !== "auth/popup-blocked") {
        signInInProgress = false;
        throw error;
      }
      showMessage(loginMessage, "Popup diblokir browser. Melanjutkan login dengan redirect...");
      sessionStorage.setItem(redirectAttemptKey, "1");
      await signInWithRedirect(auth, provider);
    }
  } catch (error) {
    signInInProgress = false;
    sessionStorage.removeItem(redirectAttemptKey);
    showMessage(loginMessage, getErrorMessage(error), true);
  } finally {
    googleLogin.disabled = false;
  }
});

document.querySelector("#sign-out").addEventListener("click", () => signOut(auth));
document.querySelector("#post-cancel").addEventListener("click", resetForm);
postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = document.querySelector("#post-save");
  submit.disabled = true;
  showMessage(dashboardMessage, "Menyimpan postingan...");
  const id = document.querySelector("#post-id").value || crypto.randomUUID();
  const previous = posts.find((post) => post.id === id);
  const body = document.querySelector("#post-body").value.trim();
  const post = {
    title: document.querySelector("#post-title").value.trim(),
    category: document.querySelector("#post-category").value,
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()).toUpperCase(),
    readTime: document.querySelector("#post-read-time").value.trim(),
    description: document.querySelector("#post-description").value.trim(),
    image: document.querySelector("#post-image").value.trim(),
    alt: document.querySelector("#post-alt").value.trim(),
    content: [{ heading: "Isi postingan", text: body }],
    createdAt: previous?.createdAt || Date.now()
  };

  try {
    await setDoc(doc(database, "posts", id), post);
    const index = posts.findIndex((item) => item.id === id);
    if (index < 0) posts.unshift({ id, ...post });
    else posts[index] = { id, ...post };
    renderPosts();
    resetForm();
    showMessage(dashboardMessage, "Postingan tersimpan dan sudah tersedia di website publik.");
  } catch (error) {
    showMessage(dashboardMessage, getErrorMessage(error), true);
  } finally {
    submit.disabled = false;
  }
});

postList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const post = posts.find((item) => item.id === editButton.dataset.edit);
    if (!post) return;
    document.querySelector("#post-id").value = post.id;
    document.querySelector("#post-title").value = post.title;
    document.querySelector("#post-category").value = post.category;
    document.querySelector("#post-read-time").value = post.readTime;
    document.querySelector("#post-description").value = post.description;
    document.querySelector("#post-image").value = post.image;
    document.querySelector("#post-alt").value = post.alt;
    document.querySelector("#post-body").value = (post.content || []).map((section) => section.text || (section.list || []).join("\n")).join("\n\n");
    document.querySelector("#post-save").textContent = "Simpan perubahan";
    document.querySelector("#post-cancel").hidden = false;
    document.querySelector("#post-title").focus();
  }
  if (deleteButton) {
    const post = posts.find((item) => item.id === deleteButton.dataset.delete);
    if (!post || !window.confirm(`Hapus postingan “${post.title}”?`)) return;
    try {
      await deleteDoc(doc(database, "posts", post.id));
      posts = posts.filter((item) => item.id !== post.id);
      renderPosts();
      showMessage(dashboardMessage, "Postingan sudah dihapus dari website.");
      if (document.querySelector("#post-id").value === post.id) resetForm();
    } catch (error) {
      showMessage(dashboardMessage, getErrorMessage(error), true);
    }
  }
});
