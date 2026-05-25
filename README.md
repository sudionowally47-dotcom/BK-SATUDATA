# LAYANAN BK SATU DATA - SMP NEGERI 4 FAKFAK

Aplikasi web Bimbingan dan Konseling (BK) modern, profesional, dan responsif yang dirancang untuk **SMP Negeri 4 Fakfak**. Sistem ini menggunakan **Google Spreadsheet** sebagai database utama melalui perantara **Google Apps Script** dan siap untuk di-deploy ke **Vercel** melalui integrasi **GitHub**.

---

## 🚀 STRUKTUR & ARCHITECTURE APLIKASI
*   **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, dan XLSX (Parser/Generator).
*   **Backend**: Google Apps Script (`Code.gs`) bertindak sebagai serverless API & middleware.
*   **Database**: Google Spreadsheet. Setiap tabel direpresentasikan sebagai sheet terpisah (`Siswa`, `GuruBK`, `Kelas`, `LayananBK`, `AsesmenSiswa`, `Surat`, `JadwalKonseling`, Buku `BukuKasus`, dan `HomeVisit`).

---

## 📂 CARA SETUP DATABASE (GOOGLE SPREADSHEET & APPS SCRIPT)

1.  **Buat Spreadsheet**:
    *   Buka [Google Sheets](https://sheets.google.com) dan buat dokumen baru bernama `Database BK SMPN 4 Fakfak`.
2.  **Buka Script Editor**:
    *   Di menu atas, pilih **Ekstensi** > **Apps Script**.
3.  **Salin & Inisialisasi Kode Backend**:
    *   Hapus kode bawaan di file `Code.gs`.
    *   Salin seluruh isi source code `Code.gs` yang disediakan di menu **Pengaturan** aplikasi ini, lalu tempelkan.
    *   **Penting**: Jalankan fungsi `setup` di editor Apps Script (Pilih `setup` di toolbar, lalu klik Run ▶️) untuk membuat **21 Sheet Otomatis**.
4.  **Lakukan Deployment**:
    *   Klik tombol **Terapkan (Deploy)** > **Penerapan Baru (New deployment)**.
    *   Pilih jenis: **Aplikasi web (Web app)**.
    *   **Jalankan sebagai**: Pilih akun Google Anda (Me/Saya).
    *   **Siapa yang memiliki akses**: Pilih **Siapa saja (Anyone)** agar frontend bisa melakukan transaksi data.
    *   Klik **Terapkan** dan izinkan akses (*Authorize access*).
    *   Salin **URL Aplikasi Web (Web App URL)** yang dihasilkan.
5.  **Sambungkan ke Aplikasi**:
    *   Masuk ke portal aplikasi ini sebagai admin (`admin` / `admin55`).
    *   Buka menu **Pengaturan** > **API & Apps Script**.
    *   Tempelkan URL tersebut ke kolom input dan klik **Simpan & Tes Koneksi**.

---

## 🛠️ INTEGRASI GITHUB & DEPLOY KE VERCEL

Aplikasi ini siap di-deploy secara instan ke Vercel dengan alur Continuous Integration/Continuous Deployment (CI/CD) melalui GitHub.

### Langkah 1: Push ke GitHub
1.  Buat repositori baru di akun GitHub Anda (misal: `layanan-bk-smpn4-fakfak`).
2.  Inisialisasi git pada komputer Anda dan push kode ke repositori tersebut:
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Layanan BK Satu Data"
    git branch -M main
    git remote add origin https://github.com/USERNAME/REPO-ANDA.git
    git push -u origin main
    ```

### Langkah 2: Deploy ke Vercel
1.  Buka dashboard [Vercel](https://vercel.com) dan masuk menggunakan akun GitHub Anda.
2.  Klik **Add New** > **Project**.
3.  Pilih/Impor repositori `layanan-bk-smpn4-fakfak` yang baru saja Anda buat.
4.  Pada bagian **Build & Development Settings**, biarkan pengaturan default (Vercel akan otomatis mendeteksi konfigurasi Vite).
5.  Klik **Deploy**.
6.  Selesai! Aplikasi Anda kini aktif secara global dengan URL aman `https://namaprojek.vercel.app`. Setiap kali Anda melakukan `git push` ke GitHub, Vercel akan otomatis melakukan build ulang dan memperbarui situs Anda.
