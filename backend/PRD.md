# Task: Implementasi dan Audit Fitur Forgot Password HRMS

## 1. Peran dan Tujuan

Bertindak sebagai Senior Backend Engineer yang bertanggung jawab mengimplementasikan fitur forgot password pada proyek HRMS menggunakan TypeScript, Express.js, Drizzle ORM, PostgreSQL, dan Zod.

Kerjakan implementasi dengan prinsip:
- Clean code dan mudah dibaca manusia.
- Type safety yang kuat.
- Separation of concerns.
- Secure by default.
- Validasi input yang konsisten.
- Error handling yang jelas.
- Perubahan sekecil mungkin dan tidak merusak fitur yang sudah ada.

Jangan hanya memberikan saran atau contoh kode. Audit implementasi yang relevan, lakukan perubahan yang diizinkan, jalankan pemeriksaan yang tersedia, perbaiki masalah dalam ruang lingkup, dan laporkan hasilnya secara faktual.

## 2. BATASAN RUANG LINGKUP — WAJIB DIPATUHI

Ruang lingkup yang diizinkan hanya:

1. Schema Drizzle ORM untuk fitur forgot password.
2. Validation Zod yang khusus digunakan oleh fitur forgot password.
3. Controller Express.js yang khusus menangani fitur forgot password.

Jangan mengubah file, fitur, atau konfigurasi di luar tiga kategori tersebut tanpa izin eksplisit dari saya.

Contoh file di luar ruang lingkup yang tidak boleh diubah tanpa izin:
- Database connection dan konfigurasi database.
- Schema users, employees, departments, positions, provinces, cities, dan fitur lain.
- Authentication middleware dan authorization middleware.
- Router atau route registration.
- Konfigurasi SMTP, email transporter, dan template email global.
- Package.json dan lockfile.
- Environment variables atau file konfigurasi.
- File konfigurasi Drizzle.
- Service, utility, middleware, atau modul lain yang sudah ada.
- Test files dan konfigurasi testing yang sudah ada.

### Prosedur ketika ditemukan kebutuhan perubahan di luar ruang lingkup

Jika implementasi membutuhkan perubahan di luar tiga kategori yang diizinkan:

1. Hentikan perubahan pada bagian yang membutuhkan izin.
2. Jelaskan file yang perlu diubah, alasan teknis, risiko jika tidak diubah, dan alternatif yang tersedia.
3. Minta persetujuan eksplisit saya.
4. Jangan melakukan perubahan tersebut sebelum saya menyetujui.

Jangan mengakali batasan ini dengan mengubah file lain secara tidak langsung, mengubah konfigurasi, atau memasukkan logika yang seharusnya berada di luar ruang lingkup ke file lain.

Pemeriksaan, pembacaan, dan audit read-only terhadap file lain diperbolehkan untuk memahami arsitektur dan dependensi proyek. Eksekusi command yang mengubah file atau database harus tetap mengikuti batasan ruang lingkup ini.

Jika dibutuhkan dependency baru, migration yang harus dijalankan, perubahan route, atau perubahan middleware, minta izin sebelum melakukannya.

## 3. Konteks Schema yang Sudah Ada

Proyek menggunakan schema berikut untuk user:

- Tabel: `users`
- Primary key: `users.id`
- Email: `users.email`
- Password hash: `users.password`
- Role: `Karyawan`, `Finance`, dan `HR`

Status request:

`reset_request_status`:
- `pending`
- `approved`
- `rejected`

Tabel `passwordResetRequests` saat ini mempunyai:
- `id`
- `userId`
- `status`
- `reviewedBy`
- `createdAt`
- `reviewedAt`

Relasi yang tersedia:
- `passwordResetRequests.userId` mereferensikan `users.id`.
- `passwordResetRequests.reviewedBy` mereferensikan `users.id`.

Validation yang saat ini tersedia:

`createVerificationSchema`:
- `userId`: integer positif.

