-- ============================================================
-- Teacher Supervisor — Skema Database (Supabase / Postgres)
-- Jalankan di Supabase SQL Editor.
--
-- Desain: TIAP guru punya akun login, jadi data guru digabung
-- ke dalam tabel `profiles` (tidak ada tabel `teachers` terpisah).
--
-- CATATAN: script ini me-reset seluruh tabel di schema public
-- (drop lalu buat ulang). Cocok untuk setup/rebuild saat dev.
-- ============================================================

-- ------------------------------------------------------------
-- 0. RESET (hapus objek lama biar bisa dijalankan ulang)
-- ------------------------------------------------------------
drop table if exists public.lesson_plans        cascade;
drop table if exists public.observation_scores  cascade;
drop table if exists public.observations        cascade;
drop table if exists public.rubric_items        cascade;
drop table if exists public.rubrics             cascade;
drop table if exists public.teacher_roles       cascade;
drop table if exists public.teaching_roles      cascade;
drop table if exists public.teachers            cascade;  -- tabel lama (jika ada)
drop table if exists public.profiles            cascade;
drop type  if exists user_role                  cascade;

-- Enum role
create type user_role as enum ('supervisor', 'guru', 'admin');

-- ------------------------------------------------------------
-- 1. PROFILES (akun + sekaligus data guru)
--    - Supervisor/admin: subject/class_name dibiarkan kosong.
--    - Guru: subject/class_name diisi.
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        user_role not null default 'guru',
  subject     text,            -- mata pelajaran (untuk guru)
  class_name  text,            -- kelas yang diampu (untuk guru)
  status      text not null default 'aktif',  -- aktif / nonaktif
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TEACHING_ROLES (master tugas/peran guru — 13 jenis)
--    Berbeda dari user_role (hak akses). Ini konteks penilaian:
--    tiap tugas punya rubriknya sendiri.
-- ------------------------------------------------------------
create table public.teaching_roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,     -- "Guru Mapel", "Wali Kelas", "Guru Piket"
  description text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2b. TEACHER_ROLES (1 guru bisa mengemban banyak tugas)
-- ------------------------------------------------------------
create table public.teacher_roles (
  teacher_id       uuid not null references public.profiles(id) on delete cascade,
  teaching_role_id uuid not null references public.teaching_roles(id) on delete cascade,
  primary key (teacher_id, teaching_role_id)
);

