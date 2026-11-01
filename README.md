# Aplikasi Absensi & Timesheet Generator BPL

Aplikasi web cerdas untuk pencatatan absensi harian (Clock In & Clock Out) dan pembuatan **Timesheet Bulanan Otomatis 1-Klik** sesuai template resmi **PT. Bahtera Pesat Lintasbuana (BPL)**.

---

## ✨ Fitur Utama

1. **Clock In & Clock Out Cepat (Waktu Device Aktual)**
   - Mengambil jam aktual langsung dari perangkat Anda (tanpa perlu input manual).
   - Menghitung durasi kerja secara otomatis.
   - **Form Clock Out**: Input agenda kerja / kegiatan pengujian UAT (dilengkapi tombol saran cepat seperti *UAT Improvement, Explore, Create TC, BVT*, dll.).
   - Mendukung pencatatan **Lembur (Overtime)** dengan jam mulai & selesai.

2. **Timesheet Bulanan Otomatis ("Tinggal Klik Aja Dah Jadi")**
   - Tarik data absensi langsung dari database untuk bulan yang dipilih (Oktober, November, dll.).
   - Otomatis menyesuaikan jumlah hari dalam bulan (28, 29, 30, atau 31 hari) dengan rumus hari Bahasa Indonesia `=TEXT(...)`.
   - **Form Penyesuaian Data Atas**: Ubah Nama Project, Kode Project, Periode, PM/Contact, NIP, Jabatan, dan Penandatangan secara dinamis sebelum diekspor.
   - Pratinjau tabel interaktif yang menyerupai template Excel asli.
   - **1-Click Export to Excel (.xlsx)**: Langsung menghasilkan file Excel resmi lengkap dengan logo BPL, border, font Tahoma, dan format penandatangan.

3. **Koreksi & Kelola Absensi**
   - Fitur koreksi / input manual jika lupa absen di hari sebelumnya.
   - Pilihan status: *Hadir, Izin (I), Sakit (S), Alpa (A), Cuti (C), Libur*.
   - Fitur **Auto-Fill Hari Kerja** untuk mengisi otomatis jam standar (08:00 - 17:30) pada hari Senin - Jumat sekaligus.

4. **Pengaturan Profil Default**
   - Simpan data diri, NIP, penempatan, dan atasan signer agar tersimpan permanen dan tidak perlu diisi ulang setiap bulan.

---

## 🚀 Cara Menjalankan Aplikasi

Cukup **klik 2x file `run.bat`**, aplikasi akan:
1. Memeriksa dan menginstal library jika belum ada (`flask`, `openpyxl`).
2. Menjalankan server lokal di background.
3. Otomatis membuka aplikasi di browser web Anda di:
   ```
   http://localhost:5000
   ```

Atau melalui terminal/PowerShell:
```bash
python app.py
```

---

## 📁 Struktur Berkas

- `app.py`: Backend server Flask & endpoint REST API.
- `database.py`: Manajemen database SQLite (`attendance.db`).
- `timesheet_generator.py`: Engine kloning & injeksi data ke template Excel asli.
- `template_timesheet.xlsx`: Master template resmi BPL.
- `templates/index.html`: Antarmuka web modern & responsif (Tailwind CSS, Lucide icons, SweetAlert2).
- `static/js/app.js`: Logika interaktif frontend & jam realtime.
- `run.bat`: Launcher satu klik untuk Windows.
- `requirements.txt`: Dependensi Python.