`reviewVerificationSchema`:
- `reviewedBy`: integer positif.
- `status`: `approved` atau `rejected`.

Audit apakah desain tersebut sesuai dengan kebutuhan keamanan. Jangan mengubah schema lain di luar fitur forgot password.

Jika perubahan diperlukan pada tabel `passwordResetRequests`, tabel token reset, atau validation terkait, perubahan tersebut diperbolehkan selama masih berada dalam ruang lingkup.

## 4. Alur Bisnis yang Wajib Diimplementasikan

### A. Karyawan mengajukan reset password

Karyawan mengajukan permintaan reset password melalui endpoint yang sudah tersedia atau melalui controller yang ditugaskan.

Ketentuan:
- Validasi input menggunakan Zod.
- Temukan user berdasarkan identitas yang dapat diverifikasi.
- Jangan menganggap `userId` dari request body sebagai bukti kepemilikan akun.
- Jangan menerima `reviewedBy`, `status`, atau data keputusan HR dari karyawan.
- Buat request baru dengan status `pending`.
- Catat waktu pengajuan.
- Jangan mengirim kode reset sebelum HR menyetujui request.
- Tangani request yang tidak valid, user yang tidak ditemukan, dan error database dengan aman.
- Hindari membocorkan apakah email tertentu terdaftar apabila endpoint dapat diakses sebelum login.
- Cegah spam dan pengajuan berulang dengan pendekatan yang sesuai terhadap struktur sistem yang tersedia. Jika memerlukan middleware atau perubahan konfigurasi untuk rate limiting, minta izin terlebih dahulu.

### B. HR melihat dan memproses request

HR bertindak sebagai pihak yang menyetujui atau menolak permintaan, bukan sebagai pihak yang mengganti password karyawan.

Ketentuan:
- HR hanya boleh menyetujui atau menolak request yang masih `pending`.
- Status keputusan hanya `approved` atau `rejected`.
- `reviewedBy` harus diambil dari identitas HR yang sudah terautentikasi, bukan dipercaya dari request body.
- HR tidak boleh melihat password lama, password baru, atau token reset asli.
- Catat `reviewedAt` saat keputusan dibuat.
- Request yang sudah diproses tidak boleh diproses kembali.
- Tangani race condition agar dua proses review bersamaan tidak menyebabkan keputusan ganda.
- Validasi bahwa reviewer memang memiliki role `HR` menggunakan mekanisme otorisasi yang tersedia. Jika membutuhkan perubahan middleware atau route, minta izin.

Jika HR menolak:
- Ubah status menjadi `rejected`.
- Jangan membuat atau mengirim token reset.
- Berikan pesan bahwa permintaan ditolak ketika karyawan memeriksa statusnya.
- Catat keputusan penolakan untuk kebutuhan audit.

Jika HR menyetujui:
- Ubah status menjadi `approved`.
- Buat token reset yang aman.
- Hubungkan token dengan user dan request yang disetujui.
- Kirim token melalui email ke alamat email karyawan yang terdaftar.
- Jangan mengirim token ke email yang diberikan secara bebas oleh pemohon apabila tidak cocok dengan email akun yang terdaftar.

### C. Penyimpanan token reset

Audit kebutuhan penyimpanan token dan pilih implementasi yang paling sesuai dengan schema proyek.

Jika token disimpan di database:
- Gunakan tabel terpisah khusus token reset apabila itu memberikan pemisahan tanggung jawab yang lebih jelas.
- Token harus memiliki relasi dengan request dan user yang benar.
- Simpan hash token, bukan token asli.
- Gunakan token acak dengan entropi tinggi.
- Sertakan `expiresAt`, `usedAt`, dan `createdAt`.
- Token harus kedaluwarsa, sekali pakai, dan tidak bisa digunakan kembali.
- Token baru harus membatalkan token aktif sebelumnya sesuai kebijakan yang diterapkan.
- Token hanya valid untuk request yang berstatus `approved`.

