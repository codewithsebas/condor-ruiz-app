-- Acompañantes de la reserva.
--
-- · El titular sigue en las columnas guest_* (nombre, documento, correo y celular obligatorios): de él salen el cliente
--   (client_key), los correos y el WhatsApp.
-- · companions: las demás personas que se hospedan, como lista JSON de
--   { fullName, docType, docNumber, phone, email, city }. Nombre y documento obligatorios (los valida la API); celular,
--   correo y ciudad opcionales (""). Tipos de documento: los del titular y, para menores, TI y RC.
-- · En una reserva con varias cabañas, todas las filas del grupo llevan la misma lista (como el titular).

alter table public.reservations
  add column companions jsonb not null default '[]'::jsonb;

alter table public.reservations
  add constraint reservations_companions_is_array check (jsonb_typeof(companions) = 'array' and jsonb_array_length(companions) <= 40);
