-- ============================================================
-- Teacher Supervisor — Seed 15 Jadwal Observasi
-- Jalankan di Supabase SQL Editor SETELAH schema.sql + seed.sql
-- + akun guru (scripts/seed-teachers.mjs) sudah ada.
--
-- Membuat 15 observasi status 'terjadwal' untuk guru yang
-- mengemban tugas "Guru Mata Pelajaran" (tugas yang sudah punya rubrik).
-- Tanggal tersebar 1..15 hari ke depan.
-- ============================================================

-- ------------------------------------------------------------
-- PRASYARAT: harus ada akun supervisor. Cek dulu:
--   select email, role from public.profiles where role in ('supervisor','admin');
-- Kalau kosong, jadikan salah satu akun supervisor:
--   update public.profiles set role='supervisor' where email='EMAIL_KAMU';
-- ------------------------------------------------------------

with sup as (
  select id from public.profiles
  where role in ('supervisor', 'admin')
  order by created_at
  limit 1
),
role_rubric as (
  select tr.id as role_id, r.id as rubric_id
  from public.teaching_roles tr
  join public.rubrics r
    on r.teaching_role_id = tr.id and r.is_active
  where tr.name = 'Guru Mata Pelajaran'
  limit 1
),
gurus as (
  select trm.teacher_id,
         p.class_name,
         row_number() over (order by p.full_name) as rn
  from public.teacher_roles trm
  join public.profiles p on p.id = trm.teacher_id
  join role_rubric rr on rr.role_id = trm.teaching_role_id
  where p.role = 'guru'
  order by p.full_name
  limit 15
)
insert into public.observations
  (teacher_id, supervisor_id, teaching_role_id, rubric_id, observed_at, class_name, status)
select
  g.teacher_id,
  (select id from sup),
  rr.role_id,
  rr.rubric_id,
  (current_date + g.rn::int),      -- tanggal berbeda tiap observasi
  g.class_name,
  'terjadwal'
from gurus g, role_rubric rr;

-- ------------------------------------------------------------
-- Cek hasil (versi manusiawi)
-- ------------------------------------------------------------
-- select o.observed_at, p.full_name as guru, tr.name as tugas, o.status
-- from public.observations o
-- join public.profiles p on p.id = o.teacher_id
-- join public.teaching_roles tr on tr.id = o.teaching_role_id
-- order by o.observed_at;