Jangan menyimpan token plaintext, password plaintext, atau kode rahasia dalam log.

Jika implementasi membutuhkan migration, perubahan database aktual, atau perubahan di luar schema yang diizinkan, jelaskan terlebih dahulu dan minta izin.

### D. Karyawan memeriksa status request

Buat atau audit controller yang memungkinkan karyawan mengetahui status permintaan reset password.

Status yang harus bisa dibedakan:
- `pending`: sedang menunggu HR.
- `approved`: disetujui HR.
- `rejected`: ditolak HR.

Ketentuan:
- Karyawan hanya boleh melihat request miliknya.
- Jangan menjadikan ID request yang berurutan sebagai satu-satunya mekanisme autentikasi atau otorisasi.
- Sertakan tanggal pengajuan dan tanggal keputusan jika tersedia.
- Jangan mengembalikan token reset atau hash token.
- Jangan membocorkan data karyawan lain.

Jika implementasi membutuhkan endpoint baru tetapi perubahan route berada di luar ruang lingkup, minta izin terlebih dahulu.

### E. Reset password

Audit apakah controller yang ada dapat mendukung penyelesaian reset password dengan aman.

Ketentuan:
- Validasi input dengan Zod.
- Token harus cocok dengan user dan request yang benar.
- Token harus belum kedaluwarsa dan belum pernah digunakan.
- Request harus sudah `approved`.
- Password baru harus memenuhi kebijakan password yang jelas.
- Simpan password baru menggunakan mekanisme hashing yang aman dan sesuai dengan implementasi login saat ini.
- Token harus menjadi tidak valid setelah reset berhasil.
- Pastikan token tidak dapat digunakan dua kali melalui request bersamaan.
- Gunakan transaksi database atau mekanisme konsistensi yang tepat untuk mencegah reset berhasil sebagian.

Jangan mengubah login, registrasi, atau mekanisme hashing global tanpa izin. Jika perubahan diperlukan untuk kompatibilitas, laporkan terlebih dahulu.

## 5. Endpoint dan Controller

Audit controller forgot password yang sudah ada sebelum membuat controller baru.

Usahakan menggunakan struktur dan penamaan yang konsisten dengan proyek.

Kebutuhan endpoint secara logis:

1. Pengajuan reset password oleh karyawan.
2. Daftar request reset password untuk HR.
3. Review request oleh HR.
4. Pemeriksaan status request oleh karyawan.
5. Reset password menggunakan token yang valid.

Jangan langsung mengubah router untuk mendaftarkan endpoint baru. Periksa struktur route yang sudah tersedia secara read-only. Jika route registration perlu diubah, minta izin.

Gunakan status HTTP yang sesuai, antara lain:
- `200` untuk operasi berhasil.
- `202` untuk pengajuan yang diterima untuk diproses.
- `400` untuk input tidak valid.
- `401` untuk pengguna yang belum terautentikasi.
- `403` untuk akses yang tidak diizinkan.
- `404` untuk resource yang tidak tersedia jika pengungkapan keberadaannya aman.
- `409` untuk konflik status atau request yang sudah diproses.
- `429` untuk rate limit jika tersedia.
- `500` atau `503` untuk kegagalan internal yang sesuai.

Jangan mengirim stack trace atau detail internal database kepada client.

## 6. Laporan Request Reset Password

Sediakan logika controller untuk menampilkan laporan request yang dapat dibaca HR.

Data yang dibutuhkan:
- ID request.
- Identitas karyawan yang relevan.
- Email karyawan jika diperlukan.
- Status request.
- Waktu pengajuan.
- Nama atau ID HR yang melakukan review, jika tersedia.
- Waktu review.

