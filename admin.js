import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { adminEmail, firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { defaultPosts } from "./posts-data.js";

const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const postForm = document.querySelector("#post-form");
const postList = document.querySelector("#admin-post-list");
const googleLogin = document.querySelector("#google-login");
let auth;
let database;
let posts = [];

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

function setAdminView(user) {
  const isAdmin = user?.email?.toLowerCase() === adminEmail && user.emailVerified;
  loginPanel.hidden = Boolean(isAdmin);
  dashboard.hidden = !isAdmin;
  if (isAdmin) {
    document.querySelector("#signed-in-email").textContent = user.email;
    loadPosts().catch((error) => showMessage(dashboardMessage, getErrorMessage(error), true));
  }
}

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setAdminView(null);
      return;
    }
    if (user.email?.toLowerCase() !== adminEmail || !user.emailVerified) {
      await signOut(auth);
      showMessage(loginMessage, `Akun ini tidak memiliki akses admin. Gunakan ${adminEmail}.`, true);
      return;
    }
    setAdminView(user);
  });
}

googleLogin.addEventListener("click", async () => {
  if (!auth) return;
  googleLogin.disabled = true;
  showMessage(loginMessage, "Menghubungkan ke Google...");
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  } catch (error) {
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
