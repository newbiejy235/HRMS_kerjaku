================================================================================
                    DOKUMENTASI PROJEK KERJAKU - HRMS v2
================================================================================
File ini berisi dokumentasi lengkap analisis seluruh kode sistem Kerjaku (HRMS
Human Resource Management System). File dibuat sebagai hasil analisis bacaan
sumber kode (tidak ada perubahan pada kode asli, kecuali pembuatan file ini).

------------------------------------------------------------
1. GAMBARAN UMUM PROJEK
------------------------------------------------------------
Nama        : Kerjaku (HRMS - Human Resource Management System)
Versi       : v2 (ongoing)
Tipe        : Fullstack (Backend API + Frontend Web)
Bahasa      : TypeScript
Database    : PostgreSQL (Neon serverless) via Drizzle ORM
Backend     : Express 5 (CommonJS) di port 8000
Frontend    : Next.js 16.4.3 (App Router, React 19) di client/web
Dokumentasi : Swagger/OpenAPI di /api-docs

Sistem ini mengelola:
  - Autentikasi & manajemen akun karyawan (3 role: Karyawan, Finance, HR)
  - Absensi kehadiran/pulang berbasis QR Code + verifikasi lokasi GPS (radius)
  - Manajemen jadwal shift & pengaturan waktu masuk/keluar/toleransi
  - Pengajuan izin/sakit/libur, lembur, dan reimbursement (dengan bukti foto)
  - Review & persetujuan pengajuan oleh HR
  - Notifikasi melalui Telegram Bot (pairing akun, OTP reset password, alert
    pengajuan, balasan izin/lembur/reimbursement, jadwal shift)
  - Payroll: komponen gaji, alokasi karyawan, generate slip gaji, export Excel
  - Statistik kehadiran per bulan/tahun
  - Laporan analisis via Google Gemini AI (fitur minimal/uji coba)

------------------------------------------------------------
2. TECH STACK & DEPENDENSI UTAMA
------------------------------------------------------------
BACKEND (backend/package.json):
  - express ^5.3.0
  - typescript ^6.0.3, ts-node ^10.9.2, nodemon ^3.1.14
  - drizzle-orm ^0.45.4, drizzle-kit ^0.31.11
  - @neondatabase/serverless ^1.2.0 (koneksi PostgreSQL serverless)
  - zod ^4.6.7 (validasi skema input)
  - bcryptjs ^3.0.3, jsonwebtoken ^9.0.3 (hash password & JWT)
  - cors ^2.8.6, multer ^2.5.0 (file upload)
  - cloudinary ^2.11.0 (penyimpanan foto bukti reimbursement)
  - qrcode ^1.5.4 (generate QR absensi)
  - pdfkit ^0.20.2, exceljs ^4.4.0, docx ^9.15.1 (export dokumen)
  - node-telegram-bot-api ^0.67.0 (Telegram bot)
  - swagger-jsdoc ^6.3.0, swagger-ui-express ^5.0.1 (API docs)
  - @google/genai ^2.32.0 (Gemini AI)

FRONTEND (client/web/package.json):
  - next ^16.4.3, react ^19.3.0, react-dom ^19.3.0
  - tailwindcss ^4, class-variance-authority, cn, lucide-react
  - @base-ui/react ^1.9.0, shadcn ^4.23.0, tw-animate-css
  - ESLint ^9, TypeScript ^5

