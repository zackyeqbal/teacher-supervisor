-- ============================================================
-- Teacher Supervisor — Data Awal (Seed)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql.
-- Isi: 13 tugas guru + rubrik "Guru Mata Pelajaran" (32 indikator, skala 0-4).
--
-- CATATAN: guru = akun login, jadi TIDAK di-seed di sini.
-- Buat guru lewat: Authentication > Users > Add user (Auto Confirm),
-- lalu Table Editor > profiles: set role='guru', isi subject & class_name.
-- ============================================================
-- Jangan jalankan dua kali (nanti rubriknya dobel).
-- Kalau mau ulang dari bersih, hapus dulu:
--   delete from public.rubric_items;
--   delete from public.rubrics;
-- ============================================================

-- ------------------------------------------------------------
-- 1. TUGAS/PERAN GURU (13 jenis) — tiap tugas punya rubriknya sendiri
-- ------------------------------------------------------------
insert into public.teaching_roles (name) values
  ('Guru Mata Pelajaran'),
  ('Wakil Kepala Sarana'),
  ('Wakil Kepala Kurikulum'),
  ('Wakil Kepala Kesiswaan'),
  ('Wakil Kepala Hubungan Masyarakat'),
  ('Kepala Lab'),
  ('Kepala Perpustakaan'),
  ('Wali Kelas'),
  ('Pembina OSIS'),
  ('Pembina UKS'),
  ('Pembina Pramuka'),
  ('Guru Piket'),
  ('Guru BK')
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- 2. RUBRIK + INDIKATOR untuk tugas "Guru Mata Pelajaran"
--    Sumber: Instrumen Supervisi Proses Pembelajaran MTsN Kota Cimahi.
--    Skala 0-4, 32 indikator, bobot sama rata (1).
--    NILAI = total skor / (4 × 32) × 100  (skor maksimal ideal = 128).
--    Rubrik untuk 12 tugas lain dibuat menyusul (via app/Table Editor).
-- ------------------------------------------------------------
with r as (
  insert into public.rubrics (teaching_role_id, name, description, scale_max, is_active)
  values (
    (select id from public.teaching_roles where name = 'Guru Mata Pelajaran'),
    'Instrumen Supervisi Proses Pembelajaran (Guru Mata Pelajaran)',
    'Skala 0-4, 32 indikator bobot sama. NILAI = total skor / skor maksimal ideal (128) × 100.',
    4,
    true
  )
  returning id
)
insert into public.rubric_items (rubric_id, category, indicator, weight, sort_order)
select r.id, v.category, v.indicator, v.weight, v.sort_order
from r,
(values
  -- I. PENDAHULUAN
  ('I. Pendahuluan', 'Guru hadir tepat waktu', 1, 1),
  ('I. Pendahuluan', 'Guru mengenakan busana sesuai aturan yang berlaku, berpenampilan menarik yang dapat memberikan contoh pada siswa sebagai penerapan Pendidikan Karakter', 1, 2),
  ('I. Pendahuluan', 'Guru menyiapkan fisik dan psikis siswa agar siap untuk belajar dan menerapkan Pendidikan Karakter dalam pembelajarannya', 1, 3),
  ('I. Pendahuluan', 'Guru memberikan pertanyaan pemantik agar siswa dapat mengkaitkan materi sekarang dengan materi sebelumnya', 1, 4),
  ('I. Pendahuluan', 'Guru memberikan motivasi dengan pertanyaan pemantik agar siswa mengetahui manfaat dari materi yang akan dipelajari', 1, 5),
  ('I. Pendahuluan', 'Guru memberikan motivasi dengan pertanyaan pemantik agar siswa mengetahui kaitan dari materi yang akan dipelajari dengan ayat-ayat dalam Al Quran', 1, 6),
  ('I. Pendahuluan', 'Guru menyampaikan tujuan pembelajaran yang akan dipelajari', 1, 7),
  -- II.A Penguasaan Materi Pembelajaran
  ('II.A Penguasaan Materi Pembelajaran', 'Kemampuan menyesuaikan materi pembelajaran dengan tujuan pembelajaran yang akan dicapai', 1, 8),
  ('II.A Penguasaan Materi Pembelajaran', 'Menyajikan pembahasan elemen materi pembelajaran lengkap sesuai dengan konsep CP yang dipelajari', 1, 9),
  ('II.A Penguasaan Materi Pembelajaran', 'Menggunakan pendekatan/metode pembelajaran yang dapat menstimulasi kedalaman materi yang dipelajari', 1, 10),
  ('II.A Penguasaan Materi Pembelajaran', 'Memotivasi peserta didik untuk berpartisipasi aktif agar terbangun sikap pembelajar mandiri', 1, 11),
  ('II.A Penguasaan Materi Pembelajaran', 'Kemampuan melaksanakan pembelajaran mengikuti kerangka Alur Tujuan Pembelajaran', 1, 12),
  -- II.B Kemampuan Mengimplementasi Pembelajaran
  ('II.B Kemampuan Mengimplementasi Pembelajaran', 'Kemampuan mengkoneksi materi pembelajaran yang memunculkan kemampuan HOTS pada siswa', 1, 13),
  ('II.B Kemampuan Mengimplementasi Pembelajaran', 'Kemampuan mengkoneksi materi pembelajaran yang relevan dengan kehidupan sehari-hari sehingga memunculkan kemampuan literasi siswa', 1, 14),
  ('II.B Kemampuan Mengimplementasi Pembelajaran', 'Kemampuan memfasilitasi peserta didik melalui pemberian tugas/diskusi/dll sehingga memunculkan kemampuan literasi/numerasi siswa', 1, 15),
  ('II.B Kemampuan Mengimplementasi Pembelajaran', 'Kemampuan memberikan ruang yang cukup bagi prakarsa, kreativitas, kemandirian sesuai bakat, minat, dan perkembangan fisik serta psikologis peserta didik (creativity and innovation)', 1, 16),
  -- II.C Memunculkan Kemampuan Abad 21
  ('II.C Memunculkan Kemampuan Abad 21', 'Kemampuan menggunakan metode/pendekatan pembelajaran yang tepat sehingga siswa memiliki kemampuan komunikasi yang baik', 1, 17),
  ('II.C Memunculkan Kemampuan Abad 21', 'Metode pembelajaran yang dilaksanakan menantang sehingga memunculkan kemampuan berpikir kritis dan penyelesaian masalah', 1, 18),
  ('II.C Memunculkan Kemampuan Abad 21', 'Kemampuan pembelajaran mendorong peserta didik untuk membiasakan bekerja sama (collaboration)', 1, 19),
  -- II.D Kemampuan Menggunakan Media dan Sumber Belajar
  ('II.D Kemampuan Menggunakan Media dan Sumber Belajar', 'Kemampuan menunjukkan keterampilan dalam menggunakan sumber pembelajaran sehingga menghasilkan pesan yang menarik dan bermakna', 1, 20),
  ('II.D Kemampuan Menggunakan Media dan Sumber Belajar', 'Kemampuan menunjukkan keterampilan dalam menggunakan media pembelajaran sehingga menghasilkan pesan yang menarik dan bermakna', 1, 21),
  -- II.E Kemampuan Berinteraksi dengan Siswa
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Kemampuan melibatkan peserta didik dalam pemanfaatan sumber pembelajaran', 1, 22),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Kemampuan memberikan umpan balik positif (penguatan) dalam bentuk lisan/tulisan/isyarat/apresiasi terhadap pencapaian TP yang dilakukan siswa', 1, 23),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Kemampuan melibatkan peserta didik secara aktif dalam setiap kegiatan pembelajaran', 1, 24),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Melibatkan peserta didik mencari informasi yang luas dan dalam dari berbagai sumber', 1, 25),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Memfasilitasi peserta didik untuk menyajikan hasil kerja individu maupun kelompok', 1, 26),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Memfasilitasi peserta didik melakukan refleksi untuk memperoleh pengalaman belajar yang telah dilakukan', 1, 27),
  ('II.E Kemampuan Berinteraksi dengan Siswa', 'Menggunakan bahasa Indonesia yang baik dan benar', 1, 28),
  -- III. KEGIATAN PENUTUP
  ('III. Kegiatan Penutup', 'Bersama-sama dengan peserta didik membuat rangkuman/simpulan pelajaran', 1, 29),
  ('III. Kegiatan Penutup', 'Melakukan penilaian terhadap kegiatan yang telah dilaksanakan secara konsisten dan terprogram', 1, 30),
  ('III. Kegiatan Penutup', 'Memberi umpan balik terhadap proses dan hasil pembelajaran', 1, 31),
  ('III. Kegiatan Penutup', 'Menyampaikan rencana pembelajaran berikutnya', 1, 32)
) as v(category, indicator, weight, sort_order);

-- ------------------------------------------------------------
-- Cek hasil
-- ------------------------------------------------------------
-- select count(*) from public.rubric_items;    -- harus 32
-- select count(*) from public.teaching_roles;  -- harus 13

-- ------------------------------------------------------------
-- (Opsional) Jadikan akun tertentu sebagai guru + isi datanya.
-- Ganti email sesuai akun yang sudah dibuat via Authentication.
-- ------------------------------------------------------------
-- update public.profiles
-- set role = 'guru', full_name = 'Ani Rahmawati',
--     subject = 'Matematika', class_name = '7A'
-- where email = 'guru@sekolah.com';

-- ------------------------------------------------------------
-- (Opsional) Tandai tugas yang diemban guru tsb (bisa lebih dari satu).
-- Contoh: Ani = Guru Mata Pelajaran + Wali Kelas.
-- ------------------------------------------------------------
-- insert into public.teacher_roles (teacher_id, teaching_role_id)
-- select p.id, t.id
-- from public.profiles p, public.teaching_roles t
-- where p.email = 'guru@sekolah.com'
--   and t.name in ('Guru Mata Pelajaran', 'Wali Kelas')
-- on conflict do nothing;
