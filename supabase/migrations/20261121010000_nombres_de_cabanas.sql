-- Nombre propio de cada cabaña física ("El Mirador", "Nevado"), por posición como unit_labels: ['El Mirador', ''] = la
-- unidad 1 se llama El Mirador y la 2 no tiene nombre. Con nombre, el panel y los correos muestran el nombre en lugar de
-- «Cabaña N»; sin nombre, como antes. El número (unit_labels) se conserva para buscar y para Booking.
-- Solo se muestra: reservas, bloqueos y baños siguen usando la posición. Formato y repetidos se validan en la API
-- (invalidUnitNames). Aditiva: el código anterior ignora esta columna.
alter table public.cabin_types
  add column unit_names text[] not null default '{}'
  constraint cabin_types_unit_names_check check (cardinality(unit_names) <= 20);
