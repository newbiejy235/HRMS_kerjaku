# Kerjaku HRMS API Documentation

## Lokasi File Utama

- `backend/lib/documentation_api/swagger.ts`

File tambahan:
- `backend/lib/documentation_api/schemas/common.schema.ts`
- `backend/lib/documentation_api/schemas/auth.schema.ts`
- `backend/lib/documentation_api/schemas/employee.schema.ts`
- `backend/lib/documentation_api/schemas/finance.schema.ts`
- `backend/lib/documentation_api/swaggerServer.ts` (server standalone Swagger UI)

## Ringkasan

- Total endpoint ditemukan: 36
- Total endpoint didokumentasikan: 36
- OpenAPI version: 3.0.3
- Validasi OpenAPI: VALID (`@apidevtools/swagger-parser`)

Modul yang didokumentasikan:
- Authentication
- Verification
- Employee
- HR Management
- Shift & Attendance
- Permission & Overtime
- Finance
- Report
- Activation

## Dependency yang Dibutuhkan

Dependency runtime berikut sudah tersedia di `node_modules`:
- `swagger-ui-express`
- `@apidevtools/swagger-parser` (validasi, opsional)

Tidak ada perubahan `package.json`.

## Cara Menjalankan Swagger UI

Opsi 1 - integrasi manual ke backend utama. Tambahkan pada `src/index.ts`:

```ts
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../lib/documentation_api/swagger";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

Jalankan backend:

```bash
npm run dev
```

Buka:
- `http://localhost:8000/api-docs`

Opsi 2 - jalankan server Swagger standalone tanpa mengubah entry point:

```powershell
$env:TS_NODE_TRANSPILE_ONLY="1"
$env:TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","esModuleInterop":true,"skipLibCheck":true,"ignoreDeprecations":"6.0"}'
npx ts-node --skip-project lib/documentation_api/swaggerServer.ts
```

Buka:
- `http://localhost:8001/api-docs`

## Authentication di Swagger UI

1. Login melalui `POST /auth/login`.
2. Salin nilai `userData.token`.
3. Klik tombol `Authorize`.
4. Masukkan `Bearer <token>` atau token sesuai format Bearer JWT.
5. Endpoint dengan `security: BearerAuth` akan menggunakan token tersebut.

Endpoint tanpa authentication:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forget`
- `POST /auth/reset-with-token`
- `POST /verification/`
- `POST /verification/review`
- `GET /report-analyst/`

## Temuan / Ambiguitas Implementasi

- `GET /finance/payrolls` dan `GET /finance/payrolls/all`: komentar route menyebut filter query (`employeeId`, `payrollPeriod`, `status`), tetapi controller tidak membaca `req.query`. Dokumentasi tidak menambahkan query parameter yang tidak diimplementasikan.
- `GET /data/my-slip`: komentar route menyebut query `period`, tetapi controller tidak membaca query dan mengambil payroll pertama milik karyawan.
- `GET /finance/allocations`: komentar route menyebut query `employeeId`, tetapi controller mengembalikan semua alokasi.
- `HRresponsePermission` dan `HRresponseOvertime`: body tidak divalidasi dengan Zod; hanya mengambil `status` dan id dari body.
- `getAllAttendanceEmployee`: response bersarang (`data.data`).
- Beberapa endpoint hanya memeriksa authentication, tanpa pembatasan role selain yang diimplementasikan di controller.
- `GET /report-analyst/` memanggil service Gemini dengan data dummy dan tidak memerlukan token.
- Endpoint export Excel mengembalikan file binary XLSX, bukan JSON.

## Catatan Validasi

Spec divalidasi dengan `@apidevtools/swagger-parser` dan dinyatakan valid. Tidak ada file di luar `lib/documentation_api/` yang diubah.
