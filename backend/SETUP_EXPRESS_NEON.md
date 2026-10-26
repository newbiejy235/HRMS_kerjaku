# Prompt AI Agent — Setup Express + TypeScript + Neon + Drizzle ORM

> Dokumen ini menggabungkan langkah dari dua materi: **Lesson 1 — Set up Express JS + TypeScript** dan **Lesson 2 — Install Drizzle + Neon and CRUD**. Gunakan satu file ini sebagai panduan manusia dan AI agent. Bagian dipisahkan dengan heading dan garis horizontal (`---`), bukan file instruksi terpisah.

---

## A. PROMPT UTAMA UNTUK AI AGENT

Salin prompt ini ke AI agent yang akan mengerjakan project:

```text
Kamu adalah AI software engineer yang bertugas menyiapkan project backend Express.js + TypeScript dengan database PostgreSQL di Neon dan Drizzle ORM.

SUMBER ACUAN:
- Baca file `SETUP_EXPRESS_NEON.md` dari awal sampai akhir.
- Ikuti bagian "B. Urutan Setup", "C. Struktur Project", dan "D. Konfigurasi dan Kode".
- Jangan mengabaikan perintah atau konfigurasi yang ada di dokumen tersebut.
- Dokumen ini berasal dari materi pembelajaran, jadi pertahankan stack dan tujuan sederhananya.

TUJUAN:
1. Siapkan project Express.js + TypeScript.
2. Hubungkan project ke PostgreSQL Neon menggunakan `@neondatabase/serverless` dan Drizzle ORM.
3. Siapkan schema tabel `users` sesuai dokumen.
4. Siapkan konfigurasi Drizzle Kit dan TypeScript.
5. Sediakan script development agar server bisa dijalankan dan restart saat file berubah.
6. Jalankan pemeriksaan yang relevan dan perbaiki error yang benar-benar muncul.

ATURAN KERJA:
- Periksa isi folder dan `package.json` terlebih dahulu. Jika project sudah ada, jangan menimpa atau menghapus pekerjaan yang sudah ada.
- Kerjakan langsung pada project yang sedang dibuka.
- Gunakan TypeScript dan struktur sederhana; jangan menambahkan arsitektur, framework, dependency, atau fitur yang tidak diperlukan.
- Jangan membuat endpoint CRUD tambahan hanya berdasarkan judul materi. Implementasikan hanya yang dijelaskan secara eksplisit atau yang diminta pengguna.
- Pertahankan nama tabel, kolom, tipe data, dan aturan constraint schema pada dokumen.
- Buat `.env` untuk menyimpan `DATABASE_URL`. Jangan pernah menulis connection string asli, password, atau secret ke source code, log, dokumentasi publik, maupun commit Git.
- Buat `.env.example` yang hanya berisi placeholder, dan pastikan `.env` masuk `.gitignore`.
- Jangan mengarang URL Neon. Jika `DATABASE_URL` belum tersedia, buat konfigurasi placeholder dan minta pengguna mengisinya dari dashboard Neon. Jangan mencetak nilai rahasia saat memeriksa environment.
- Bila perintah pada materi tidak cocok dengan versi dependency atau konfigurasi project yang ada, jelaskan masalahnya, pilih penyesuaian minimal yang diperlukan agar project berjalan, dan catat penyesuaiannya. Jangan mengubah stack secara diam-diam.
- Jangan mengklaim koneksi database berhasil jika belum benar-benar diuji.
- Jalankan instalasi dependency, pemeriksaan TypeScript, dan perintah Drizzle yang relevan. Jika perintah memerlukan kredensial atau akses jaringan yang tidak tersedia, jelaskan secara spesifik dan berikan langkah manual berikutnya.
- Hindari perubahan destruktif pada database. Sebelum menjalankan perintah yang dapat mengubah schema atau data, jelaskan dampaknya; jangan menghapus data yang sudah ada.
- Setelah selesai, laporkan: file yang dibuat/diubah, dependency yang dipasang, perintah yang berhasil, hasil pemeriksaan, status koneksi Neon (teruji atau belum), serta langkah manual yang masih diperlukan.

MULAI:
1. Inspeksi project.
2. Baca seluruh panduan setup pada file ini.
3. Kerjakan langkah secara berurutan.
4. Verifikasi hasilnya dan laporkan secara ringkas.
```

---

## B. URUTAN SETUP

### Profil 1 — Inisialisasi Express.js + TypeScript

Jalankan dari folder project backend. Jika project sudah memiliki `package.json`, periksa isinya sebelum menjalankan inisialisasi ulang.

