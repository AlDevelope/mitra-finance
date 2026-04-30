# Mitra Finance 99 - Digital System

Aplikasi manajemen angsuran barang (digital financing) yang dibangun dengan React, Tailwind CSS, dan Firebase.

## Fitur Utama
- **Dashboard Eksekutif:** Ringkasan keuangan real-time (Uang Cash, Keuntungan, Stokbit, Bank Neo, dll).
- **Manajemen Nasabah:** Pencatatan unit barang yang dicicil, tracking mingguan, dan kalkulasi otomatis.
- **Import Excel:** Unggah data nasabah masal langsung dari file Excel.
- **Simulasi Tagihan WhatsApp:** Kirim notifikasi tagihan profesional ke nasabah via API WhatsApp.
- **Portal Nasabah:** Halaman khusus bagi nasabah untuk melihat progress cicilan mereka sendiri.

## Teknologi
- **Frontend:** React 18, Vite, Motion (Animate), Tailwind CSS.
- **Backend:** Firebase (Firestore & Authentication).
- **Library:** Lucide React (Icons), XLSX (Excel Parser), Recharts.

---

## Cara Install di VS Code (Lokal)

1. **Extract ZIP** yang sudah Anda download.
2. Buka terminal di folder tersebut.
3. Jalankan perintah:
   ```bash
   npm install
   ```
4. Setelah instalasi selesai, jalankan aplikasi:
   ```bash
   npm run dev
   ```
5. Aplikasi akan berjalan di `http://localhost:3000`.

---

## Konfigurasi Akun & Database

### 1. File Firebase Config
Seluruh kredensial database ada di file `firebase-applet-config.json`. Anda tidak perlu mengubah ini jika ingin menggunakan database yang sudah saya buatkan. Jika ingin memindahkan ke project Firebase lain, ganti isi file tersebut dengan config dari Firebase Console Anda.

### 2. Akun Admin
- **Email:** `admin@mitrafinance99.com`
- **Password:** `admin123`
*(Gunakan tombol "Daftar Admin" di halaman Login jika akun belum terdaftar di Auth lokal).*

---

## Cara Deploy ke Netlify

1. **Build Aplikasi:**
   Jalankan `npm run build` di terminal VS Code Anda. Folder `dist` akan muncul.
2. **Unggah ke Netlify:**
   - Masuk ke [Netlify](https://app.netlify.com/).
   - Tarik (Drag & Drop) folder **`dist`** tersebut ke area "Add a new site".
3. **Konfigurasi Route (PENTING):**
   Karena ini adalah Single Page Application (SPA), buat file baru bernama `_redirects` (tanpa ekstensi) di dalam folder `public` (sebelum build) atau di dalam `dist` (setelah build) dengan isi:
   ```
   /*    /index.html   200
   ```
   Hal ini agar saat halaman di-refresh, tidak muncul error 404.

---

## Mengubah Data Awal (Excel)
Data awal yang saya masukkan ada di file `src/lib/seed.ts`. Anda bisa mengubah isi array `INITIAL_NASABAH` di sana untuk menyesuaikan dengan data terbaru Anda sebelum melakukan deploy final.

---
*"Berkembang, Bertumbuh, Berinovasi"*
**Mitra Finance 99**
