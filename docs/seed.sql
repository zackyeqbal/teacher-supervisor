-- ============================================================
-- Teacher Supervisor — Data Awal (Seed)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql.
-- Isi: 1 rubrik standar (5 kategori, 18 indikator) + 4 guru contoh.
-- ============================================================
-- CATATAN: jangan jalankan dua kali (nanti datanya dobel).
-- Kalau mau ulang dari bersih, hapus dulu data lama:
--   delete from public.rubric_items;
--   delete from public.rubrics;
--   delete from public.teachers;
-- ============================================================

-- ------------------------------------------------------------
-- 1. RUBRIK + INDIKATOR (skala 1-4, total bobot = 100)
-- ------------------------------------------------------------
with r as (
  insert into public.rubrics (name, description, scale_max, is_active)
  values (
    'Rubrik Supervisi Kelas (Standar)',
    'Skala 1-4. Skor akhir = Σ(skor × bobot) / (4 × Σbobot) × 100.',
    4,
    true
  )
  returning id
)
insert into public.rubric_items (rubric_id, category, indicator, weight, sort_order)
select r.id, v.category, v.indicator, v.weight, v.sort_order
from r,
(values
  -- A. Perencanaan Pembelajaran (15)
  ('A. Perencanaan Pembelajaran', 'Menyiapkan RPP/modul ajar yang lengkap dan sesuai kurikulum', 5,  1),
  ('A. Perencanaan Pembelajaran', 'Tujuan pembelajaran jelas dan terukur',                        5,  2),
  ('A. Perencanaan Pembelajaran', 'Materi & media relevan dengan tujuan',                         5,  3),
  -- B. Pelaksanaan Pembelajaran (40)
  ('B. Pelaksanaan Pembelajaran', 'Membuka pelajaran (apersepsi & motivasi)',                     5,  4),
  ('B. Pelaksanaan Pembelajaran', 'Penguasaan materi pelajaran',                                  8,  5),
  ('B. Pelaksanaan Pembelajaran', 'Penggunaan metode/strategi yang variatif & tepat',             7,  6),
  ('B. Pelaksanaan Pembelajaran', 'Pemanfaatan media/teknologi pembelajaran',                     5,  7),
  ('B. Pelaksanaan Pembelajaran', 'Pengelolaan kelas & interaksi dengan siswa',                   8,  8),
  ('B. Pelaksanaan Pembelajaran', 'Penggunaan bahasa yang jelas dan komunikatif',                 4,  9),
  ('B. Pelaksanaan Pembelajaran', 'Menutup pelajaran (rangkuman & refleksi)',                     3, 10),
  -- C. Penilaian / Asesmen (20)
  ('C. Penilaian / Asesmen',      'Melakukan penilaian sesuai tujuan pembelajaran',               7, 11),
  ('C. Penilaian / Asesmen',      'Memberi umpan balik kepada siswa',                             7, 12),
  ('C. Penilaian / Asesmen',      'Mendorong keterlibatan & partisipasi aktif siswa',             6, 13),
  -- D. Sikap & Profesionalisme (15)
  ('D. Sikap & Profesionalisme',  'Kedisiplinan (kehadiran & ketepatan waktu)',                   5, 14),
  ('D. Sikap & Profesionalisme',  'Penampilan & keteladanan',                                     5, 15),
  ('D. Sikap & Profesionalisme',  'Kemampuan berkomunikasi & kerja sama',                         5, 16),
  -- E. Pengembangan Diri (10)
  ('E. Pengembangan Diri',        'Mengikuti pelatihan/peningkatan kompetensi',                   5, 17),
  ('E. Pengembangan Diri',        'Inovasi & refleksi dalam mengajar',                            5, 18)
) as v(category, indicator, weight, sort_order);

-- ------------------------------------------------------------
-- 2. GURU CONTOH
-- ------------------------------------------------------------
insert into public.teachers (full_name, subject, class_name, status) values
  ('Ani Rahmawati',   'Matematika',         '7A', 'aktif'),
  ('Budi Santoso',    'Bahasa Indonesia',   '8B', 'aktif'),
  ('Citra Dewi',      'IPA',                '9C', 'aktif'),
  ('Dedi Kurniawan',  'IPS',                '7B', 'aktif');

-- ------------------------------------------------------------
-- Cek hasil
-- ------------------------------------------------------------
-- select count(*) from public.rubric_items;  -- harus 18
-- select count(*) from public.teachers;      -- harus 4
