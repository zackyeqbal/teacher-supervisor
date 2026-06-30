-- ============================================================
-- Teacher Supervisor — Skema Database (Supabase / Postgres)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- Enum role
create type user_role as enum ('supervisor', 'guru', 'admin');

-- ------------------------------------------------------------
-- 1. PROFILES (terhubung ke auth.users bawaan Supabase)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        user_role not null default 'guru',
  teacher_id  uuid,            -- diisi jika role = guru (FK ditambah setelah teachers dibuat)
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TEACHERS (data master guru)
-- ------------------------------------------------------------
create table public.teachers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  subject     text,            -- mata pelajaran
  class_name  text,            -- kelas yang diampu
  status      text not null default 'aktif',  -- aktif / nonaktif
  created_at  timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_teacher_fk
  foreign key (teacher_id) references public.teachers(id) on delete set null;

-- ------------------------------------------------------------
-- 3. RUBRICS (template penilaian)
-- ------------------------------------------------------------
create table public.rubrics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  scale_max   int not null default 4,   -- skala skor maksimum per indikator
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. RUBRIC_ITEMS (indikator dalam rubrik)
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
-- 5. OBSERVATIONS (sesi observasi/penilaian)
-- ------------------------------------------------------------
create table public.observations (
  id             uuid primary key default gen_random_uuid(),
  teacher_id     uuid not null references public.teachers(id) on delete cascade,
  supervisor_id  uuid not null references public.profiles(id),
  rubric_id      uuid not null references public.rubrics(id),
  observed_at    date not null default current_date,
  class_name     text,
  status         text not null default 'terjadwal', -- terjadwal / selesai
  general_notes  text,
  final_score    numeric,               -- nilai akhir 0-100 (diisi saat selesai)
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. OBSERVATION_SCORES (skor per indikator)
-- ------------------------------------------------------------
create table public.observation_scores (
  id              uuid primary key default gen_random_uuid(),
  observation_id  uuid not null references public.observations(id) on delete cascade,
  rubric_item_id  uuid not null references public.rubric_items(id),
  score           int not null,         -- 1..scale_max
  note            text,
  unique (observation_id, rubric_item_id)
);

-- Index bantu
create index idx_observations_teacher on public.observations(teacher_id);
create index idx_scores_observation on public.observation_scores(observation_id);
create index idx_items_rubric on public.rubric_items(rubric_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.teachers            enable row level security;
alter table public.rubrics             enable row level security;
alter table public.rubric_items        enable row level security;
alter table public.observations        enable row level security;
alter table public.observation_scores  enable row level security;

-- Helper: cek apakah user adalah supervisor/admin
create or replace function public.is_supervisor()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('supervisor','admin')
  );
$$;

-- PROFILES: user lihat profil sendiri; supervisor lihat semua
create policy "profiles_select_self_or_supervisor" on public.profiles
  for select using (id = auth.uid() or public.is_supervisor());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- TEACHERS / RUBRICS / RUBRIC_ITEMS:
-- semua user terautentikasi boleh baca; hanya supervisor boleh ubah
create policy "teachers_read" on public.teachers
  for select using (auth.role() = 'authenticated');
create policy "teachers_write" on public.teachers
  for all using (public.is_supervisor()) with check (public.is_supervisor());

create policy "rubrics_read" on public.rubrics
  for select using (auth.role() = 'authenticated');
create policy "rubrics_write" on public.rubrics
  for all using (public.is_supervisor()) with check (public.is_supervisor());

create policy "rubric_items_read" on public.rubric_items
  for select using (auth.role() = 'authenticated');
create policy "rubric_items_write" on public.rubric_items
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- OBSERVATIONS: supervisor lihat semua & kelola; guru hanya lihat miliknya
create policy "observations_select" on public.observations
  for select using (
    public.is_supervisor()
    or teacher_id = (select teacher_id from public.profiles where id = auth.uid())
  );
create policy "observations_write" on public.observations
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- OBSERVATION_SCORES: ikut aturan observasi induknya
create policy "scores_select" on public.observation_scores
  for select using (
    exists (
      select 1 from public.observations o
      where o.id = observation_id
        and (
          public.is_supervisor()
          or o.teacher_id = (select teacher_id from public.profiles where id = auth.uid())
        )
    )
  );
create policy "scores_write" on public.observation_scores
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- ============================================================
-- (Opsional) Trigger buat profile otomatis saat user daftar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'guru');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
