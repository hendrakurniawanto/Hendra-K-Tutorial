# HENDRA K

Website statis untuk berbagi tutorial. Tidak memerlukan server backend, database, atau biaya hosting. Buka `index.html` untuk melihat situs secara lokal.

## Mengelola postingan

Tombol **Kelola** disembunyikan untuk pengunjung biasa. Untuk menampilkannya, buka alamat website dengan parameter `?admin=1`, misalnya `https://USERNAME.github.io/NAMA-REPO/?admin=1`. Dari panel itu kamu dapat menambahkan postingan, mengedit postingan yang ada, atau menghapusnya. Isian isi postingan ditampilkan sebagai artikel. Gunakan URL gambar publik yang boleh dipakai dan teks alternatif yang menjelaskan gambarnya.

Peringatan: `?admin=1` hanya menyembunyikan tombol dari tampilan biasa, bukan autentikasi. Siapa pun yang mengetahui parameter ini dapat membuka panel; kode situs juga bersifat publik. Perubahan disimpan di `localStorage` browser yang sedang dipakai, tidak tersinkron ke browser pengunjung lain, dan bisa hilang jika data situs dibersihkan.

Untuk pengelolaan yang benar-benar hanya bisa dilakukan admin dan menerbitkan konten bersama, situs memerlukan backend/database serta autentikasi admin. Hosting statis saja tidak dapat menerbitkan perubahan `localStorage` menjadi konten bersama.

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