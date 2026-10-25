# HENDRA K

Website publik memakai GitHub Pages; login admin dan penyimpanan postingan memakai Firebase. Buka `index.html` untuk melihat situs secara lokal.

## Login admin dan database postingan

Admin ada di `/admin.html`. Login memakai Google, lalu Firebase Authentication dan Firestore membatasi perubahan postingan ke email terverifikasi `hendrakurniawanto@gmail.com`. Pengunjung website membaca postingan dari koleksi Firestore `posts`.

Firebase sudah disiapkan pada project `hendra-k-tutorial`: Google Sign-In aktif, domain GitHub Pages diizinkan, Firestore berada di region Jakarta, dan Rules membatasi penulisan ke akun admin terverifikasi. Konfigurasi aplikasi web ada di `firebase-config.js`; API key Firebase web bukan password, sementara keamanan tulis ditegakkan oleh Rules.

Buka [halaman admin](https://hendrakurniawanto.github.io/Hendra-K-Tutorial/admin.html), masuk dengan akun Google `hendrakurniawanto@gmail.com`, lalu izinkan pop-up Google. Postingan CTR awal otomatis dimasukkan ke koleksi `posts` bila koleksi masih kosong. Postingan yang ditambah, diedit, atau dihapus akan tersimpan di Firestore dan terlihat di situs publik.

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

Hosting GitHub Pages gratis mengikuti kuota dan kebijakan GitHub. Gambar dan font eksternal memerlukan koneksi internet.