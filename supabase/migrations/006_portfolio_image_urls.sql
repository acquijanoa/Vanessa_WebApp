-- Galería por trabajo: orden fijo; la primera URL es la portada en la página principal.
alter table public.portfolio_items add column if not exists image_urls text[];

update public.portfolio_items
set image_urls = array[media_url]
where (image_urls is null or cardinality(image_urls) = 0) and media_url is not null;
