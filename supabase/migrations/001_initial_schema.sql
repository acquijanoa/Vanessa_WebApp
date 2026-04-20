-- Vanessa Quijano — Maquillaje y Producción
-- PostgreSQL / Supabase initial schema
-- Run after enabling auth.users (Supabase Auth)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type user_role as enum ('admin', 'talent', 'client');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type location_style as enum ('industrial', 'vintage', 'modern');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type equipment_category as enum ('camera', 'lighting', 'grip');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type equipment_status as enum ('available', 'rented', 'maintenance', 'retired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type portfolio_category as enum ('fx', 'bridal', 'beauty');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type media_kind as enum ('image', 'video');
exception when duplicate_object then null;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  full_name text,
  phone text,
  company_name text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Talent applications (submitted before approval → model record)
create table if not exists public.talent_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  status application_status not null default 'pending',
  height_cm numeric(5,2),
  clothing_sizes jsonb default '{}'::jsonb,
  shoe_size text,
  skin_tone text,
  eye_color text,
  skills text[] default '{}',
  digitals_urls text[] default '{}',
  property_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  admin_notes text
);

create index if not exists idx_talent_applications_status on public.talent_applications (status);

-- Models (approved talent + comp cards)
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  slug text not null unique,
  height_cm numeric(5,2),
  clothing_sizes jsonb default '{}'::jsonb,
  shoe_size text,
  skin_tone text,
  eye_color text,
  skills text[] default '{}',
  comp_card_front_url text,
  comp_card_back_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_models_published on public.models (is_published);

-- Locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  style location_style not null,
  square_meters numeric(10,2),
  electrical_kw numeric(10,2),
  parking_spaces int,
  restrooms int,
  natural_light_orientation text,
  address text,
  description text,
  cover_image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_locations_style on public.locations (style);

-- Equipment + rentals
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category equipment_category not null,
  serial_number text,
  daily_rate numeric(12,2),
  status equipment_status not null default 'available',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shortlist_models (
  shortlist_id uuid not null references public.shortlists (id) on delete cascade,
  model_id uuid not null references public.models (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (shortlist_id, model_id)
);

create table if not exists public.equipment_rentals (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null default 'reserved',
  created_at timestamptz not null default now()
);

create index if not exists idx_equipment_rentals_dates on public.equipment_rentals (start_date, end_date);

-- Portfolio (public site)
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category portfolio_category not null,
  media_type media_kind not null,
  title text,
  media_url text not null,
  thumbnail_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_category on public.portfolio_items (category, published);

-- Bookings / production calendar
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location_id uuid references public.locations (id) on delete set null,
  notes text,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.talent_applications enable row level security;
alter table public.models enable row level security;
alter table public.locations enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_rentals enable row level security;
alter table public.projects enable row level security;
alter table public.shortlists enable row level security;
alter table public.shortlist_models enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.bookings enable row level security;

-- Policy examples (tighten for production)
-- Profiles: users read/update own row
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Admin full access via role (requires JWT custom claim or profiles.role check)
create policy "profiles_admin_all" on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Public read portfolio
create policy "portfolio_public_read" on public.portfolio_items for select using (published = true);

-- Models: verified clients + admin
create policy "models_verified_clients" on public.models for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'admin' or p.verified_at is not null))
  or is_published
);

-- Locations: same pattern
create policy "locations_verified_clients" on public.locations for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'admin' or p.verified_at is not null))
  or is_published
);

-- Talent applications: applicant sees own; admin sees all
create policy "applications_own" on public.talent_applications for select using (applicant_id = auth.uid());
create policy "applications_admin" on public.talent_applications for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

comment on table public.models is 'Talent comp cards and measurements; sensitive URLs should be served via watermarked proxy for clients.';
comment on table public.locations is 'Shoot locations with technical specs for production planning.';
