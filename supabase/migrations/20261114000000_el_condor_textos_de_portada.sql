-- El Cóndor del Ruiz sobre el panel de La Vaca Fifí: las frases que se alternan en el título de la portada pasan de
-- hero.rotating a hero.words (el nombre que usa el panel, lib/site.ts). Se conservan tal cual; solo cambia la clave.
-- En una base nueva no hay nada que mover.
update public.site_settings
set content = jsonb_set(content #- '{hero,rotating}', '{hero,words}', content -> 'hero' -> 'rotating')
where content -> 'hero' ? 'rotating';