```bash
npm init -y
npm install express
npm install -D typescript@6.0.3
npm install -D @types/express @types/node
npm install -D ts-node
npm install -D nodemon
npx tsc --init
```

Materi mengizinkan `npm install -D typescript` dengan Versi `6.0.3`

### Profil 2 — Dependency Neon dan Drizzle ORM

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv
```

### Profil 3 — Environment Neon

Buat file `.env` di root project dan isi dengan connection string dari dashboard Neon:

```dotenv
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST/DBNAME?sslmode=require
```

Ganti seluruh bagian placeholder dengan connection string milik project Neon. Jangan gunakan contoh placeholder ini sebagai kredensial sungguhan.

Buat `.env.example` tanpa rahasia:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Pastikan `.env` tidak masuk Git. Tambahkan baris berikut ke `.gitignore` jika belum ada:

```gitignore
.env
.env.*
!.env.example
node_modules/
dist/
```

> Jika `.gitignore` sudah berisi aturan lain, pertahankan aturan yang ada dan tambahkan hanya yang diperlukan.

---

## C. STRUKTUR PROJECT

Struktur gabungan yang disarankan berdasarkan dua materi:

```text
project-root/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── schema.ts
│   └── index.ts
├── .env
├── .env.example
├── .gitignore
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── node_modules/
```

`node_modules/` dibuat oleh npm. 
---

## D. KONFIGURASI DAN KODE

### Profil 4 — `tsconfig.json`

Gunakan konfigurasi sederhana yang sejalan dengan materi:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Profil 5 — `src/index.ts`

Kode server dasar dari materi:

```typescript
import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (_req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Profil 6 — `drizzle.config.ts`

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/config/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Profil 7 — `src/config/db.ts`

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

### Profil 9 — `src/config/schema.ts`

Schema tabel `users` sesuai materi:

```typescript
import {
  pgTable,
  serial,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 100 })
    .unique()
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
```

Schema ini mendefinisikan tabel `users` dengan `id`, `name`, `email`, dan `created_at`. Jangan menambahkan kolom lain.

---

## E. MENJALANKAN DAN MEMVERIFIKASI

### Profil 10 — Jalankan development server


Buka `http://localhost:3000/`. Respons yang diharapkan dari endpoint awal adalah:

```text
Hello Express + TypeScript!
```

### Profil 11 — Periksa TypeScript dan build

```bash
npx tsc --noEmit
npm run build
```

### Profil 12 — Sinkronkan schema ke Neon

Setelah `DATABASE_URL` diisi dan sudah dipastikan menunjuk ke database yang benar:

```bash
npx drizzle-kit push
```

Perintah ini dapat mengubah schema database. Agent harus memastikan target database benar dan tidak menghapus atau merusak data yang sudah ada.

### Profil 13 — Buka Drizzle Studio

```bash
npx drizzle-kit studio
```

Gunakan untuk melihat tabel melalui antarmuka Drizzle Studio. Pastikan environment database sudah tersedia.

---

## F. CHECKLIST SEBELUM DIANGGAP SELESAI

- [ ] Project memakai Express.js + TypeScript.
- [ ] Dependency Neon dan Drizzle ORM terpasang.
- [ ] `.env` tersedia secara lokal dan tidak berisi placeholder.
- [ ] `.env` tidak di-commit; `.env.example` hanya berisi placeholder.
- [ ] `drizzle.config.ts` menunjuk ke `src/config/schema.ts`.
- [ ] `src/config/db.ts` menggunakan Neon HTTP driver.
- [ ] Schema `users` sesuai dengan materi.
- [ ] Script `dev` berjalan dan server merespons pada port yang dikonfigurasi.
- [ ] TypeScript check/build berhasil.
- [ ] `drizzle-kit push` berhasil dijalankan terhadap database yang benar, atau hambatannya dijelaskan.
- [ ] Status koneksi database dilaporkan secara jujur; tidak mengklaim berhasil jika belum diuji.

---

## G. CATATAN UNTUK PENGGUNA

- Dua PDF memberikan instruksi setup, konfigurasi dasar, dan schema tabel `users`. Walaupun judul Lesson 2 menyebut CRUD, materi yang terlihat tidak memberikan implementasi endpoint CRUD lengkap. Karena itu, prompt ini meminta agent menyiapkan fondasi database terlebih dahulu dan tidak mengarang fitur CRUD.
- `DATABASE_URL` harus berasal dari dashboard Neon milik pengguna. Jangan membagikan connection string yang berisi password.
- Untuk project yang sudah berjalan atau database yang sudah berisi data, periksa konfigurasi dan dampak sinkronisasi schema sebelum melakukan perubahan.
