-- ============================================================
-- Teacher Supervisor — Migration: File Rencana Pembelajaran (RPP)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql.
-- Menambah: tabel lesson_plans + RLS + bucket Storage 'lesson-plans'.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL lesson_plans (catatan file RPP per observasi)
-- ------------------------------------------------------------
create table public.lesson_plans (
  id              uuid primary key default gen_random_uuid(),
  observation_id  uuid not null references public.observations(id) on delete cascade,
  teacher_id      uuid not null references public.teachers(id),
  file_path       text not null,        -- lokasi file di bucket storage
  file_name       text not null,        -- nama asli file
  uploaded_by     uuid references public.profiles(id),
  uploaded_at     timestamptz not null default now()
);

create index idx_lesson_plans_observation on public.lesson_plans(observation_id);

alter table public.lesson_plans enable row level security;

-- Supervisor lihat semua; guru hanya lihat miliknya (observasi atas namanya).
create policy "lesson_plans_select" on public.lesson_plans
  for select using (
    public.is_supervisor()
    or teacher_id = (select teacher_id from public.profiles where id = auth.uid())
  );

-- Guru hanya boleh menambah file untuk dirinya sendiri.
create policy "lesson_plans_insert_own" on public.lesson_plans
  for insert with check (
    teacher_id = (select teacher_id from public.profiles where id = auth.uid())
  );

-- Guru boleh menghapus filenya sendiri (untuk ganti/upload ulang).
create policy "lesson_plans_delete_own" on public.lesson_plans
  for delete using (
    teacher_id = (select teacher_id from public.profiles where id = auth.uid())
  );

-- ------------------------------------------------------------
-- 2. BUCKET STORAGE 'lesson-plans' (private)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('lesson-plans', 'lesson-plans', false)
on conflict (id) do nothing;

-- User terautentikasi boleh upload & baca file di bucket ini.
-- (Kontrol lebih rinci sudah ditangani tabel lesson_plans + signed URL.)
create policy "lesson_plans_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-plans');

create policy "lesson_plans_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-plans');

create policy "lesson_plans_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-plans');
