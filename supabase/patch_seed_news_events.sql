insert into public.news (title, body, is_public)
values
  ('Bienvenida a Palestra', 'Un espacio comun para mantener conectadas a las comunidades y cuidar la comunicacion interna.', true),
  ('Materiales iniciales disponibles', 'La biblioteca crecera con documentos, oraciones, canciones y recursos para coordinadores.', true),
  ('Convocatoria nacional de comunidades', 'Aviso largo de prueba para validar comunicados nacionales, provinciales y locales dentro de la app.', true)
on conflict do nothing;

insert into public.events (title, description, starts_at, is_public)
values
  ('Palestra prepara su agenda nacional', 'Equipos de distintas provincias comienzan a ordenar encuentros, reuniones y actividades.', '2026-05-18 18:00:00-03', true),
  ('Nuevo espacio de materiales internos', 'La app incorporara recursos para miembros aprobados, coordinadores, asesores y equipo nacional.', '2026-05-22 20:00:00-03', true),
  ('Lanzamiento de prueba', 'Fecha objetivo para presentar una primera version instalable por APK.', '2026-05-28 21:00:00-03', true)
on conflict do nothing;
