-- El relleno de 20261121060000_autor_de_la_reserva corrió sin disparadores (para no crear versiones ni registros), así
-- que tampoco anotó el cambio para la sincronización: los teléfonos y computadores con datos guardados no traían el autor
-- ni la hora real de las reservas que ya existían. Se anotan aquí y llegan en la siguiente sincronización. Las reservas no
-- cambian; anotar de más no hace daño (el panel vuelve a leer la fila).

insert into public.sync_changes (collection, row_key, op)
select 'reservations', code, 'U'
from public.reservations
where created_by_name is not null;
