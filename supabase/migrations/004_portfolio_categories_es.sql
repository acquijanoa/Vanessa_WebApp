-- Categorías de portfolio en español (maquillaje). Los valores antiguos (fx, bridal, beauty)
-- se reasignan a la nueva taxonomía.

alter type portfolio_category add value if not exists 'social_celebraciones';
alter type portfolio_category add value if not exists 'profesional_corporativo';
alter type portfolio_category add value if not exists 'editorial_moda';
alter type portfolio_category add value if not exists 'artistico_caracterizacion';

update public.portfolio_items
set category = 'artistico_caracterizacion'::portfolio_category
where category::text = 'fx';

update public.portfolio_items
set category = 'social_celebraciones'::portfolio_category
where category::text = 'bridal';

update public.portfolio_items
set category = 'editorial_moda'::portfolio_category
where category::text = 'beauty';
