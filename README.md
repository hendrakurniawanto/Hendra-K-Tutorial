# HENDRA K

Website publik memakai GitHub Pages; login admin dan penyimpanan postingan memakai Firebase. Buka `index.html` untuk melihat situs secara lokal.

## Login admin dan database postingan

Admin ada di `/admin.html`. Login memakai Google, lalu Firebase Authentication dan Firestore membatasi perubahan postingan ke email terverifikasi `hendrakurniawanto@gmail.com`. Pengunjung website membaca postingan dari koleksi Firestore `posts`.

Firebase sudah disiapkan pada project `hendra-k-tutorial`: Google Sign-In aktif, domain GitHub Pages diizinkan, Firestore berada di region Jakarta, dan Rules membatasi penulisan ke akun admin terverifikasi. Konfigurasi aplikasi web ada di `firebase-config.js`; API key Firebase web bukan password, sementara keamanan tulis ditegakkan oleh Rules.

Buka [halaman admin](https://hendrakurniawanto.github.io/Hendra-K-Tutorial/admin.html), masuk dengan akun Google `hendrakurniawanto@gmail.com`, lalu izinkan pop-up untuk situs jika browser memintanya. Login mencoba popup lebih dulu dan memakai redirect jika popup diblokir. Postingan CTR awal otomatis dimasukkan ke koleksi `posts` bila koleksi masih kosong. Postingan yang ditambah, diedit, atau dihapus akan tersimpan di Firestore dan terlihat di situs publik.

Di dashboard yang sama, bagian **Pengaturan website** dapat mengubah judul tab dan deskripsi mesin pencari, nama brand, judul/teks pembuka, judul bagian tutorial, serta teks profil Tentang. Simpan perubahan untuk menerapkannya kepada semua pengunjung. Tombol **Isi default** mengisi ulang nilai awal ke formulir; tekan **Simpan tampilan** untuk benar-benar menerapkannya.

Gambar utama dapat diganti dari kolom **URL gambar utama** dengan alamat gambar HTTPS langsung (misalnya URL berakhiran `.jpg`, `.png`, atau URL gambar CDN). Jika gambar masih ada di perangkat, unggah terlebih dahulu ke layanan hosting gambar pilihanmu, lalu tempel URL langsungnya ke kolom tersebut. Gunakan slider **Posisi horizontal** dan **Posisi vertikal** untuk mengatur crop/titik fokus gambar pada frame hero. Pratinjau tampil di dashboard sebelum disimpan. Gambar untuk tiap postingan bisa diubah dari kolom URL gambar pada form postingan.

Statistik kunjungan memakai koleksi Firestore `pageViews`. Setelah memperbarui aturan pada `firestore.rules`, deploy dengan `firebase deploy --only firestore:rules` agar kunjungan dapat dicatat dan dibaca dashboard admin.

## Sinkronisasi video YouTube

Workflow GitHub Pages memeriksa RSS publik channel YouTube `@hendra.k` setiap 6 jam dan saat workflow dijalankan manual. Daftar video disimpan sebagai feed statis tanpa YouTube Data API key. Seluruh deskripsi video ditampilkan di halaman artikel, sedangkan kartu tutorial memakai ringkasan pendek. RSS publik tidak menyediakan durasi secara konsisten, sehingga filter video panjang/live tidak dapat dijamin tanpa YouTube Data API atau autentikasi tambahan.

Setiap kartu, gambar, dan judul postingan membuka halaman artikel tersendiri. Form admin menyediakan editor isi artikel untuk format tebal/miring, subjudul, daftar, ukuran huruf, margin paragraf, spasi baris, serta tautan pada teks yang dipilih. Untuk menambahkan tautan, pilih kata atau teks lalu klik **Tautkan pilihan** dan masukkan URL. URL YouTube akan menampilkan thumbnail preview; klik preview untuk membuka videonya di YouTube.

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