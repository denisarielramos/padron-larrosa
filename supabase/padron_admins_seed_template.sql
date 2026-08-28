-- Plantilla para autorizar un administrador de padron-larrosa.
-- NO es una migracion (no vive en supabase/migrations, no se corre sola).
--
-- Pasos:
--   1) Crear el usuario en Supabase Auth: Authentication > Users > Add user
--      (con el email/contrasena que va a usar para entrar a /admin).
--   2) Copiar su UUID desde esa misma pantalla.
--   3) Reemplazar el placeholder de abajo y correr el INSERT en el SQL Editor.

insert into public.padron_admins (user_id)
values ('REEMPLAZAR-CON-EL-UUID-DEL-USUARIO');

-- Para confirmar que quedo cargado:
-- select * from public.padron_admins;
