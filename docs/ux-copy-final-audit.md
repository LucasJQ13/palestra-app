# Auditoría final de textos visibles pendientes

Issue de referencia: [#101](https://github.com/LucasJQ13/palestra-app/issues/101)

## Alcance y criterio

Esta auditoría revisa el copy visible actual de inicio de sesión, registro, recuperación de contraseña, perfil pendiente, confirmación de correo, Home, Evangelio, Comunidad, Buzón, Consultas, paneles administrativos, estados vacíos y mensajes de error o éxito.

El análisis se realizó sobre el estado actual del código y toma `src/lib/appMessages.ts` como fuente central. También contempla textos que todavía viven directamente en componentes o controladores. En cumplimiento del alcance de la issue, este documento solo audita y propone: no reemplaza textos, no modifica lógica, no toca permisos ni Supabase y no requiere compilar APK.

La voz recomendada mantiene estas reglas:

- voseo rioplatense consistente;
- tono cercano, breve y responsable;
- neutralidad cuando no se conoce la preferencia de trato;
- lenguaje pastoral solo cuando aporta acompañamiento real;
- ninguna referencia técnica para público general;
- precisión directa en permisos, seguridad y acciones destructivas;
- textos compartidos dentro de `APP_MESSAGES` o helpers del mismo módulo.

## Hallazgos priorizados

La columna **Próxima tarea** agrupa los reemplazos sugeridos en lotes futuros. Esos identificadores son referencias de trabajo, no issues creadas por esta auditoría.

| Pantalla | Texto actual | Problema | Texto propuesto | Prioridad | Próxima tarea |
| --- | --- | --- | --- | --- | --- |
| Inicio de sesión (`auth.loginTitle`) | `Bienvenido/a, volvemos a encontrarnos?` | La barra rompe la lectura, infiere un binario innecesario y abre la experiencia con una fórmula genérica. | `Qué alegría encontrarte de nuevo. ¿Iniciamos sesión?` | Alta | `UX-COPY-102` · Aplicar bienvenida neutral. |
| Inicio de sesión (`auth.loginHelp`) | `Que alegria seguir caminando juntos en Palestra.` | Es cálido, pero repite la bienvenida sin indicar la acción siguiente y necesita normalización ortográfica. | `Ingresá para seguir caminando junto a tu comunidad.` | Media | `UX-COPY-102` · Unificar título y ayuda del login. |
| Inicio de sesión desde Perfil (`GuestProfileAuthCard`) | `Ingresa tu correo electronico` | Usa tuteo, no está centralizado y duplica el campo del flujo principal. | `Ingresá tu correo` | Media | `UX-COPY-102` · Reutilizar `auth.emailPlaceholder`. |
| Registro desde Perfil (`GuestProfileAuthCard`) | `Registrate como Palestrista. Tu perfil queda pendiente hasta que un dirigente lo apruebe.` | El foco queda en la espera y la aprobación, no en el acompañamiento. | `Sumate a Palestra. Un dirigente de tu comunidad revisará el perfil para darte la bienvenida.` | Alta | `UX-COPY-102` · Centralizar la introducción al registro. |
| Registro (`auth.wizardNameHelp`) | `Antes de comenzar esta aventura, nos gustaria saber quien sos y conocer un poco mas de vos.` | “Aventura” no coincide con el lenguaje pastoral del resto de la app y la frase es larga para mobile. | `Queremos conocerte un poco más para acompañar tu camino en Palestra.` | Media | `UX-COPY-102` · Acortar ayudas del asistente. |
| Registro (`auth.wizardAboutHelp`) | `Esto nos permitira conocerte mejor y preparar esta aventura para vos.` | Repite la idea anterior y conserva la metáfora de aventura. | `Estos datos nos ayudan a acompañarte y vincularte con tu comunidad.` | Media | `UX-COPY-102` · Eliminar repetición entre pasos. |
| Recuperación de contraseña (`auth.recoveryHelp`) | `Ingresa tu mail y te enviaremos un enlace para crear una nueva contrasena.` | Mezcla tuteo con el voseo general y promete el envío antes de validar la cuenta. | `Ingresá tu mail. Si encontramos tu cuenta, te enviaremos un enlace para crear una nueva contraseña.` | Media | `UX-COPY-102` · Ajustar ayuda sin afectar seguridad. |
| Recuperación de contraseña (`auth.recoveryFailed`) | `No pudimos enviar el enlace ahora. Revisa el mail y volve a intentar en unos minutos.` | La acción es correcta, pero alterna formas verbales y no distingue correo inválido de falla temporal. | `No pudimos enviar el enlace. Revisá el mail y volvé a intentarlo en unos minutos.` | Media | `UX-COPY-102` · Normalizar voseo y mapa de errores. |
| Confirmación de correo (`auth.emailConfirmationSuccessTitle`) | `Correo confirmado` | Es un hito importante expresado como estado técnico. | `¡Tu correo ya está confirmado!` | Alta | `UX-COPY-102` · Aplicar confirmación celebratoria breve. |
| Confirmación de correo (`auth.emailConfirmationSuccessText`) | `Tu correo fue confirmado. Ya podes ingresar a Palestra APP.` | Duplica el título y mantiene tono de sistema. | `Todo listo. Ya podés entrar y encontrarte con tu comunidad en Palestra.` | Alta | `UX-COPY-102` · Complementar el título con próxima acción. |
| Perfil pendiente (`auth.pendingEmailHelp`) | `Revisa tu correo para confirmar tu cuenta. Mientras tanto, esta vista queda disponible para pedir ayuda si la necesitas.` | El contenido es útil, pero “esta vista queda disponible” describe la interfaz desde afuera. | `Revisá tu correo para confirmar la cuenta. Si necesitás ayuda, desde acá podés avisarle a un dirigente.` | Media | `UX-COPY-102` · Hacer explícita la ayuda disponible. |
| Estado de cuenta (`ProfileScreen`) | `Este usuario esta bloqueado o eliminado. Contacta a un administrador.` | Habla de la persona como objeto, mezcla dos estados sensibles y cambia a tuteo. | `No pudimos habilitar tu acceso. Contactá a un administrador para revisar juntos el estado de la cuenta.` | Alta | `UX-COPY-102` · Separar detalle técnico del mensaje público. |
| Home (`home.genericPageEmpty`) | `Esta pagina todavia no tiene contenido cargado.` | “Cargado” expone el proceso administrativo y no invita a volver. | `Esta sección todavía se está preparando. Volvé a visitarla pronto.` | Media | `UX-COPY-103` · Aplicar empty state editorial. |
| Home (`home.motivadorEmptyTitle`) | `No hay PM activos` | La sigla puede ser opaca para personas nuevas y “activos” suena técnico. | `No hay períodos motivadores vigentes` | Media | `UX-COPY-103` · Reemplazar sigla en estados públicos. |
| Evangelio en Home (`home.gospelUnavailable`) | `Todavia no tenemos cargado el Evangelio de hoy. Volve a intentar en unos minutos.` | “Cargado” describe el backend; el resto del mensaje ya orienta bien. | `El Evangelio de hoy todavía no está disponible. Volvé a intentarlo en unos minutos.` | Media | `UX-COPY-103` · Quitar lenguaje de carga. |
| Evangelio en Home (`home.gospelAutoFailed`) | `No pudimos cargar el Evangelio automaticamente. Podes intentar de nuevo en unos minutos.` | Expone el mecanismo automático y repite “intentar” con una construcción larga. | `No pudimos preparar el Evangelio de hoy. Volvé a intentarlo en unos minutos.` | Media | `UX-COPY-103` · Reservar diagnóstico automático para admin. |
| Notificación diaria del Evangelio (`dailyGospelNotifications.ts`) | `Hey Recordá leer el evangelio de hoy!` | Es abrupto, tiene puntuación inconsistente, no coincide con la voz fraterna y presenta evidencia de encoding defectuoso en el archivo. | `El Evangelio de hoy ya está listo para acompañarte.` | Alta | `UX-COPY-103` · Corregir copy y encoding de la notificación. |
| Comunidad (`community.leadersTitle`) | `Encargados y acompanamiento` | “Encargados” suena administrativo y no nombra a las personas que sirven. | `Referentes que acompañan` | Media | `UX-COPY-104` · Renombrar bloque de referentes. |
| Comunidad (`community.leadersEmpty`) | `Todavia no hay encargados cargados para esta comunidad.` | Reduce a las personas a registros y expone la carga de datos. | `Todavía no se publicaron los referentes que acompañan a esta comunidad.` | Media | `UX-COPY-104` · Aplicar empty state humano. |
| Comunidad (`community.membersEmpty`) | `Todavia no hay miembros cargados.` | Habla de personas como datos cargados. | `Todavía no hay personas vinculadas a esta comunidad.` | Media | `UX-COPY-104` · Alinear con `membersCount`. |
| Comunidades cercanas (`community.findNearestHelp`) | `Usa tu ubicacion actual para encontrar comunidades cargadas dentro de 5 km.` | Cambia a tuteo y “cargadas” describe disponibilidad técnica. | `Usá tu ubicación para encontrar comunidades disponibles dentro de 5 km.` | Media | `UX-COPY-104` · Normalizar ayuda de ubicación. |
| Secretariado (`community.secretariatEmpty`) | `Todavia no hay integrantes cargados para este secretariado.` | Estado administrativo sin alternativa para quien necesita contacto. | `Todavía no hay referentes publicados para este Secretariado. Podés usar Contacto si necesitás orientación.` | Media | `UX-COPY-104` · Agregar salida útil al vacío. |
| Buzón (`communications.mailbox.empty`) | `Todavia no hay conversaciones en esta bandeja. Cuando llegue un mensaje, lo vas a encontrar aca.` | Es claro, pero “en esta bandeja” conserva lenguaje de sistema y puede acortarse. | `Todavía no hay conversaciones. Cuando alguien te escriba, van a aparecer acá.` | Baja | `UX-COPY-105` · Simplificar el estado vacío. |
| Buzón (`communications.mailbox.draftSaved`) | `Borrador guardado en este dispositivo.` | Confirma el guardado, pero no aclara que el mensaje todavía no fue enviado. | `Guardamos el borrador en este dispositivo. Todavía no fue enviado.` | Media | `UX-COPY-105` · Aclarar estado del borrador. |
| Buzón (`useMailboxController`) | `Mensaje marcado como leido.` | Sigue fuera del sistema central, carece de tilde y suena como evento interno. | `Listo. El mensaje quedó marcado como leído.` | Baja | `UX-COPY-105` · Centralizar estados de mensajes. |
| Reporte de mensaje (`MailboxPanel`) | `Usuario reportado: {nombre}` | No coincide con el lenguaje de “persona” aplicado al selector y puede sonar despersonalizado. | `Persona reportada: {nombre}` | Media | `UX-COPY-105` · Unificar vocabulario del reporte. |
| Consultas (`communications.publicQueries.help`) | `Aca acompanamos las consultas publicas e institucionales, separadas de las conversaciones privadas.` | El concepto es correcto, pero requiere normalización ortográfica y puede ser más breve en mobile. | `Acá acompañamos las consultas públicas e institucionales, separadas de tus conversaciones privadas.` | Baja | `UX-COPY-105` · Normalizar acentos y posesivo. |
| Consultas (`communications.publicQueries.statusChanged`) | `Consulta actualizada: ${status}.` | Expone una transición genérica y produce frases menos naturales según el estado. | Usar variantes: `Consulta archivada.` y `La consulta volvió a recibidas.` | Media | `UX-COPY-105` · Crear mensajes por acción. |
| Administración de usuarios (`adminPanels.users.created`) | `Usuario creado y habilitado. Debera completar provincia y comunidad al ingresar.` | Trata a la persona como objeto y la segunda frase suena a requisito del sistema. | `Cuenta creada y habilitada. La persona completará su provincia y comunidad al ingresar.` | Media | `UX-COPY-106` · Humanizar confirmaciones administrativas. |
| Administración de usuarios (`adminPanels.users.approved`) | `Usuario aprobado.` | Es demasiado frío para una decisión que habilita el ingreso. | `Perfil aprobado. La persona ya puede ingresar a Palestra.` | Alta | `UX-COPY-106` · Aplicar confirmación con impacto. |
| Configuración general (`adminPanels.settings.help`) | `Base para mantenimiento, aviso global, permisos, modulos activos, foro y chat.` | Es una enumeración técnica sin explicar qué puede hacer el administrador. | `Administrá el mantenimiento, los avisos globales y los módulos disponibles en la app.` | Media | `UX-COPY-106` · Reescribir ayuda del panel. |
| Contenido publicado (`adminPanels.content.help`) | `Inventario central para distinguir contenido real y contenido base usado para que la app no quede vacia.` | “Real”, “base” y “para que no quede vacía” describen implementación, no una tarea. | `Revisá qué contenido está publicado y qué contenido de respaldo muestra cada sección.` | Media | `UX-COPY-106` · Traducir conceptos internos a tarea. |
| Credencial QR (`adminPanels.qr.credentialFailed`) | `No pudimos generar la credencial QR. Ejecuta el patch SQL de credenciales si falta.` | Puede exponer SQL fuera de un diagnóstico administrativo y cambia a tuteo. | Público: `No pudimos generar la credencial. Pedí ayuda a un administrador.` Diagnóstico admin: `Revisá la migración de credenciales QR.` | Alta | `UX-COPY-106` · Separar mensaje público y diagnóstico. |
| Cargas administrativas (`ProfileScreen`) | `No pude subir la foto.` / `No pude subir el logo de la provincia.` | La app habla en primera persona singular y mantiene errores equivalentes dispersos. | `No pudimos subir la imagen. Revisá la conexión e intentá nuevamente.` | Alta | `UX-COPY-106` · Centralizar errores de carga por contexto. |
| Permisos administrativos (`ProfileScreen`) | `Solo el administrador puede guardar configuracion remota.` | Es correcto, pero suena punitivo y “remota” no aporta a la decisión. | `Esta acción está reservada para administradores.` | Media | `UX-COPY-106` · Unificar advertencias de permisos. |
| Estado vacío de perfil (`emptyStateMessage`) | `Todavia no hay datos cargados en este perfil.` | “Datos cargados” es lenguaje de base de datos. | `Este perfil todavía no tiene información disponible.` | Media | `UX-COPY-107` · Revisar diccionario de estados vacíos. |
| Estado vacío de autenticación (`emptyStateMessage`) | `No encontramos datos para mostrar en este momento.` | Es tan genérico que no ayuda a entender si falta iniciar sesión, esperar o reintentar. | `No pudimos preparar esta información. Volvé a intentarlo en unos minutos.` | Alta | `UX-COPY-107` · Definir empty/error según contexto real. |
| Estado vacío administrativo (`emptyStateMessage`) | `No hay datos administrativos para revisar por ahora.` | No distingue entre ausencia legítima, filtros sin resultados y falta de permisos. | `No hay elementos para revisar con los filtros actuales.` | Media | `UX-COPY-107` · Separar vacío, filtro y acceso. |
| Error global (`supabaseConnectionError`) | `No pudimos conectar con Supabase. Revisa la conexion e intenta nuevamente.` | Expone infraestructura a cualquier persona y mezcla voseo con tuteo. | Público: `No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.` Detalle técnico solo en diagnóstico. | Alta | `UX-COPY-107` · Crear versión pública y administrativa. |
| Error global (`saveFailed`) | `No pudimos guardar los cambios.` | No ofrece una próxima acción y puede representar causas muy distintas. | `No pudimos guardar los cambios. Revisá la conexión y volvé a intentarlo.` | Media | `UX-COPY-107` · Añadir acción segura por defecto. |
| Error global (`operationFailed`) | `No pudimos completar la accion. Revisa los datos e intenta nuevamente.` | Sigue siendo genérico, mezcla conjugaciones y se usa como fallback para dominios distintos. | `Algo no salió como esperábamos. Revisá los datos y volvé a intentarlo.` | Alta | `UX-COPY-107` · Mapear errores por autenticación, red, permisos y datos. |
| Éxitos globales (`messageSent*`, `responseSent`) | `Mensaje enviado.` / `Mensaje enviado correctamente.` / `Respuesta enviada.` | Hay variantes duplicadas que dificultan mantener un tono consistente. | Conservar dos claves: `Tu mensaje fue enviado.` y `Tu respuesta fue enviada.` | Media | `UX-COPY-107` · Eliminar duplicados y migrar consumidores. |

## Copy revisado que conviene conservar

Estas zonas ya cumplen el tono buscado y no necesitan otra reescritura inmediata:

- `home.privateNotice`: explica la aprobación como una forma de cuidar el espacio.
- `community.noticesEmpty`: anticipa dónde aparecerán futuras novedades.
- `community.nameAndContactRequired`, `secretariatSent` y `contactSent`: son cercanos, breves y accionables.
- `communications.mailbox.help`, `destinationLabel`, `noUserResults` y `estimatedRecipients`: la mejora de la Issue #98 resolvió los términos más fríos del compositor.
- `communications.publicQueries.empty`, `responseRequired` y `responseSaved`: describen estado y próxima acción con claridad.
- `blockedProfileMessage(..., 'pastoral')`: acompaña sin acusar ni prometer tiempos.
- `reportSentForReview`: confirma la acción y agradece el cuidado comunitario.

## Orden recomendado de implementación

1. `UX-COPY-102`: autenticación, registro, recuperación, confirmación y estados de cuenta.
2. `UX-COPY-103`: Home, Evangelio y notificación diaria, incluyendo corrección de encoding.
3. `UX-COPY-104`: referentes, miembros, ubicación y Secretariados de Comunidad.
4. `UX-COPY-105`: remanentes de Buzón y Consultas posteriores a la Issue #98.
5. `UX-COPY-106`: paneles administrativos, permisos y errores de carga.
6. `UX-COPY-107`: estados vacíos, fallbacks de error y confirmaciones globales.

Cada lote debería reemplazar strings dispersos por claves de `APP_MESSAGES`, conservar los detalles técnicos únicamente para administración y ejecutar `npm run typecheck`. La corrección ortográfica y de encoding debe hacerse junto con cada reemplazo para evitar una migración masiva sin contexto.

## Confirmación de alcance

- Solo se creó este documento de auditoría.
- No se reemplazó ningún texto visible de la aplicación.
- No se modificó lógica funcional, permisos ni Supabase.
- No se compiló APK.