Ketentuan:
- Gunakan join Drizzle ORM sesuai relasi schema.
- Urutkan berdasarkan waktu pengajuan, terbaru terlebih dahulu.
- Jangan menyertakan password, token asli, hash token, atau informasi sensitif yang tidak dibutuhkan.
- Jangan mengubah schema karyawan atau user untuk menambahkan kolom laporan.
- Jika nama HR atau karyawan membutuhkan kolom yang tidak tersedia, laporkan keterbatasannya dan minta izin sebelum mengubah schema di luar ruang lingkup.

## 7. Integrasi Email

Konfigurasi email belum tersedia atau belum diisi.

Untuk tahap ini:
- Buat template email di dalam controller atau bagian yang memang diizinkan apabila sesuai dengan arsitektur saat ini.
- Pisahkan subject dan isi email secara jelas.
- Sertakan placeholder untuk nama karyawan, token reset, waktu kedaluwarsa, dan instruksi keamanan.
- Jangan mengarang kredensial SMTP.
- Jangan menuliskan secret atau password email ke source code.
- Jangan mengubah konfigurasi email global tanpa izin.

Jika email transporter belum tersedia, buat bagian integrasi yang terisolasi dan jelaskan dependensi yang diperlukan. Jangan mengklaim email berhasil terkirim jika pengiriman belum benar-benar dapat diuji.

Jika pemisahan template memerlukan file baru di luar tiga kategori yang diizinkan, minta izin terlebih dahulu.

## 8. Audit Keamanan

Lakukan audit khusus terhadap fitur forgot password dan dokumentasikan temuan beserta perbaikannya.

Periksa setidaknya:

1. IDOR: apakah karyawan bisa melihat atau mengubah request milik orang lain.
2. Broken access control: apakah non-HR dapat melakukan review.
3. Mass assignment: apakah client dapat mengatur status atau reviewer.
4. User enumeration: apakah endpoint mengungkap keberadaan akun.
5. Token entropy dan kemungkinan brute force.
6. Token expiration.
7. Token replay atau pemakaian token berulang.
8. Race condition pada review dan reset password.
9. Penyalahgunaan endpoint melalui request berulang.
10. Kebocoran token, hash token, password, atau data sensitif dalam log.
11. Penanganan kegagalan email dan database.
12. SQL injection dan penggunaan query Drizzle ORM yang aman.
13. Validasi Zod dan penanganan error.
14. Konsistensi antara status request, token, dan password.
15. Kompatibilitas password hashing dengan mekanisme login saat ini.

Jangan melakukan penetration testing destruktif, mengirim email nyata, mengubah data produksi, atau menjalankan migrasi terhadap database produksi.

Gunakan test environment apabila tersedia. Jika tidak tersedia, jangan mengklaim pengujian keamanan runtime telah berhasil.

## 9. Audit Clean Code

Periksa dan rapikan bagian yang termasuk ruang lingkup:

- Hilangkan import yang tidak digunakan.
- Hindari duplikasi logika.
- Gunakan nama variabel yang jelas.
- Hindari nested `try/catch` yang tidak diperlukan.
- Gunakan early return untuk validasi dan kondisi gagal.
- Pisahkan validasi input, pemrosesan bisnis, dan respons HTTP secara masuk akal.
- Hindari penggunaan `any` tanpa alasan yang kuat.
- Gunakan tipe TypeScript yang benar.
- Tangani semua jalur kegagalan.
- Jangan menelan error dengan `catch {}` kosong.
- Pastikan controller tidak mengembalikan data sensitif.
- Ikuti konvensi kode yang sudah digunakan proyek.

Jangan melakukan refactor terhadap file di luar ruang lingkup meskipun ditemukan kode yang kurang rapi.

## 10. Prosedur Eksekusi

Ikuti urutan ini.

### Tahap 1 — Audit awal
- Periksa struktur file dan controller yang berkaitan.
- Baca schema dan validation yang relevan.
- Periksa tipe data, relasi, import, dan implementasi autentikasi yang sudah ada secara read-only.
- Identifikasi dependensi yang tersedia.
- Jangan mengubah file apa pun sebelum audit selesai.

