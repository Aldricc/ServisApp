<div align="center">
  <img src="./assets/images/icon.png" alt="Flashcom Logo" width="120">
  <h1>⚡ Flashcom - Service Management App</h1>
  <p>Aplikasi Modern Pencatatan & Monitoring Servis Perangkat IT untuk Instansi</p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/Google_Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white" alt="Google Sheets" />
  </p>
</div>

---

## 📖 Tentang Aplikasi
**Flashcom** adalah aplikasi *mobile* ringkas nan elegan untuk mengelola daftar perbaikan perangkat keras (seperti Laptop, Printer, CCTV, dll) milik antrian berbagai **Instansi/Pelanggan**. 

Aplikasi ini dapat dioperasikan secara **Luring (Offline First)** menggunakan penyimpanan perangkat, namun juga mendukung **Sinkronisasi Langsung ke Google Sheets** agar data dapat secara simultan dikelola oleh staf lain melalui komputer Desktop.

<div align="center">
  *(Tangkapan Layar)*<br/>
  Dashboard Utama &nbsp;&nbsp;|&nbsp;&nbsp; Detail Servis &nbsp;&nbsp;|&nbsp;&nbsp; Daftar Instansi
</div>

## ✨ Fitur Utama
1. **Pencatatan Cepat Lintas Instansi** - Mendata perangkat baru dalam hitungan detik (Tipe Barang, Tanggal Masuk, Ruangan, Keterangan).
2. **Dashboard & Ringkasan Cerdas** - Antarmuka modern yang menampilkan hitungan *badges* servis: Masuk, Selesai, dan Tertunda.
3. **Penyimpanan Lokal Persisten** - Tidak perlu koneksi internet untuk mengelola pencatatan harian berkat `AsyncStorage`.
4. **Google Sheets API Sync (Dua Arah)** - Sekali klik, cadangkan semua data lokal ke *Google Drive* kamu atau unduh perubahan tabel (Pull-down) secara *Real-Time*.
5. **Konversi Cetak (.CSV)** - Ubah rekapitulasi data satu Instansi menjadi laporan `.csv` (*Excel*) lalu bagikan lewat WhatsApp atau Email langsung dari ponsel.

## 🛠️ Tech Stack
- **Framework Utama:** [React Native](https://reactnative.dev/) (dengan ekosistem [Expo](https://expo.dev/))
- **Bahasa:** TypeScript / JavaScript
- **Penyimpanan Lokal:** `@react-native-async-storage/async-storage`
- **Routing:** Expo Router (File-based routing)
- **Ekspor Berkas:** `expo-file-system`, `expo-sharing`
- **Tampilan CSS:** Stylesheet murni bergaya modern-minimalis (Mirip *Tailwind/Glassmorphism*).

## 🚀 Cara Mulai (Development)

Jika kamu ingin menjalankan kode sumber lokal ke komputermu:

1. **Clone Repositori ini:**
   ```bash
   git clone https://github.com/Aldricc/ServisApp.git
   cd ServisApp
   ```

2. **Pasang Dependensi (NPM):**
   ```bash
   npm install
   ```

3. **Nyalakan Server Expo:**
   ```bash
   npx expo start
   ```
   > Pindai kode QR yang muncul dengan aplikasi **Expo Go** (Bagi Android & iOS).

## 📱 Build Production (APK Android)
Aplikasi ini sudah dikonfigurasi menggunakan **EAS Build** (Expo Application Services).
Kamu bisa mencetak keluaran file `.apk` secara gratis di komputermu dengan:

```bash
# Login akun Expo jika belum
npx eas-cli login

# Mulai pencetakan
eas build -p android --profile preview
```
Tunggu sekitar 5–10 menit, URL tautan untuk mengunduh `.apk` akan siap.

## ☁️ Setting Google Sheets API
Aplikasi membaca parameter `keteranganPerbaikan` dkk untuk dikirimkan secara fetch POST/GET.
1. Buat **Spreadsheet Baru** di Google Drive.
2. Buka *Extensions* -> *Apps Script*.
3. Salin kode konektor *doPost* & *doGet* ke dalam Editor, berikan otorisasi.
4. Klik **Deploy as Web App** (Set Akses ke `Anyone`).
5. Salin URL Web App yang dihasilkan.
6. Masukkan URL tersebut ke tab **Pengaturan** di Aplikasi Flashcom ini! Siap disinkronkan.

---
> Dibuat dengan cinta untuk mempermudah produktivitas teknisi IT 🎧💻
