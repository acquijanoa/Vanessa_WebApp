-- Description for portfolio entries (used on the public site and admin)
alter table public.portfolio_items add column if not exists description text;

-- Bucket for portfolio images (public read; uploads use service role from the app)
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Allow anonymous read of objects in this bucket (images on the public homepage)
drop policy if exists "Public read portfolio bucket" on storage.objects;
create policy "Public read portfolio bucket"
on storage.objects for select
to public
using (bucket_id = 'portfolio');
