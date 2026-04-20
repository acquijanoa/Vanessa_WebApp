-- Paso 2 de 2: ejecuta DESPUÉS de 004, en una nueva consulta (nueva transacción).
-- Reasigna filas con categorías antiguas (fx, bridal, beauty).

update public.portfolio_items
set category = 'artistico_caracterizacion'::portfolio_category
where category::text = 'fx';

update public.portfolio_items
set category = 'social_celebraciones'::portfolio_category
where category::text = 'bridal';

update public.portfolio_items
set category = 'editorial_moda'::portfolio_category
where category::text = 'beauty';
