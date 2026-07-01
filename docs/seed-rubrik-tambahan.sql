-- ============================================================
-- Teacher Supervisor — Seed Rubrik Tambahan: Wali Kelas & Guru Piket
-- Jalankan di Supabase SQL Editor SETELAH schema.sql + seed.sql.
--
-- CATATAN: ini rubrik DRAFT (belum ada instrumen resmi). Skala 0-4,
-- bobot sama rata (1), predikat mengikuti aturan yang sama (A-D).
-- Aman dijalankan ulang: rubrik hanya dibuat kalau tugasnya belum punya.
-- ============================================================

-- ------------------------------------------------------------
-- 1. RUBRIK WALI KELAS
-- ------------------------------------------------------------
with r as (
  insert into public.rubrics (teaching_role_id, name, description, scale_max, is_active)
  select
    (select id from public.teaching_roles where name = 'Wali Kelas'),
    'Rubrik Supervisi Wali Kelas',
    'Skala 0-4, bobot sama. NILAI = total skor / (4 x jumlah indikator) x 100.',
    4,
    true
  where not exists (
    select 1 from public.rubrics rb
    join public.teaching_roles t on t.id = rb.teaching_role_id
    where t.name = 'Wali Kelas'
  )
  returning id
)
insert into public.rubric_items (rubric_id, category, indicator, weight, sort_order)
select r.id, v.category, v.indicator, v.weight, v.sort_order
from r,
(values
  ('A. Administrasi Kelas', 'Menyiapkan dan mengisi daftar hadir siswa secara rutin', 1, 1),
  ('A. Administrasi Kelas', 'Mengelola jurnal/agenda kegiatan kelas', 1, 2),
  ('A. Administrasi Kelas', 'Melengkapi buku induk/data administrasi siswa', 1, 3),
  ('A. Administrasi Kelas', 'Menyusun struktur organisasi dan jadwal piket kelas', 1, 4),
  ('B. Pembinaan & Bimbingan Siswa', 'Membina sikap, karakter, dan kedisiplinan siswa', 1, 5),
  ('B. Pembinaan & Bimbingan Siswa', 'Menangani permasalahan/kasus siswa di kelas', 1, 6),
  ('B. Pembinaan & Bimbingan Siswa', 'Memberikan motivasi dan bimbingan belajar kepada siswa', 1, 7),
  ('C. Pengelolaan Kelas (7K)', 'Menjaga kebersihan, kerapian, dan keindahan kelas', 1, 8),
  ('C. Pengelolaan Kelas (7K)', 'Menciptakan suasana kelas yang aman dan nyaman', 1, 9),
  ('C. Pengelolaan Kelas (7K)', 'Mengelola sarana dan inventaris kelas', 1, 10),
  ('D. Komunikasi & Pelaporan', 'Menjalin komunikasi dengan orang tua/wali siswa', 1, 11),
  ('D. Komunikasi & Pelaporan', 'Mengisi dan membagikan laporan hasil belajar (rapor) tepat waktu', 1, 12),
  ('D. Komunikasi & Pelaporan', 'Berkoordinasi dengan guru BK dan guru mapel terkait perkembangan siswa', 1, 13)
) as v(category, indicator, weight, sort_order);

-- ------------------------------------------------------------
-- 2. RUBRIK GURU PIKET
-- ------------------------------------------------------------
with r as (
  insert into public.rubrics (teaching_role_id, name, description, scale_max, is_active)
  select
    (select id from public.teaching_roles where name = 'Guru Piket'),
    'Rubrik Supervisi Guru Piket',
    'Skala 0-4, bobot sama. NILAI = total skor / (4 x jumlah indikator) x 100.',
    4,
    true
  where not exists (
    select 1 from public.rubrics rb
    join public.teaching_roles t on t.id = rb.teaching_role_id
    where t.name = 'Guru Piket'
  )
  returning id
)
insert into public.rubric_items (rubric_id, category, indicator, weight, sort_order)
select r.id, v.category, v.indicator, v.weight, v.sort_order
from r,
(values
  ('A. Kehadiran & Kesiapan', 'Hadir tepat waktu sesuai jadwal piket', 1, 1),
  ('A. Kehadiran & Kesiapan', 'Siap bertugas dengan atribut/perlengkapan piket', 1, 2),
  ('B. Pencatatan & Administrasi', 'Mencatat kehadiran guru dan siswa', 1, 3),
  ('B. Pencatatan & Administrasi', 'Mengisi buku/jurnal piket secara lengkap', 1, 4),
  ('B. Pencatatan & Administrasi', 'Mencatat siswa terlambat, izin, dan pulang lebih awal', 1, 5),
  ('C. Pelayanan & Ketertiban', 'Menangani siswa terlambat sesuai aturan sekolah', 1, 6),
  ('C. Pelayanan & Ketertiban', 'Mengondisikan/mengisi kelas yang kosong saat guru berhalangan', 1, 7),
  ('C. Pelayanan & Ketertiban', 'Menjaga ketertiban dan keamanan lingkungan sekolah', 1, 8),
  ('C. Pelayanan & Ketertiban', 'Melayani tamu dan keperluan selama jam piket', 1, 9),
  ('D. Koordinasi & Pelaporan', 'Berkoordinasi dengan wali kelas/guru terkait siswa bermasalah', 1, 10),
  ('D. Koordinasi & Pelaporan', 'Melaporkan kejadian penting kepada pimpinan', 1, 11),
  ('D. Koordinasi & Pelaporan', 'Mengatur pergantian jam pelajaran (bel) tepat waktu', 1, 12)
) as v(category, indicator, weight, sort_order);

-- ------------------------------------------------------------
-- Cek hasil
-- ------------------------------------------------------------
-- select tr.name as tugas, r.name as rubrik, count(ri.*) as jumlah_indikator
-- from public.rubrics r
-- join public.teaching_roles tr on tr.id = r.teaching_role_id
-- left join public.rubric_items ri on ri.rubric_id = r.id
-- where tr.name in ('Wali Kelas','Guru Piket')
-- group by tr.name, r.name;