-- ------------------------------------------------------------
-- 3. RUBRICS (template penilaian) — tiap rubrik milik satu tugas
-- ------------------------------------------------------------
create table public.rubrics (
  id               uuid primary key default gen_random_uuid(),
  teaching_role_id uuid references public.teaching_roles(id),  -- rubrik untuk tugas apa
  name             text not null,
  description      text,
  scale_max        int not null default 4,   -- skala skor maksimum per indikator
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. RUBRIC_ITEMS (indikator dalam rubrik)
-- ------------------------------------------------------------
create table public.rubric_items (
  id          uuid primary key default gen_random_uuid(),
  rubric_id   uuid not null references public.rubrics(id) on delete cascade,
  category    text not null,            -- mis. "Pelaksanaan Pembelajaran"
  indicator   text not null,            -- mis. "Penguasaan materi"
  weight      numeric not null default 1,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. OBSERVATIONS (sesi observasi/penilaian)
--    teacher_id & supervisor_id keduanya menunjuk ke profiles.
-- ------------------------------------------------------------
create table public.observations (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.profiles(id) on delete cascade,
  supervisor_id    uuid not null references public.profiles(id),
  teaching_role_id uuid references public.teaching_roles(id),  -- dinilai sebagai tugas apa
  rubric_id        uuid not null references public.rubrics(id), -- rubrik yang dipakai (dari tugas)
  observed_at      date not null default current_date,
  class_name     text,
  status         text not null default 'terjadwal', -- terjadwal / selesai
  general_notes  text,
  final_score    numeric,               -- nilai akhir 0-100 (diisi saat selesai)
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. OBSERVATION_SCORES (skor per indikator)
-- ------------------------------------------------------------
create table public.observation_scores (
  id              uuid primary key default gen_random_uuid(),
  observation_id  uuid not null references public.observations(id) on delete cascade,
  rubric_item_id  uuid not null references public.rubric_items(id),
  score           int not null,         -- 1..scale_max
  note            text,
  unique (observation_id, rubric_item_id)
);

-- ------------------------------------------------------------
-- 6. LESSON_PLANS (file RPP yang diunggah guru per observasi)
--    File fisik di bucket storage 'lesson-plans'; tabel ini metadata.
-- ------------------------------------------------------------
create table public.lesson_plans (
  id              uuid primary key default gen_random_uuid(),
  observation_id  uuid not null references public.observations(id) on delete cascade,
  teacher_id      uuid not null references public.profiles(id),
  file_path       text not null,
  file_name       text not null,
  uploaded_by     uuid references public.profiles(id),
  uploaded_at     timestamptz not null default now()
);

-- Index bantu
create index idx_observations_teacher on public.observations(teacher_id);
create index idx_scores_observation   on public.observation_scores(observation_id);
create index idx_items_rubric         on public.rubric_items(rubric_id);
create index idx_lesson_plans_obs     on public.lesson_plans(observation_id);
create index idx_teacher_roles_teacher on public.teacher_roles(teacher_id);
create index idx_rubrics_role          on public.rubrics(teaching_role_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.teaching_roles      enable row level security;
alter table public.teacher_roles       enable row level security;
alter table public.rubrics             enable row level security;
alter table public.rubric_items        enable row level security;
alter table public.observations        enable row level security;
alter table public.observation_scores  enable row level security;
alter table public.lesson_plans        enable row level security;

-- Helper: cek apakah user adalah supervisor/admin
create or replace function public.is_supervisor()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('supervisor','admin')
  );
$$;

-- PROFILES: user lihat profil sendiri; supervisor lihat semua.
-- Update: diri sendiri atau supervisor (untuk kelola data guru).
create policy "profiles_select_self_or_supervisor" on public.profiles
  for select using (id = auth.uid() or public.is_supervisor());
create policy "profiles_update_self_or_supervisor" on public.profiles
  for update using (id = auth.uid() or public.is_supervisor());

-- TEACHING_ROLES / TEACHER_ROLES: semua user login boleh baca; supervisor boleh ubah
create policy "teaching_roles_read" on public.teaching_roles
  for select using (auth.role() = 'authenticated');
create policy "teaching_roles_write" on public.teaching_roles
  for all using (public.is_supervisor()) with check (public.is_supervisor());

create policy "teacher_roles_read" on public.teacher_roles
  for select using (auth.role() = 'authenticated');
create policy "teacher_roles_write" on public.teacher_roles
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- RUBRICS / RUBRIC_ITEMS: semua user login boleh baca; supervisor boleh ubah
create policy "rubrics_read" on public.rubrics
  for select using (auth.role() = 'authenticated');
create policy "rubrics_write" on public.rubrics
  for all using (public.is_supervisor()) with check (public.is_supervisor());

create policy "rubric_items_read" on public.rubric_items
  for select using (auth.role() = 'authenticated');
create policy "rubric_items_write" on public.rubric_items
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- OBSERVATIONS: supervisor kelola semua; guru hanya lihat miliknya
create policy "observations_select" on public.observations
  for select using (public.is_supervisor() or teacher_id = auth.uid());
create policy "observations_write" on public.observations
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- OBSERVATION_SCORES: ikut aturan observasi induknya
create policy "scores_select" on public.observation_scores
  for select using (
    exists (
      select 1 from public.observations o
      where o.id = observation_id
        and (public.is_supervisor() or o.teacher_id = auth.uid())
    )
  );
create policy "scores_write" on public.observation_scores
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- LESSON_PLANS: supervisor lihat semua; guru kelola miliknya
create policy "lesson_plans_select" on public.lesson_plans
  for select using (public.is_supervisor() or teacher_id = auth.uid());
create policy "lesson_plans_insert_own" on public.lesson_plans
  for insert with check (teacher_id = auth.uid());
create policy "lesson_plans_delete_own" on public.lesson_plans
  for delete using (teacher_id = auth.uid());

-- ============================================================
-- STORAGE: bucket 'lesson-plans' (private)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lesson-plans', 'lesson-plans', false)
on conflict (id) do nothing;

drop policy if exists "lesson_plans_storage_insert" on storage.objects;
drop policy if exists "lesson_plans_storage_select" on storage.objects;
drop policy if exists "lesson_plans_storage_delete" on storage.objects;

create policy "lesson_plans_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'lesson-plans');
create policy "lesson_plans_storage_select" on storage.objects
  for select to authenticated using (bucket_id = 'lesson-plans');
create policy "lesson_plans_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lesson-plans');

-- ============================================================
-- Trigger: buat profile otomatis saat user daftar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'guru');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Backfill: buat profile untuk user yang sudah terlanjur ada
-- (mis. akun yang dibuat sebelum rebuild ini).
-- ------------------------------------------------------------
insert into public.profiles (id, email, role)
select id, email, 'guru' from auth.users
on conflict (id) do nothing;
