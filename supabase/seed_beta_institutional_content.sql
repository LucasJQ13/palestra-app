-- Seeds institucionales para Beta.
-- No sobrescribe contenido existente: solo completa filas iniciales si faltan.

insert into public.app_tabs (key, label, is_visible, sort_order, visible_roles)
values
  ('inicio', 'Inicio', true, 10, null),
  ('notilestra', 'Notilestra', true, 20, null),
  ('materiales', 'Materiales', true, 30, null),
  ('comunidades', 'Comunidades', true, 40, null),
  ('historia', 'Nuestra Historia', true, 50, null),
  ('contacto', 'Contacto', true, 60, null),
  ('periodo_motivador', 'PM', true, 70, array[
    'sedimentador',
    'animador_comunidad',
    'coordinador_comunidad',
    'vocal',
    'asesor',
    'coordinador_diocesano',
    'vocal_nacional',
    'coordinador_nacional',
    'administrador'
  ]),
  ('oraciones', 'Oraciones', true, 80, null),
  ('cancionero', 'Cancionero', true, 90, null),
  ('himno', 'Himno', true, 100, null),
  ('perfil', 'Perfil', true, 110, null)
on conflict (key) do nothing;

insert into public.app_content (tab_key, title, body, blocks, updated_at)
values
  (
    'historia',
    'Nuestra Historia',
    'Palestra es una comunidad viva que camina con memoria, servicio y encuentro.',
    jsonb_build_array(
      jsonb_build_object('id', 'historia-titulo', 'type', 'titulo', 'value', 'Nuestra Historia'),
      jsonb_build_object('id', 'historia-texto-1', 'type', 'texto', 'value', 'Palestra crece desde la vida comunitaria, el encuentro personal y el compromiso de cada provincia. Esta pagina debe conservar la memoria del movimiento y ayudar a que nuevos palestristas comprendan de donde venimos.'),
      jsonb_build_object('id', 'historia-texto-2', 'type', 'texto', 'value', 'El contenido definitivo puede ser editado desde el panel administrativo por Coordinador Nacional o Administrador.')
    ),
    now()
  ),
  (
    'contacto',
    'Contacto',
    'Canales oficiales para encontrar una comunidad, pedir informacion o acercarse al movimiento.',
    jsonb_build_array(
      jsonb_build_object('id', 'contacto-titulo', 'type', 'titulo', 'value', 'Contacto'),
      jsonb_build_object('id', 'contacto-texto-1', 'type', 'texto', 'value', 'Usa esta pagina para publicar los canales oficiales de Palestra, datos de referencia y orientacion para quienes quieran acercarse a una comunidad.'),
      jsonb_build_object('id', 'contacto-texto-2', 'type', 'texto', 'value', 'Los datos finos de mail, telefono e Instagram se administran desde la configuracion global.')
    ),
    now()
  ),
  (
    'oraciones',
    'Oraciones',
    'Oraciones compartidas por la dirigencia para acompanar encuentros, comunidades y retiros.',
    jsonb_build_array(
      jsonb_build_object('id', 'oraciones-titulo', 'type', 'titulo', 'value', 'Oraciones'),
      jsonb_build_object('id', 'oraciones-texto-1', 'type', 'texto', 'value', 'Este espacio queda preparado para publicar oraciones oficiales visibles para todo publico.'),
      jsonb_build_object('id', 'oraciones-texto-2', 'type', 'texto', 'value', 'Los rangos Vocal Diocesano y superiores pueden gestionar este contenido segun permisos.')
    ),
    now()
  ),
  (
    'cancionero',
    'Cancionero',
    'Canciones para encuentros, celebraciones, comunidades y PM.',
    jsonb_build_array(
      jsonb_build_object('id', 'cancionero-titulo', 'type', 'titulo', 'value', 'Cancionero'),
      jsonb_build_object('id', 'cancionero-texto-1', 'type', 'texto', 'value', 'Este espacio queda preparado para publicar canciones y recursos comunitarios visibles para todo publico.'),
      jsonb_build_object('id', 'cancionero-texto-2', 'type', 'texto', 'value', 'El contenido definitivo puede organizarse por bloques para mejorar lectura y mantenimiento.')
    ),
    now()
  ),
  (
    'himno',
    'Himno Palestrista',
    'Himno oficial de Palestra.',
    jsonb_build_array(
      jsonb_build_object('id', 'himno-titulo', 'type', 'titulo', 'value', 'Himno Palestrista'),
      jsonb_build_object('id', 'himno-texto-1', 'type', 'texto', 'value', 'Aqui se cargara el himno oficial de Palestra.'),
      jsonb_build_object('id', 'himno-texto-2', 'type', 'texto', 'value', 'Separar las estrofas en bloques de texto ayuda a que se lea correctamente desde el celular.')
    ),
    now()
  ),
  (
    'periodo_motivador',
    'PM',
    'Agenda y registro de PM cargados desde Supabase.',
    jsonb_build_array(
      jsonb_build_object('id', 'pm-titulo', 'type', 'titulo', 'value', 'PM'),
      jsonb_build_object('id', 'pm-texto-1', 'type', 'texto', 'value', 'Esta seccion muestra fechas de PM cargadas desde Supabase y vinculadas al calendario de Notilestra.')
    ),
    now()
  )
on conflict (tab_key) do nothing;
