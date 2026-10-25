# HENDRA K

Website statis untuk berbagi tutorial. Tidak memerlukan server backend, database, atau biaya hosting. Buka `index.html` untuk melihat situs secara lokal.

## Login admin dan database postingan

Admin ada di `/admin.html`. Login memakai Google, lalu Firebase Authentication dan Firestore membatasi perubahan postingan ke email terverifikasi `hendrakurniawanto@gmail.com`. Pengunjung website membaca postingan dari koleksi Firestore `posts`.

### Setup Firebase satu kali

1. Buat project gratis di [Firebase Console](https://console.firebase.google.com/) atau pilih project yang sudah ada.
2. Tambahkan aplikasi Web di Project settings → General → Your apps. Salin konfigurasi web ke `firebase-config.js`, mengganti setiap nilai `ISI_DARI_FIREBASE_CONSOLE`. Nilai konfigurasi web Firebase memang tersedia di frontend; keamanan tulis dijaga oleh Firestore Rules, bukan dengan menyembunyikan config.
3. Di Authentication → Sign-in method, aktifkan **Google**.
4. Di Authentication → Settings → Authorized domains, tambahkan `hendrakurniawanto.github.io`.
5. Buat database di Firestore Database. Pilih lokasi yang dekat dengan mayoritas pengunjung.
6. Buka Firestore Database → Rules, tempel isi file `firestore.rules`, lalu klik **Publish**. Rules mengizinkan publik membaca postingan, tetapi hanya akun admin terverifikasi yang dapat menulis atau menghapus.
7. Commit dan push `firebase-config.js` yang sudah diisi ke branch `main`. GitHub Actions akan menerbitkan pembaruan website.
8. Buka `https://hendrakurniawanto.github.io/Hendra-K-Tutorial/admin.html`, login dengan `hendrakurniawanto@gmail.com`, dan izinkan pop-up Google. Postingan CTR awal akan otomatis dimasukkan ke Firestore bila koleksi masih kosong.

Jangan pernah membagikan password atau token login. Jangan mengganti Firestore Rules menjadi akses publik tanpa pembatasan tulis. Paket gratis Firebase memiliki kuota dan ketentuan penggunaan yang dapat berubah.

## Terbit online gratis dengan GitHub Pages

GitHub Pages menyajikan website statis dari repository publik tanpa server yang perlu kamu kelola. Workflow di `.github/workflows/pages.yml` akan menerbitkan website setiap kali ada perubahan di branch `main`.

1. Buat repository **public** baru di [github.com/new](https://github.com/new). Jangan centang opsi untuk menambahkan README, karena proyek ini sudah memiliki README.
2. Buka terminal pada folder proyek ini dan jalankan perintah berikut. Ganti `USERNAME` dan `NAMA-REPO` sesuai akun dan nama repository milikmu:

	```powershell
	git init -b main
	git add .
	git commit -m "Siapkan website HENDRA K"
	git remote add origin https://github.com/USERNAME/NAMA-REPO.git
	git push -u origin main
	```

3. Di repository GitHub, buka **Settings → Pages**. Pada bagian **Build and deployment**, pilih **GitHub Actions** sebagai source.
4. Buka tab **Actions** dan tunggu workflow **Deploy static website to GitHub Pages** selesai.
5. Alamat publik biasanya `https://USERNAME.github.io/NAMA-REPO/`. Buka **Settings → Pages** untuk melihat alamat tepatnya.
6. Untuk menerbitkan pembaruan, jalankan `git add .`, `git commit -m "Perbarui website"`, lalu `git push`.

Tidak perlu membeli domain atau menyiapkan server. Kuota dan kebijakan gratis mengikuti ketentuan GitHub. Gambar dan font eksternal memerlukan koneksi internet.

Alternatif drag-and-drop: buka [Netlify Drop](https://app.netlify.com/drop), masuk ke akun gratis, lalu unggah file website. Untuk pembaruan yang tersinkron dari beberapa perangkat, gunakan workflow GitHub Pages di atas.

## Alternatif gratis: GitHub Pages

Unggah file situs ke repository GitHub publik, lalu buka **Settings → Pages**, pilih sumber deploy dari branch utama dan folder root, kemudian simpan. GitHub akan memberi alamat `username.github.io/nama-repository` setelah proses publikasi selesai.