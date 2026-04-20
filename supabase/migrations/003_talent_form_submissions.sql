-- Public talent registration form (no Supabase Auth required).
-- Rows are inserted only from the Next.js API route using the service role.
create table if not exists public.talent_form_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  height_cm numeric(5,2),
  sizes_notes text,
  skin_tone text,
  eye_color text,
  skills text,
  digitals_urls text,
  created_at timestamptz not null default now()
);

alter table public.talent_form_submissions enable row level security;

comment on table public.talent_form_submissions is 'Guest talent applications from /talent/apply; API uses service role to insert.';