### Tahap 2 — Rencana perubahan
Sebelum mengedit, tampilkan:
- File yang akan diubah.
- Ringkasan perubahan per file.
- Schema atau kolom baru yang diperlukan.
- Endpoint yang dapat diimplementasikan pada controller.
- Dependensi atau konfigurasi eksternal yang belum tersedia.
- Risiko dan asumsi implementasi.

Pastikan setiap perubahan masih berada dalam ruang lingkup yang diizinkan.

Jika ada perubahan yang membutuhkan izin, berhenti pada bagian tersebut dan minta persetujuan.

### Tahap 3 — Implementasi
- Implementasikan fitur sesuai rencana yang diizinkan.
- Pertahankan kompatibilitas dengan schema dan controller yang sudah ada.
- Jangan mengubah route, middleware, konfigurasi, atau file lain tanpa persetujuan.
- Jangan menjalankan migration atau command destruktif tanpa izin.

### Tahap 4 — Pemeriksaan
Jalankan pemeriksaan yang tersedia dan tidak mengubah file di luar ruang lingkup:
- TypeScript type-check.
- Lint.
- Pemeriksaan konsistensi schema.
- Pemeriksaan import.
- Test yang relevan jika dapat dijalankan dengan aman.
- Pemeriksaan alur bisnis dan keamanan.

Jika suatu command menghasilkan perubahan file, jangan jalankan tanpa izin.

### Tahap 5 — Perbaikan
Jika ditemukan bug atau error:
- Tentukan penyebabnya.
- Perbaiki apabila masih berada dalam ruang lingkup.
- Jika perbaikan memerlukan file lain, minta izin.
- Jalankan ulang pemeriksaan yang relevan.
- Jangan mengklaim semua error sudah selesai jika belum diverifikasi.

### Tahap 6 — Laporan akhir
Berikan laporan yang memuat:
1. File yang diubah.
2. Ringkasan implementasi.
3. Endpoint dan alur yang telah didukung controller.
4. Perubahan schema dan validation.
5. Temuan keamanan dan mitigasinya.
6. Command yang benar-benar dijalankan.
7. Hasil type-check, lint, dan test.
8. Bug yang ditemukan dan diperbaiki.
9. Bagian yang belum dapat diuji.
10. Dependensi atau perubahan yang masih membutuhkan izin.
11. Risiko atau keterbatasan yang masih tersisa.

Bedakan dengan tegas antara:
- Sudah diimplementasikan.
- Sudah diperiksa secara statis.
- Sudah diuji secara runtime.
- Belum diuji.
- Memerlukan persetujuan saya.

## 11. Kriteria Selesai

Tugas baru dianggap selesai jika:
- Controller forgot password sesuai dengan alur bisnis.
- Validation sesuai dengan input yang benar-benar digunakan.
- Schema reset request dan token konsisten.
- HR hanya dapat memproses request yang masih `pending`.
- Karyawan tidak dapat mengakses request milik orang lain.
- Token hanya dikirim setelah persetujuan HR.
- Token memiliki masa berlaku dan tidak bisa dipakai ulang.
- Reset password menggunakan hashing yang kompatibel dengan sistem login.
- Laporan memuat identitas yang relevan, status, dan tanggal.
- Error ditangani secara konsisten.
- Pemeriksaan yang tersedia sudah dijalankan dan hasilnya dilaporkan dengan jujur.
- Tidak ada file di luar ruang lingkup yang diubah tanpa izin eksplisit.

Mulai dari audit read-only dan rencana perubahan. Jangan langsung mengedit sebelum menyampaikan rencana tersebut. Jika semua kebutuhan dapat dipenuhi di dalam ruang lingkup yang diizinkan, lanjutkan implementasi setelah rencana ditampilkan. Jika tidak, berhenti dan minta izin pada bagian yang memerlukannya.