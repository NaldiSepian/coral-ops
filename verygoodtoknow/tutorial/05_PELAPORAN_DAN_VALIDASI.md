# 05 — Pelaporan dan Validasi
> Bagaimana teknisi melaporkan bukti kerja dan supervisor memberikan persetujuan.

Inti dari aplikasi Coral-Ops adalah **akuntabilitas**. Setiap progres pekerjaan harus dibuktikan dengan data lapangan yang valid.

---

## 📱 Pelaporan oleh Teknisi

Teknisi mengakses halaman detail penugasan di `/views/teknisi/[id]`.

### 1. Check-in (Mulai Kerja)
Sebelum melapor, teknisi harus menekan tombol "Mulai Kerja". Sistem akan mencatat timestamp dan lokasi GPS teknisi saat itu untuk memastikan mereka sudah berada di area proyek.

### 2. Pengiriman Laporan Progres
Saat mengirim laporan, teknisi harus menyertakan:
- **Foto Progres**: Gambar suasana pengerjaan saat itu.
- **Persentase**: Sejauh mana progres sudah berjalan (0-100%).
- **Catatan**: Keterangan tambahan jika ada kendala atau detail teknis.
- **GPS**: Otomatis terambil saat form disubmit.

### 3. Foto Bukti Before-After
Jika teknisi menandai status progres sebagai **"Selesai"**, sistem mewajibkan pengunggahan foto Before-After. 
- Foto ini dikirim secara berpasangan (*paired*).
- Setiap pasangan foto mewakili satu area pengerjaan (misal: "Instalasi AC" - Before & After).

---

## 🔍 Validasi oleh Supervisor

Laporan yang dikirim teknisi tidak langsung dianggap sah. Status validasinya adalah **"Menunggu"**.

Supervisor akan mendapatkan notifikasi dan melihat daftar laporan di halaman `/views/spv/laporan/validasi`.

### Review Laporan
Supervisor melakukan verifikasi dengan cara:
- Memeriksa kejelasan foto.
- Membandingkan lokasi GPS teknisi dengan lokasi proyek (muncul di peta).
- Membaca catatan kendala.

### Keputusan (Approve/Reject)
- **Disetujui**: Laporan sah, progres proyek terupdate.
- **Ditolak**: Supervisor wajib memberikan alasan penolakan. Teknisi akan menerima notifikasi dan harus mengirimkan laporan ulang yang sudah diperbaiki.

---

## ✅ Penyelesaian Penugasan (Final Approval)

Sebuah penugasan hanya bisa ditutup (status "Selesai") jika:
1. Semua laporan progres sudah divalidasi dan disetujui.
2. Semua alat yang dipinjam sudah dikembalikan (telah diupload foto pengembaliannya).
3. Supervisor menekan tombol "Selesaikan Penugasan" untuk melakukan *locking* data.

---

## ⏰ Request Perpanjangan (Extension)

Jika teknisi menghadapi kendala tak terduga (cuaca buruk, material terlambat), mereka bisa mengajukan **Perpanjangan Deadline**.
- Teknisi menginput durasi tambahan yang diminta dan alasan.
- Supervisor meninjau permintaan tersebut dan bisa menyetujui (memperbarui deadline otomatis) atau menolak.

---

**Lanjut ke Bab berikutnya:**
[06 — Maps dan Storage](./06_MAPS_DAN_STORAGE.md)
