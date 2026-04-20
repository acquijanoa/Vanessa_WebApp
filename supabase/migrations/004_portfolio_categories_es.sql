-- Paso 1 de 2: añade etiquetas al enum. Ejecuta SOLO este archivo y confirma.
-- Postgres no permite usar valores de enum recién añadidos en la misma transacción
-- que el ALTER TYPE; los UPDATE van en 005 (ejecución aparte).

alter type portfolio_category add value if not exists 'social_celebraciones';
alter type portfolio_category add value if not exists 'profesional_corporativo';
alter type portfolio_category add value if not exists 'editorial_moda';
alter type portfolio_category add value if not exists 'artistico_caracterizacion';
