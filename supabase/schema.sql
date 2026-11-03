-- FitCheck AI - Supabase Database Schema & RLS Policies

create extension if not exists "pgcrypto";

-- 1. Enums
do $$ begin
  create type public.stretch_type as enum ('kaku', 'sedikit_stretch', 'stretch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('queued', 'processing', 'done', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fit_label as enum ('snug', 'regular', 'loose');
exception when duplicate_object then null; end $$;

-- 2. Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric(5,2),
  chest_cm numeric(5,2),
  weight_kg numeric(5,2),
  waist_cm numeric(5,2),
  shoulder_cm numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chest_width_cm numeric(5,2) not null,
  hem_width_cm numeric(5,2),
  shoulder_width_cm numeric(5,2),
  length_cm numeric(5,2),
  stretch_type public.stretch_type not null default 'kaku',
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.tryon_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.job_status not null default 'queued',
  person_image_path text,
  garment_image_path text,
  result_image_path text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

create table if not exists public.fit_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.tryon_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chest_ease_cm numeric(5,2) not null,
  fit_label public.fit_label not null,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.garments enable row level security;
alter table public.tryon_jobs enable row level security;
alter table public.fit_results enable row level security;

-- Profiles policies (id = auth.uid())
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- Garments policies (user_id = auth.uid())
create policy "garments_select_own" on public.garments
  for select using (auth.uid() = user_id);
create policy "garments_insert_own" on public.garments
  for insert with check (auth.uid() = user_id);
create policy "garments_update_own" on public.garments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "garments_delete_own" on public.garments
  for delete using (auth.uid() = user_id);

-- TryOn Jobs policies (user_id = auth.uid())
create policy "tryon_jobs_select_own" on public.tryon_jobs
  for select using (auth.uid() = user_id);
create policy "tryon_jobs_insert_own" on public.tryon_jobs
  for insert with check (auth.uid() = user_id);
create policy "tryon_jobs_update_own" on public.tryon_jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tryon_jobs_delete_own" on public.tryon_jobs
  for delete using (auth.uid() = user_id);

-- Fit Results policies (user_id = auth.uid())
create policy "fit_results_select_own" on public.fit_results
  for select using (auth.uid() = user_id);
create policy "fit_results_insert_own" on public.fit_results
  for insert with check (auth.uid() = user_id);
create policy "fit_results_update_own" on public.fit_results
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fit_results_delete_own" on public.fit_results
  for delete using (auth.uid() = user_id);

-- 4. Private Storage Bucket for Try-On Photos
insert into storage.buckets (id, name, public)
values ('tryon-photos', 'tryon-photos', false)
on conflict (id) do nothing;

create policy "storage_tryon_select_own" on storage.objects
  for select using (
    bucket_id = 'tryon-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_tryon_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'tryon-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_tryon_delete_own" on storage.objects
  for delete using (
    bucket_id = 'tryon-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