------------------------------------------------------------
3. STRUKTUR FOLDER
------------------------------------------------------------
Kerjaku-v2/
├── readme.md             -> satu baris: "Project HRMS -> On going"
├── .env / .env.example   -> variabel lingkungan
├── drizzle.config.ts     -> konfigurasi Drizzle Kit
├── tsconfig.json, package.json, package-lock.json, .gitignore
├── PRD.md, SETUP_EXPRESS_NEON.md, AGENTS.md
├── backend/
│   ├── src/
│   │   ├── index.ts              -> entry point Express, mount routes, Swagger
│   │   ├── config/
│   │   │   ├── db.ts             -> inisialisasi drizzle + neon (export db)
│   │   │   ├── schema.ts         -> DEFINISI SEMUA TABEL & ENUM (sumber kebenaran DB)
│   │   │   └── telegramBot.ts    -> inisialisasi bot Telegram (polling)
│   │   ├── middleware/
│   │   │   ├── users.middleware.ts -> authenticate (JWT) + interface AuthRequest
│   │   │   └── reimburseUpload.ts  -> multer (foto receipt, max 5MB, jpg/png/webp)
│   │   ├── routes/               -> semua route Express (lihat bagian 6)
│   │   ├── controller/           -> logika bisnis tiap modul
│   │   │   ├── auth.controller.ts
│   │   │   ├── activation.ts, activation/start.controller.ts
│   │   │   ├── employee/employee.controller.ts
│   │   │   ├── HR/fiturHR.controller.ts
│   │   │   ├── finance/finance.controller.ts
│   │   │   ├── reimburse/reimburse.controller.ts
│   │   │   ├── getNotification/getNotification.controller.ts
│   │   │   ├── location/attendanceLocation.controller.ts
│   │   │   ├── provinsi/cities.ts
│   │   │   ├── report/geminiReport.controller.ts
│   │   ├── lib/
│   │   │   ├── utils.ts            -> toCents/fromCents, formatDate, getPeriod
│   │   │   ├── location.ts         -> hitung jarak Haversine
│   │   │   ├── cloudinary.ts, uploadReimburse.ts
│   │   │   ├── seed.ts             -> seed shift settings (Morning/Afternoon/Evening)
│   │   │   ├── telegram/telegram.store.ts (in-memory Map chatId)
│   │   │   └── documentation_api/  -> swagger.ts + schemas/
│   │   ├── services/
│   │   │   ├── notification.service.ts (wrapper kirim pesan Telegram)
│   │   │   └── gemini.service.ts   -> panggil Google GenAI
│   │   └── validation/           -> skema Zod (auth, employee, finance, shift,
│   │       verify, permission, overtime, manageEmployee, etc.)
│   └── drizzle/meta/             -> snapshot migrasi Drizzle
└── client/web/
    ├── app/                      -> Next.js App Router
    │   ├── page.tsx              -> halaman awal (redirect berdasarkan role)
    │   ├── layout.tsx            -> root layout (font, metadata)
    │   ├── (auth)/login/page.tsx -> halaman login HR & Finance
    │   ├── (hr)/layout.tsx       -> layout HR (sidebar + topbar, guard role HR)
    │   ├── (hr)/hr/*             -> halaman HR (dashboard, employees, attendance,
    │   │       shift, lembur, pengajuan/*, payroll/*, statistic, settings)
    │   ├── (finance)/layout.tsx  -> layout Finance (guard role Finance)
    │   ├── (finance)/finance/*   -> halaman Finance (dashboard, components,
    │   │       allocations, details, payroll, settings)
    │   └── attendance/qr/generate/page.tsx -> halaman generate QR absensi
    ├── components/
    │   ├── layout/sidebar.tsx    -> navigasi per role (hr / finance) + logout
    │   ├── layout/topbar.tsx     -> pencarian, tombol hubungkan Telegram, profil
    │   ├── profile/MyProfile.tsx
    │   └── ui/*                  -> komponen UI shadcn (button, card, dialog, dll)
    ├── lib/
    │   ├── api.ts                -> apiFetch (wrapper fetch + token Bearer)
    │   ├── pengajuan-api.ts      -> client untuk reimburse, notifikasi, review
    │   ├── profile-api.ts        -> profil, shift, slip gaji milik login
    │   ├── statistic-api.ts      -> statistik kehadiran
    │   ├── city-id-map.ts, employee-options.ts, utils.ts
    ├── next.config.ts, tsconfig.json, eslint.config.mjs, components.json
    └── public/images/image.png

------------------------------------------------------------
4. SKEMABASE DATA (backend/src/config/schema.ts)
------------------------------------------------------------
Semua tabel didefinisikan dengan Drizzle ORM (PostgreSQL). Tabel utama:

ENUM:
  userRole          : ["Karyawan", "Finance", "HR"]
  employment_status : ["active", "fired"]
  gender            : ["L", "P"]
  shiftCategory     : ["Morning", "Afternoon", "Evening"]
  reset_request_status : ["pending", "approved", "rejected"]
  attendance_status : ["on time", "late", "tolerance time"]
  permissionType    : ["permission", "sick", "holiday"]
  permissionStatus  : ["pending", "rejected", "accepted"]
  payrollType       : ["earning", "deduction"]
  reimbursement_status : ["pending", "approved", "rejected"]

TABEL:
  usersTable (users)
    id (PK, identity), email (unique), password, role (default Karyawan),
    createdAt, updatedAt

  employes
    employeeId (PK, varchar 30, kolom DB "employee_code"),
    userId (FK unique -> usersTable.id), firstName, lastName,
    gender (L/P), noTelp, telegramChatId, telegramPairingToken (unique),
    telegramPairingExpiresAt, cities_id (FK -> cities.id), noRek, nip,
    BPJS_Kesehatan, BPJS_Ketenagakerjaan, NPWP (16),
    hire_date, resign_date, idPosition (FK -> position.id_position),
    idDepartment (FK -> department.id_department),
    employment_status (default active), updatedAt

  provinces (provinces_table): id (PK), provinsi
  cities: id (PK), kota, provinsi_id (FK -> provinces.id)
  position: id_position (PK), position_name, description
  department: id_department (PK), department_name, description

  passwordResetRequests
    id (PK), userId (FK), status (default pending), reviewedBy (FK),
    token (hash), expiresAt, usedAt, createdAt, reviewedAt

  employeeAttendance (attendance)
    shiftId (PK identity), shiftDate, employeeIn, employeeOut,
    employeeLocate (text), status, id_employee (FK -> employes.employeeId)

  attendanceSettings
    id_settings (PK), category (shiftCategory), normal_time_in,
    normal_time_out, tolerance_time

  shiftSchedule ("shift")
    shiftId (PK), shiftDate, shiftTime (FK -> attendanceSettings.id_settings),
    upcomingShiftDate, upcomingShiftTime (FK), employeeLocate,
    id_employee (FK), unique index (id_employee, shiftDate)

  attendanceQrCode (qr_code)
    id_qrCode (PK), qrCodeToken, expiresAt, updatedAt

  employeePermission (permission)
    id_permission (PK), id_employee (FK), permit_type, permit_reason,
    createdAt, start_date, end_date, status (default pending), approved_by (FK)

  overtime
    id_overwork (PK), id_employee (FK), overtimeDate, overtimeTotal,
    description, status (default pending), approved_by (FK)

  payrollComponents
    id (PK), componentName (unique), description, type (earning/deduction),
    createdAt

  employeePayrollAllocations
    allocationId (PK), componentId (FK), employeeId (FK), amount (numeric),
    unique index (employeeId, componentId)

  payrolls
    payrollId (PK), employeeId (FK), payrollPeriod (varchar 7),
    totalEarnings, totalDeductions, netSalary, unique index (employeeId, period)

  payrollDetails
    detailId (PK), payrollId (FK), componentId (FK), componentName, type,
    amount

  employeeAttendanceStatistics
    id (PK), employeeId (FK), month, year, totalEffectiveDays, totalPresent,
    totalAlpha, totalPermission, totalOvertime, totalLate, createdAt, updatedAt,
    unique index (employeeId, month, year)

  attendanceLocation
    id (serial PK), locationName, latitude, longitude, radiusMeter (default 100),
    isActive (default true), createdAt

  employeeReimbursements
    id (serial PK), employeeId (FK cascade), name, description, amount,
    receiptPhoto (text), expenseDate, status (default pending), reviewBy (FK),
    reviewedAt, rejectionReason, createdAt, updatedAt

------------------------------------------------------------
5. AUTENTIKASI & OTORISASI
------------------------------------------------------------
- Login (POST /auth/login): verifikasi email + password (bcrypt), menghasilkan
  JWT yang berisi {userId, email, role}, expired 1 hari.
- Token disimpan di frontend localStorage (kunci: "token", "role", "email").
- Middleware authenticate (backend/src/middleware/users.middleware.ts):
  memeriksa header Authorization: Bearer <token>, memverifikasi JWT dengan
  JWT_SECRET, melampirkan req.user = {userId, email, role}.
- Role-based access dikontrol di tiap controller (contoh: role !== "HR" ->
  403). Finance bisa melihat semua karyawan & payroll; HR punya akses penuh
  manajemen karyawan/shift/pengajuan; Karyawan hanya data sendiri.
- Register (POST /auth/register): membuat user + data employes secara atomik
  melalui db.batch(), generate kode karyawan "emp-XXXXX" secara acak, hash
  password bcrypt (salt 10).
- Lupa password: buat passwordResetRequests (status pending), HR men-review
  dan approve, maka OTP 6 digit dikirim via Telegram ke karyawan, lalu
  reset-with-token memverifikasi token hash dengan bcrypt.compare.

------------------------------------------------------------
6. DAFTAR ENDPOINT API (Backend, base URL http://localhost:8000)
------------------------------------------------------------
Mount point utama (lihat backend/src/index.ts):
  /auth, /verification, /data, /activation, /manage, /attendance,
  /report-analyst, /permission, /finance, /statistic,
  /employee/loation, /reimbursements, /cities, /getNotification

A. AUTH (auth.route.ts)  [tanpa auth]
  POST /auth/register           -> register akun + data karyawan
  POST /auth/login              -> login, kembali JWT
  POST /auth/forget             -> ajukan reset password (email)
  POST /auth/reset-with-token   -> ganti password pakai token

B. VERIFICATION (forgetVerification.routes.ts)  [auth + HR]
  POST /verification/           -> buat request reset password (pending)
  POST /verification/review     -> HR review (approve/reject), kirim OTP via Telegram

C. EMPLOYEE / PROFIL (profile.routes.ts)  [auth]
  GET  /data/myProfile          -> profil karyawan yang login
  GET  /data/my-shift           -> jadwal shift milik yang login
  GET  /data/                   -> daftar semua karyawan (HR/Finance)
  GET  /data/my-slip            -> slip gaji (payroll pertama) milik yang login

D. ACTIVATION (activation.route.ts)  [auth]
  POST  /activation/            -> aktivasi chat Telegram (telegramUserId)
  POST  /activation/pairing     -> buat link pairing Telegram (deep link t.me)
  GET   /activation/status      -> cek status koneksi Telegram

E. ATTENDANCE / QR (attendance.route.ts)  [auth]
  POST  /attendance/qr/generate -> HR generate QR code absensi (30 detik berlaku)
  POST  /attendance/            -> scan absensi: check-in atau check-out
                                  (validasi token QR + jarak GPS ke lokasi kantor)

F. PERMISSION & OVERTIME (permission.routes.ts)  [auth]
  POST  /permission/request/employee   -> ajukan izin/sakit/libur
  POST  /permission/request/overtime   -> ajukan lembur

G. MANAGE / HR (manageEmployee.routes.ts)  [auth, mostly HR]
  PATCH /manage/:employeeId                     -> update data karyawan
  PATCH /manage/shift-settings/:id_settings     -> update pengaturan shift
  GET   /manage/shift-settings/all              -> daftar pengaturan shift
  POST  /manage/shift-settings/create           -> buat pengaturan shift
  POST  /manage/shift                           -> buat jadwal shift karyawan
  PATCH /manage/shift/:shiftId                  -> update jadwal shift
  GET   /manage/                                -> daftar semua jadwal shift
  GET   /manage/attendance                      -> daftar semua absensi
  GET   /manage/excel-report                    -> export absensi ke XLSX
  GET   /manage/export-employee                 -> export karyawan ke XLSX
  GET   /manage/export-shift                    -> export shift ke XLSX
  POST  /manage/response/permission             -> HR respon izin (approve/reject)
  POST  /manage/response/overtime               -> HR respon lembur
  POST  /manage/create/overtime                 -> HR buat lembur untuk karyawan

H. FINANCE (finance.routes.ts)  [auth]
  GET  /finance/components              -> daftar komponen payroll
  POST /finance/components              -> tambah komponen payroll
  PATCH /finance/components/:id         -> update komponen
  GET  /finance/allocations             -> daftar alokasi payroll
  GET  /finance/allocations/:employeeId -> alokasi per karyawan
  POST /finance/allocations             -> upsert alokasi payroll
  GET  /finance/payrolls                -> detail payroll
  GET  /finance/payrolls/all            -> semua slip gaji
  POST /finance/payrolls/generate       -> generate payroll karyawan (periode)

I. STATISTIC (statistic.routes.ts)  [auth, HR]
  POST  /statistic/attendance-statistics/generate  -> generate statistik
  GET   /statistic/attendance-statistics           -> statistik per bulan/tahun
  GET   /statistic/attendance-statistics/:employeeId -> statistik satu karyawan

J. LOCATION (attendanceLocaation.routes.ts)  [auth, HR]
  POST  /employee/loation/        -> buat lokasi absensi (latitude/longitude/radius)
  GET   /employee/loation/        -> ambil lokasi absensi
  PUT   /employee/loation/:id     -> update lokasi
  PATCH /employee/loation/:id/status -> ubah status aktif/nonaktif

K. REIMBURSEMENT (reimburse.routes.ts)  [auth]
  POST   /reimbursements/                    -> ajukan reimbursement (+ foto)
  GET    /reimbursements/                    -> lihat reimbursement sendiri
  PATCH  /reimbursements/:id/review          -> HR review (approve/rejected)

L. PROVINSI / CITIES (provinsi.route.ts)  [tanpa auth]
  GET /cities/ -> daftar kota + provinsi

M. NOTIFICATION (getNotification.routes.ts)  [auth, HR]
  GET /getNotification/permission         -> notifikasi izin
  GET /getNotification/overtime           -> notifikasi lembur
  GET /getNotification/reimbursement      -> notifikasi reimbursement
  GET /getNotification/reset-password     -> notifikasi reset password

N. REPORT AI (reportAi.route.ts)  [tanpa auth, uji coba]
  GET /report-analyst/ -> uji coba Gemini AI (testGemini)

O. SWAGGER
  GET /api-docs -> dokumentasi OpenAPI interaktif

------------------------------------------------------------
7. HALAMAN KLIEN (Next.js App Router)
------------------------------------------------------------
Root (app/page.tsx): splash screen, baca token+role dari localStorage, redirect:
  - role HR      -> /hr/dashboard
  - role Finance -> /finance/dashboard
  - kosong       -> /login

(auth)/login/page.tsx: halaman login (khusus HR & Finance), simpan token/role/email
  ke localStorage, validasi email & password sisi client.

(hr)/layout.tsx: layout HR (guard: harus token + role HR), render Sidebar + Topbar.
(finance)/layout.tsx: layout Finance (guard role Finance).

Sidebar (components/layout/sidebar.tsx): menu per role:
  HR: Dashboard, Karyawan, Kehadiran, Statistik Kehadiran, Kiosk QR Absensi,
      Shift, Tugaskan Lembur, Pengajuan, Komponen Gaji, Alokasi Gaji,
      Detail Payroll, Pengaturan, Keluar
  Finance: Dashboard, Komponen Gaji, Alokasi Gaji, Detail Payroll, Penggajian,
           Pengaturan, Keluar

Topbar (components/layout/topbar.tsx): pencarian, tombol hubungkan Telegram,
  notifikasi (Bell), avatar profil (email & role).

Halaman HR (/hr/hr/*):
  - dashboard          -> ringkasan kehadiran hari ini (hadir/terlambat/belum absen/total aktif)
  - employees          -> daftar karyawan
  - attendance         -> absensi karyawan
  - statistic          -> statistik kehadiran
  - shift              -> manajemen jadwal shift
  - lembur             -> tugas/manajemen lembur
  - pengajuan          -> hub pengajuan (izin, lembur, reset password, reimbursement)
  - pengajuan/izin-kerja
  - pengajuan/lembur
  - pengajuan/reimbursement
  - pengajuan/reset-password
  - payroll            -> hub payroll (komponen, alokasi, detail)
  - payroll/components
  - payroll/allocations
  - payroll/details
  - settings

Halaman Finance (/finance/finance/*):
  - dashboard    -> ringkasan penggajian (total gaji, total karyawan, aktivitas terbaru)
  - components   -> komponen gaji
  - allocations  -> alokasi gaji
  - details      -> detail payroll
  - payroll      -> generate penggajian
  - settings

Khusus:
  - /attendance/qr/generate -> halaman generate QR Code absensi (kiosk)

API client (client/web/lib/api.ts): fungsi apiFetch(endpoint, options) yang
  otomatis menyertakan header Authorization Bearer token dari localStorage dan
  menangani response non-JSON (HTML error 404/500) serta mapping status
  401/403/404 ke pesan error bahasa Indonesia.

------------------------------------------------------------
8. INTEGRASI TELEGRAM BOT
------------------------------------------------------------
- Bot diinisialisasi di backend/src/config/telegramBot.ts (polling: true),
  membutuhkan TELEGRAM_BOT_TOKEN & TELEGRAM_BOT_NAME.
- Flow pairing:
  1. User di web meminta link pairing (POST /activation/pairing), sistem
     generate pairingToken (valid 10 menit) dan menyimpan ke employes.
  2. Deep link https://t.me/<BOT_NAME>?start=<token> dibuka user.
  3. Bot menangani /start <token> (telegram.handler.ts): validasi token &
     kedaluwarsa, simpan telegramChatId ke employes, hapus token pairing.
- Notifikasi dikirim via TelegramService (services/notification.service.ts)
  dengan parse_mode HTML ke telegramChatId karyawan/HR:
  * Pengajuan izin, lembur, reimbursement (ke HR)
  * Balasan izin & lembur (ke karyawan)
  * Review reimbursement (ke karyawan)
  * OTP reset password saat HR approve (ke karyawan)
  * Jadwal shift baru/berubah (ke karyawan)
- activationBot (POST /activation/) menyimpan chatId dari telegram.store
  (in-memory Map) ke database.

------------------------------------------------------------
9. FITUR UTAMA SECARA RINGKAS
------------------------------------------------------------
• Absensi: QR Code dinamis (30 detik), verifikasi GPS radius terhadap
  lokasi kantor, status on-time / tolerance / late, check-in & check-out,
  export Excel.
• Shift: kategori Morning/Afternoon/Evening, pengaturan jam masuk/keluar/
  toleransi, jadwal harian + upcoming shift, notifikasi via Telegram.
• Pengajuan: izin/sakit/libur, lembur, reimbursement (foto bukti via
  Cloudinary), reset password; semua direview oleh HR.
• Payroll: komponen gaji (earning/deduction), alokasi per karyawan,
  generate slip gaji per periode, detail earning/potongan, export Excel.
• Statistik kehadiran per bulan/tahun (hadir, alpha, izin, lembur, terlambat).
• Akun: 3 role, registrasi karyawan, login JWT, lupa password dengan OTP
  Telegram, manajemen profil & data karyawan.

------------------------------------------------------------
10. VARIABEL LINGKUNGAN (.env)
------------------------------------------------------------
Backend (diperlukan):
  DATABASE_URL          -> koneksi Neon PostgreSQL
  JWT_SECRET            -> kunci signing JWT
  TELEGRAM_BOT_TOKEN    -> token bot Telegram
  TELEGRAM_BOT_NAME     -> username bot Telegram (untuk deep link)
  CLOUDINARY_URL / CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET -> upload foto
  GEMINI_APIKEY         -> kunci Google GenAI
  HARI_EFEKTIF_KERJA    -> default 21 (utilitas statistik)
Frontend:
  NEXT_PUBLIC_API_URL   -> base URL backend (default http://localhost:8000)

------------------------------------------------------------
11. CARA MENJALANKAN (Secara singkat)
------------------------------------------------------------
Backend:
  1. cp .env.example .env (isi variabel di atas)
  2. npm install
  3. npm run migrate       (npx drizzle-kit push -> buat tabel ke Neon)
  4. npm run dev           (nodemon src/index.ts, port 8000)
Frontend:
  1. cd client/web
  2. npm install
  3. npm run dev           (Next.js dev server)
  4. pastikan NEXT_PUBLIC_API_URL arah ke backend

Dokumentasi API: buka http://localhost:8000/api-docs setelah backend berjalan.

------------------------------------------------------------
12. OBSERVASI / CATATAN PENTING (dari analisis kode)
------------------------------------------------------------
- Tidak ada file uji coba (test) di backend ("test": echo no test).
- Beberapa route di finance.routes.ts dan fiturHR.controller.ts memiliki
  referensi ke fungsi yang belum ada / dikomentari (getPayrollAllocationByEmployee,
  getShiftSettings, createShiftSettings, HROvertime, generateAttendanceStatistics,
  getAttendanceStatistics, getEmployeeAttendanceStatistics) — perlu dikonfirmasi
  apakah sudah diekspor di controller agar tidak error runtime.
- Swagger paths (swagger.ts) hanya mencakup sebagian endpoint; path sisa belum
  terdaftar sepenuhnya.
- Token reset-password di auth.controller.ts mencoba mencocokkan token dengan
  bcrypt.compare terhadap semua request (limit 100) karena kolom token berisi
  hash — pendekatan unik tetapi tidak efisien pada volume besar.
- QR code attendance disimpan tanpa hapus yang lama (insert + update pada
  tabel yang sama), satu token aktif saja di tabel qr_code.
- Frontend simpan token di localStorage (tidak httpOnly cookie), risiko XSS.
- CORS backend diatur origin "*" (boleh diakses semua domain) — pertimbangkan
  batasi untuk produksi.
- Projekt status: ON GOING (lihat readme.md).

================================================================================
                       AKHIR DOKUMENTASI
================================================================================