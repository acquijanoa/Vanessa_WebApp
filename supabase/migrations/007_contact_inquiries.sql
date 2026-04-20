-- Public contact form from home portfolio section; inserts only from Next.js API (service role).
create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_inquiries enable row level security;

comment on table public.contact_inquiries is 'Guest contact messages from site footer; API uses service role to insert.';
