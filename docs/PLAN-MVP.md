# Teacher Supervisor — Plan MVP

**Tim:** 2 orang · **Platform:** Web app · **Target:** MVP dalam 2–4 minggu
**Fokus:** Penilaian & evaluasi kinerja guru (supervisi/observasi kelas, scoring, laporan)

---

## 1. Gambaran Produk

Aplikasi web untuk **pengawas / kepala sekolah** melakukan supervisi kinerja guru: menjadwalkan observasi, mengisi form penilaian berbasis rubrik, memberi skor & catatan, lalu menghasilkan laporan dan dashboard ringkas. Guru bisa melihat hasil evaluasinya sendiri.

**Peran pengguna (roles):**
- **Supervisor** (kepala sekolah/pengawas) — bikin jadwal observasi, isi penilaian, lihat semua laporan.
- **Guru** — lihat hasil evaluasi & feedback miliknya sendiri.
- **Admin** (opsional, bisa dirangkap supervisor di MVP) — kelola akun & data master guru.

---

## 2. Rekomendasi Tech Stack

Dipilih supaya **cepat dibangun oleh tim 2 orang**, satu bahasa (TypeScript) dari frontend ke backend, dan backend siap pakai (auth + database + storage) tanpa setup server sendiri.

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Full-stack dalam 1 repo, frontend + API route sekaligus |
| UI | **Tailwind CSS + shadcn/ui** | Komponen siap pakai, rapih cepat |
| Backend / DB | **Supabase** (Postgres + Auth + Storage) | Auth, database, dan upload file langsung jadi — hemat waktu MVP |
| Auth & Role | Supabase Auth + Row Level Security | Login email/password + pembatasan akses per role |
| Hosting | **Vercel** (frontend) + Supabase cloud | Deploy otomatis dari Git, gratis untuk skala awal |
| Tooling | GitHub, ESLint/Prettier, Vercel Preview | Kolaborasi & review antar 2 anggota |

> Alternatif kalau lebih nyaman: Firebase (ganti Supabase). Tapi Postgres + RLS Supabase lebih cocok untuk data relasional penilaian.

---

## 3. Scope MVP (yang dibangun) vs Nanti

**Masuk MVP**
- Login & role (supervisor / guru)
- Data master guru (CRUD: nama, mapel, kelas)
- Template rubrik penilaian (kategori + indikator + bobot skor, mis. skala 1–4)
- Jadwal observasi (tanggal, guru, kelas)
- Form penilaian/observasi: isi skor per indikator + catatan
- Hasil penilaian: skor total otomatis + ringkasan
- Dashboard sederhana: daftar guru + rata-rata skor + status observasi
- Halaman guru: lihat hasil & feedback sendiri

**Ditunda (post-MVP)**
- Multi-sekolah / multi-tenant
- Export PDF/Excel laporan
- Notifikasi email
- Analitik tren antar-periode, grafik lanjutan
- Tanda tangan digital / approval berjenjang

---

## 4. Model Data (inti)

- **users** — id, email, role (supervisor/guru), guru_id (jika role guru)
- **teachers** — id, nama, mapel, kelas, status
- **rubrics** — id, nama, deskripsi
- **rubric_items** — id, rubric_id, kategori, indikator, bobot, skala_max
- **observations** — id, teacher_id, supervisor_id, rubric_id, tanggal, status (terjadwal/selesai), catatan_umum
- **observation_scores** — id, observation_id, rubric_item_id, skor, catatan

---

## 5. Timeline 4 Minggu (4 sprint)

**Minggu 1 — Fondasi**
- Setup repo, Next.js, Tailwind/shadcn, Supabase, deploy awal ke Vercel
- Skema database + RLS dasar
- Auth (login/logout) + proteksi route per role

**Minggu 2 — Data master & rubrik**
- CRUD data guru
- CRUD rubrik + indikator + bobot
- Layout dasar (navbar, sidebar, halaman list)

**Minggu 3 — Inti penilaian**
- Jadwal observasi (buat, lihat, ubah status)
- Form penilaian: isi skor per indikator + catatan
- Hitung skor total otomatis + simpan hasil

**Minggu 4 — Dashboard, halaman guru, polish**
- Dashboard supervisor (daftar guru, rata-rata skor, status)
- Halaman guru lihat hasil sendiri
- Bug fixing, validasi form, uji end-to-end, deploy final

> Buffer: kalau ada yang molor, dashboard lanjutan & polish boleh geser ke minggu 5.

---

## 6. Pembagian Tugas (2 Orang)

Disarankan **bagi per area, bukan per layer**, supaya tiap orang punya fitur utuh dan minim tabrakan.

**Person A — "Setup & Penilaian"**
- Setup project, Supabase, auth, role & RLS (minggu 1)
- Skema database
- Modul jadwal observasi + form penilaian + perhitungan skor (minggu 3)
- Deploy & CI

**Person B — "Data & Tampilan"**
- UI kit, layout, navigasi (minggu 1–2)
- CRUD data guru + rubrik/indikator (minggu 2)
- Dashboard supervisor + halaman guru (minggu 4)
- QA & uji end-to-end

**Kerja bareng (sync 2–3x/minggu):**
- Sepakati skema database & desain rubrik di awal (blocker untuk semua)
- Review Pull Request satu sama lain sebelum merge
- Pakai 1 papan tugas (GitHub Projects / Trello) untuk tracking

---

## 7. Langkah Pertama (mulai besok)

1. Buat repo GitHub + undang kedua anggota
2. Inisialisasi Next.js + Tailwind + shadcn/ui
3. Bikin project Supabase, set tabel `users`, `teachers`, `rubrics`
4. Sepakati isi rubrik penilaian (kategori & indikator) — ini menentukan bentuk form
5. Pasang auth + 1 halaman terproteksi sebagai bukti alur jalan

---

## 8. Risiko & Catatan

- **Desain rubrik adalah jantung aplikasi** — finalkan struktur indikator & bobot sejak awal sebelum bangun form.
- Jaga scope MVP tetap kecil; tahan godaan fitur tambahan sampai versi inti jalan.
- Pastikan RLS benar supaya guru tidak bisa lihat data guru lain.
