# Auditoría de tono y microcopy fraterno

Issue de referencia: [#88](https://github.com/LucasJQ13/palestra-app/issues/88)

## Objetivo y alcance

Este documento audita textos visibles de Palestra APP y propone una voz más fraterna, cercana y pastoral sin cambiar todavía el código. La revisión abarca autenticación, estados de cuenta, inicio, comunidad, mensajería, consultas, notificaciones, contenido, administración, QR y mantenimiento.

La búsqueda se realizó sobre 55 archivos de interfaz. Como señales de riesgo se detectaron:

- 15 archivos de pantalla que pueden mostrar `error.message` sin traducción.
- 66 menciones de infraestructura como Supabase, Storage, APK, Runtime o ProjectId.
- 52 candidatos a estados vacíos con fórmulas como “No hay”, “No existen” o “pendiente de carga”.

Estas cantidades son una línea de base para la implementación posterior; no significan que cada aparición deba reemplazarse.

## Voz propuesta

- Usar voseo rioplatense de forma consistente: “revisá”, “elegí”, “escribí”, “podés”.
- Hablar desde una comunidad: “te acompañamos”, “tu comunidad”, “sigamos”, evitando que cada mensaje se convierta en una frase religiosa.
- Reservar “hermano/hermana” para bienvenida, aprobación, acompañamiento y oración. Repetirlo en cada botón o validación restaría naturalidad.
- Mantener mensajes breves y accionables: qué pasó, qué puede hacer la persona y, solo si aporta, a quién acudir.
- No exponer nombres de infraestructura al público. Los detalles técnicos deben quedar en logs o herramientas exclusivas de administración.
- Evitar barras como “Bienvenido/a”. Si no hay narrativa configurada, preferir una forma neutral: “Te damos la bienvenida”.
- Mantener exactitud en seguridad, permisos, límites de archivo, QR y acciones destructivas.

## Infraestructura existente que conviene reutilizar

- `src/lib/profileDisplay.ts:15` ya define `genderNarratives` para hermano/hermana.
- `src/lib/profileDisplay.ts:37` adapta nombres de roles con `roleLabel(role, gender)`.
- `src/lib/profileDisplay.ts:117` genera un saludo de inicio con `homeGreeting`.
- `src/lib/appMessages.ts:3` centraliza una parte de los mensajes, pero todavía mezcla copy público, lenguaje técnico y tildes inconsistentes.
- La preferencia `genderPreference` ya llega a Home, Perfil, credencial y registro. No hace falta cambiar el modelo de datos.

Antes de aplicar los reemplazos se recomienda agregar helpers de presentación, por ejemplo `fraternalTreatment(session)`, `welcomeCopy(session)` y un traductor de errores externos. Cuando no haya preferencia, el fallback debe ser neutral y no inferir género.

## Auditoría priorizada

Prioridades:

- **Alta**: bienvenida, aprobación, bloqueo, acceso, errores críticos y mensajes que exponen infraestructura.
- **Media**: estados vacíos, confirmaciones, ayudas y acompañamiento de tareas.
- **Baja**: etiquetas internas o textos administrativos que ya son suficientemente claros.

La columna “Narrativa” indica dónde debe intervenir la preferencia de trato.

### Autenticación, registro y estados de cuenta

| Ubicación | Texto actual | Problema | Propuesta fraterna | Narrativa | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Login (`AuthFlow.tsx:177`) | “Bienvenido/a, ¿iniciamos sesión?” | Usa barra y no aprovecha la preferencia, que aún no está disponible antes del login. | “Qué alegría encontrarte de nuevo. ¿Iniciamos sesión?” | Neutral | Media |
| Login (`AuthFlow.tsx:135`) | “Iniciando sesión...” | Correcto pero mecánico. | “Preparando tu espacio...” | No | Baja |
| Recuperación (`AuthFlow.tsx:161`) | “Si el correo está registrado, recibirás instrucciones...” | Cambio de voseo a tuteo y tono impersonal. | “Si ese correo está registrado, te vamos a enviar los pasos para recuperar tu contraseña.” | No | Media |
| Confirmación (`AuthFlow.tsx:236`) | “Mail confirmado” | Frío para un hito de ingreso. | “¡Tu correo ya está confirmado!” | No | Alta |
| Confirmación (`AuthFlow.tsx:237`) | “Tu correo fue confirmado correctamente. Ya podés ingresar...” | Funcional, con tono de sistema. | “Todo listo. Ya podés entrar y encontrarte con tu comunidad en Palestra.” | No | Alta |
| Perfil pendiente (`AuthFlow.tsx:266`) | “Perfil pendiente” | Etiqueta administrativa sin acompañamiento. | “Tu perfil está en camino” | No | Alta |
| Perfil pendiente (`PendingEmailProfile.tsx:36`) | “Revisá tu correo... solo está disponible esta vista limitada.” | Enfatiza la restricción. | “Revisá tu correo para confirmar la cuenta. Mientras tanto, cuidamos tus datos y te mostramos solo esta información.” | No | Alta |
| Ayuda de confirmación (`AuthFlow.tsx:281`) | “En caso de no poder confirmar el mail, contactar con un dirigente” | Largo, impersonal y no parece una acción. | “Necesito ayuda para confirmar mi correo” | No | Media |
| Cuenta bloqueada (`AuthFlow.tsx:52`) | “Este usuario está bloqueado. Contactá a un dirigente.” | Habla de “este usuario”, no de la persona; no explica que puede pedir ayuda. | “Tu acceso está pausado. Contactá a un dirigente para que podamos acompañarte.” | Sí: hermano/hermana opcional | Alta |
| Cuenta bloqueada (`ProfileScreen.tsx:1883`) | “Este usuario está bloqueado o eliminado. Contactá a un administrador.” | Mezcla dos estados sensibles y suena definitivo. | “No pudimos habilitar tu acceso. Contactá a un administrador para revisar juntos el estado de tu cuenta.” | Sí: trato opcional | Alta |
| Estado (`appMessages.ts:23`) | “Aprobado / Bloqueado / Pendiente de aprobación” | Adecuado como chip, insuficiente como mensaje principal. | Conservar en chips; acompañar con “Tu perfil ya fue aprobado. ¡Te damos la bienvenida a Palestra!” o el mensaje de ayuda correspondiente. | Sí en mensaje, no en chip | Alta |
| Aprobación administrativa (`ProfileScreen.tsx:2293`) | “Cambio realizado. Usuario aprobado.” | Frío y centrado en el objeto. | “Perfil aprobado. Ya puede ingresar y participar en Palestra.” | Usar nombre; género si está disponible | Alta |
| Registro (`AuthFlow.tsx:399`) | “Creando tu registro...” | Correcto, pero puede acompañar mejor. | “Estamos preparando tu lugar en Palestra...” | No | Media |
| Registro (`AuthFlow.tsx:478`) | “Acerca de ti” / “preparar esta aventura para ti” | Tuteo inconsistente con el voseo general. | “Queremos conocerte un poco más” / “Así podemos acompañar mejor tu camino en Palestra.” | No | Media |
| Invitado (`GuestProfileAuthCard.tsx:84`) | “Perfil Invitado” | Etiqueta fría. | “Estás visitando Palestra” | No | Media |
| Invitado (`GuestProfileAuthCard.tsx:97`) | “Tu perfil queda pendiente hasta que un dirigente lo apruebe.” | Correcto, pero el foco está en la espera. | “Registrate como palestrista. Un dirigente de tu comunidad revisará el perfil para darte la bienvenida.” | No | Media |
| Error genérico (`appMessages.ts:131`) | “No pudimos completar la acción...” | Seguro, pero demasiado genérico para todos los casos. | “Algo no salió como esperábamos. Revisá los datos e intentá nuevamente; si continúa, pedí ayuda a un dirigente.” | No | Alta |

### Inicio y comunidad

| Ubicación | Texto actual | Problema | Propuesta fraterna | Narrativa | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Home (`HomeScreen.tsx:325`) | “No hay evangelio cargado todavía.” | Estado vacío sin invitación. | “El Evangelio de hoy todavía no está disponible. Volvé a intentarlo en unos minutos.” | No | Media |
| Agenda Home (`HomeScreen.tsx:377`) | “No hay fechas comunitarias cargadas en Supabase.” | Expone infraestructura. | “Todavía no hay próximas fechas comunitarias. Cuando se publique una, va a aparecer acá.” | No | Alta |
| Acceso Home (`HomeScreen.tsx:440`) | “Algunas secciones requieren registro y aprobación...” | Correcto, pero institucional. | “Para cuidar la vida de la comunidad, algunas secciones se habilitan después del registro y la aprobación de un coordinador.” | No | Media |
| Ubicación (`CommunitiesScreen.tsx:95`) | “No pude acceder a tu ubicación. Activá el permiso...” | Primera persona de la app y poco contexto. | “Necesitamos permiso de ubicación para buscar comunidades cercanas. Podés habilitarlo desde los ajustes.” | No | Alta |
| Comunidad cercana (`CommunitiesScreen.tsx:542`) | “No hemos encontrado una comunidad cerca de ti...” | Tuteo y distancia emocional. | “No encontramos una comunidad dentro de 5 km. Podés explorar las provincias o ampliar la búsqueda en Maps.” | No | Media |
| Secretariado (`CommunitiesScreen.tsx:225`) | “No hay integrantes cargados por ahora.” | Vacío sin explicar alternativa. | “Todavía no hay referentes publicados para esta provincia. Podés usar Contacto si necesitás orientación.” | No | Media |
| Subsecciones (`CommunitiesScreen.tsx:454`) | “No hay subsecciones habilitadas...” | Técnico y sin salida. | “Esta provincia todavía está preparando sus espacios. Mientras tanto, podés conocer sus comunidades.” | No | Media |
| Consulta enviada (`CommunitiesScreen.tsx:216`) | “Cambio realizado. Consulta enviada al Secretariado.” | Prefijo administrativo innecesario. | “Tu consulta llegó al Secretariado. Gracias por escribirnos.” | No | Media |
| Mensaje comunitario (`CommunitiesScreen.tsx:315`) | “Cambio realizado. Consulta enviada a la bandeja...” | Expone el destino técnico. | “Tu mensaje llegó a los responsables de la comunidad.” | No | Media |
| Referentes (`CommunityLeaders.tsx:51`) | “No hay encargados cargados por el momento.” | “Encargados” y “cargados” suenan administrativos. | “Todavía no se publicaron los referentes que acompañan a esta comunidad.” | No | Media |
| Avisos (`CommunityNoticesPreview.tsx:60`) | “No hay avisos para tu comunidad actualmente.” | Vacío plano. | “Tu comunidad no tiene avisos nuevos. Cuando haya algo para compartir, lo vas a encontrar acá.” | No | Media |
| Miembros (`CommunityMembersManager.tsx:21`) | “No hay miembros cargados.” | Reduce personas a registros. | “Todavía no hay personas vinculadas a esta comunidad.” | No | Media |
| Panel (`CommunityAdminPanel.tsx:120`) | “Tu rango no tiene comunidades editables.” | Puede sonar punitivo. | “Tu servicio actual no incluye la edición de comunidades.” | Rol, no género | Media |

### Buzón, consultas, avisos y notificaciones

| Ubicación | Texto actual | Problema | Propuesta fraterna | Narrativa | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Buzón (`MailboxPanel.tsx:296`) | “Conversaciones privadas entre usuarios registrados.” | Técnico y distante. | “Un espacio cuidado para conversar con otros miembros de Palestra.” | No | Media |
| Buzón vacío (`MailboxPanel.tsx:537`) | “No tienes mensajes actualmente” | Tuteo inconsistente y sin invitación. | “Todavía no tenés mensajes. Cuando alguien te escriba, la conversación va a aparecer acá.” | No | Media |
| Destinatarios (`useMailboxController.ts:336`) | “No hay responsables asignados...” | Correcto, pero sin alternativa. | “Tu comunidad todavía no tiene responsables disponibles para recibir el mensaje. Podés contactar al Secretariado de tu provincia.” | No | Alta |
| Mensaje enviado (`appMessages.ts:6-9`) | Variantes “Mensaje enviado”, “Mensaje enviado correctamente”, “Respuesta enviada.” | Duplicación y tono inconsistente. | Unificar: “Tu mensaje fue enviado.” y “Tu respuesta fue enviada.” | No | Media |
| Borrador (`useMailboxController.ts:388`) | “Cambio realizado. Borrador guardado en este dispositivo.” | Prefijo frío. | “Guardamos el borrador en este dispositivo para que puedas seguir después.” | No | Media |
| Consulta vacía (`PublicQueriesInboxScreen.tsx:113`) | “No hay consultas en esta bandeja” | Correcto para operación interna, pero puede ser más amable. | “No hay consultas pendientes en esta bandeja.” | No | Baja |
| Respuesta (`PublicQueriesInboxScreen.tsx:152`) | “Registra aquí la respuesta o seguimiento realizado” | Imperativo formal inconsistente. | “Anotá la respuesta o el seguimiento realizado” | No | Baja |
| Notificaciones (`ProfileSettingsPanel.tsx:77`) | “Estado actual: {status}. Activa este dispositivo...” | Muestra valores técnicos sin traducir y cambia a tuteo. | “Avisos en este dispositivo: {estado traducido}. Activá esta opción para recibir novedades importantes.” | No | Alta |
| Permiso denegado (`notificationHelpers.ts:84`) | “Permiso de notificaciones no habilitado.” | No indica cómo resolverlo. | “Las notificaciones están desactivadas. Podés habilitarlas desde los ajustes del dispositivo.” | No | Alta |
| Push remoto (`notificationHelpers.ts:37`) | “No se pudo inicializar push remoto... Firebase/FCM.” | Expone infraestructura al usuario. | Público: “No pudimos activar los avisos en este dispositivo.” Diagnóstico técnico solo para administrador. | No | Alta |
| Evangelio diario (`dailyGospelNotifications.ts:12`) | “Hey Recordá leer el evangelio de hoy!” | Puntuación abrupta y mezcla informal poco natural. | “Buen día. El Evangelio de hoy ya está listo para acompañarte.” | No | Media |
| Aviso comunitario (`notificationHelpers.ts:57`) | “Aviso comunitario · {comunidad}” | Claro y breve. | Conservar. El cuerpo del aviso debe aportar el tono, no el título del sistema. | No | Baja |

### Materiales, noticias, formación y otros contenidos

| Ubicación | Texto actual | Problema | Propuesta fraterna | Narrativa | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Materiales (`MaterialsScreen.tsx:523`) | “No existen archivos actualmente” | Frío y poco natural. | “Todavía no hay materiales disponibles para tu perfil.” | No | Media |
| Documentos (`MaterialsScreen.tsx:517`) | “Todavía no hay documentos de la Iglesia cargados.” | “Cargados” revela la administración. | “Todavía no hay documentos de la Iglesia disponibles.” | No | Media |
| Material restringido (`MaterialsScreen.tsx:570`) | “Material restringido por rango o permiso.” | Correcto, pero puede sentirse punitivo. | “Este material está reservado para otros servicios o responsabilidades dentro del Movimiento.” | Rol, no género | Media |
| Descarga fallida (`MaterialsScreen.tsx:181`) | “Puede que ya no exista en Storage.” | Expone infraestructura. | “No pudimos descargar el archivo. Puede que haya sido movido; intentá nuevamente más tarde.” | No | Alta |
| Biblioteca (`LibrarySectionScreen.tsx:224`) | “Cuando se cargue contenido en Supabase...” | Expone backend y APK. | “Cuando se publique nuevo contenido, va a aparecer acá automáticamente.” | No | Alta |
| Biblioteca (`LibrarySectionScreen.tsx:114`) | “cuenta real de Supabase... acceso de prueba interno...” | Diagnóstico mezclado con UX. | “Para publicar necesitás ingresar con una cuenta habilitada. El modo de prueba no guarda cambios.” | No | Alta |
| Camino formativo (`FormationPathScreen.tsx:103`) | “Todavía no hay estaciones visibles.” | Correcto pero sin calidez. | “El camino formativo todavía se está preparando.” | No | Media |
| Camino formativo (`FormationPathScreen.tsx:104`) | “Cuando se carguen desde el Panel Dirigencial...” | Expone proceso interno. | “Cuando haya nuevas estaciones, las vas a encontrar acá.” | No | Media |
| PM (`MotivadorScreen.tsx:50`) | “No hay PM activos” | Técnico para quien no conoce el estado interno. | “No hay períodos motivadores vigentes en este momento.” | No | Media |
| PM (`MotivadorScreen.tsx:51`) | “PM reales y activos en Supabase...” | Expone backend y contrapone contenido “real”. | “Cuando comience un nuevo período motivador, va a aparecer acá.” | No | Alta |
| Agenda (`NotilestraScreen.tsx:241`) | “Recordatorio guardado y notificación programada.” | Correcto, algo mecánico. | “Listo: guardamos el recordatorio y te avisaremos a tiempo.” | No | Media |
| Favoritos (`NotilestraScreen.tsx:480`) | “Todavía no marcaste favoritos.” | Correcto, sin próxima acción. | “Todavía no guardaste favoritos. Tocá el corazón de una noticia o fecha para encontrarla acá.” | No | Media |
| Foro (`ForumScreen.tsx:240`) | “Todavía no hay respuestas.” | Vacío plano. | “Todavía nadie respondió. Podés ser quien abra la conversación.” | No | Media |
| Sección dinámica (`DynamicNavigationSectionScreen.tsx:61`) | “No hay enlaces cargados.” | Lenguaje administrativo. | “Todavía no hay enlaces disponibles en esta sección.” | No | Media |
| Página vacía (`StaticScreens.tsx:135`) | “No hay contenido publicado en Supabase...” | Backend visible al público. | “Esta sección todavía se está preparando. Volvé a visitarla pronto.” | No | Alta |

### Intenciones, QR, administración y mantenimiento

| Ubicación | Texto actual | Problema | Propuesta fraterna | Narrativa | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Intenciones (`IntentionsScreen.tsx:275`) | “Iniciá sesión” | Correcto, pero el contexto puede acompañar. | “Sumate a la oración” | No | Media |
| Intenciones (`IntentionsScreen.tsx:276`) | “Necesitás estar registrado para crear o rezar...” | Suena a restricción. | “Ingresá con tu cuenta para compartir una intención o acompañar la oración de otra persona.” | No | Media |
| Intención creada (`IntentionsScreen.tsx:98`) | “Cambio realizado. Intención creada...” | Prefijo administrativo. | “Tu intención ya fue compartida. La comunidad puede empezar a rezar por ella.” | Sí: trato opcional | Alta |
| Sin intenciones (`IntentionsScreen.tsx:204`) | “No hay intenciones disponibles de otros usuarios...” | Trata la oración como disponibilidad de registros. | “Por ahora no hay nuevas intenciones para acompañar. Gracias por estar dispuesto/a a rezar.” | Sí; evitar barra en implementación | Media |
| Oración finalizada (`IntentionsScreen.tsx:325`) | “Gracias por rezar” | Ya es cálido y adecuado. | Conservar. Puede personalizarse solo si el diseño lo pide. | No | Baja |
| QR (`ProfileScreen.tsx:1365`) | “Generando credencial verificable...” | Técnico, pero necesario. | “Estamos preparando tu credencial QR...” | No | Media |
| QR (`ProfileScreen.tsx:1368`) | “Ejecutá el patch SQL de credenciales en Supabase.” | Instrucción técnica expuesta a cualquier usuario. | Público: “No pudimos generar tu credencial. Pedí ayuda a un administrador.” Detalle SQL solo en diagnóstico. | No | Alta |
| QR (`ProfileScreen.tsx:1378`) | “Credencial verificable activa.” | Correcto, frío. | “Tu credencial QR está lista.” | No | Media |
| QR inválido (`ProfileScreen.tsx:1405`) | “Credencial no válida” | Debe seguir siendo inequívoco. | Conservar como título; agregar “Revisá que sea la credencial vigente o generá una nueva.” | No | Alta |
| Lista QR (`ProfileScreen.tsx:1498`) | “Cambio realizado. Lista QR creada.” | Prefijo administrativo. | “Lista QR creada. Ya podés preparar la asistencia.” | No | Media |
| Resumen dirigencial (`AdminOverviewPanel.tsx:67`) | “No hay usuarios cargados para visualizar.” | Habla de personas como datos. | “Todavía no hay perfiles disponibles para este resumen.” | No | Media |
| Moderación (`MessageModerationAdminPanel.tsx:96`) | “Sin casos pendientes” | Claro y adecuado para operación interna. | Conservar. El texto secundario puede ser “No hay reportes que requieran tu revisión.” | No | Baja |
| Contenido publicado (`PublishedContentAdminPanel.tsx:40`) | “contenido real de Supabase y contenido base/fallback...” | Es técnico, pero la audiencia es administradora. | Conservar concepto; simplificar: “Inventario de contenido publicado y contenido base de respaldo.” | No | Baja |
| Configuración (`ProfileSettingsPanel.tsx:63`) | “Modo dark” | Anglicismo innecesario. | “Modo oscuro” | No | Media |
| Acceso administrativo (`FormationPathAdminPanel.tsx:220`) | “Disponible solo para Administrador.” | Claro, pero puede explicar el límite. | “Esta herramienta está reservada para administración.” | Rol, no género | Baja |
| Mantenimiento (`StaticScreens.tsx:105`) | “Estamos realizando tareas de mantenimiento...” | Correcto, pero distante. | “Estamos cuidando y ajustando la app para que funcione mejor. Volvemos a encontrarnos pronto.” | No | Alta |
| Mantenimiento (`StaticScreens.tsx:114`) | “Estamos ajustando herramientas internas...” | Duplica el mensaje principal. | “Gracias por tu paciencia y por ser parte de Palestra.” | No | Media |

## Textos que deben conservar precisión técnica

El tono fraterno no debe volver ambiguos estos casos:

| Caso | Criterio recomendado |
| --- | --- |
| Credencial QR vencida, revocada o inválida | Mantener el estado exacto como título y sumar una acción concreta. No reemplazarlo por un mensaje genérico. |
| Permisos de cámara, fotos, ubicación y notificaciones | Nombrar el permiso y explicar dónde habilitarlo. Evitar culpar al usuario. |
| Límites de PDF, formato, tamaño y enlaces `https://` | Conservar números y formatos exactos. Puede agregarse “Revisá el archivo” como introducción. |
| Moderación, bloqueo y restricciones | Diferenciar cuenta bloqueada, mensaje restringido y contenido archivado. No ocultar la razón cuando sea seguro mostrarla. |
| Acciones destructivas | Mantener verbos explícitos: eliminar, archivar, quitar, revocar. La confirmación debe nombrar el elemento afectado. |
| Herramientas diagnósticas de administrador | Pueden mostrar Runtime, ProjectId, FCM, Storage o Supabase, pero solo dentro de superficies claramente técnicas y restringidas. |
| Estados y filtros compactos | “Pendiente”, “Aprobado”, “Bloqueado”, “Archivado” y similares pueden conservarse en chips/tablas; el mensaje de contexto es el que debe acompañar. |

## Problemas transversales

### 1. Errores externos sin traducción

Hay pantallas que asignan `error.message` directamente a un texto visible, entre ellas Comunidades, Perfil, Materiales, Foro, Biblioteca, Consultas e Intenciones. Esto puede mostrar inglés, nombres de tablas o políticas de seguridad.

Propuesta:

1. Registrar el detalle técnico en consola o diagnóstico administrativo.
2. Traducir categorías conocidas: red, sesión, permiso, archivo, validación y servicio temporalmente no disponible.
3. Mostrar al público una explicación breve y una acción posible.
4. Conservar un identificador de soporte si luego se incorpora observabilidad.

### 2. Prefijo global “Cambio realizado”

`changeDone()` antepone “Cambio realizado.” a mensajes que ya explican el resultado. Produce frases administrativas como “Cambio realizado. Usuario aprobado.” o “Cambio realizado. Intención creada.”

Propuesta: reservar confirmaciones específicas por acción: “Guardamos tus cambios”, “La comunidad fue actualizada”, “Tu intención ya fue compartida”. En administración masiva puede mantenerse una variante breve.

### 3. Voseo, tuteo y ortografía

Conviven “vos”, “tú”, “ti”, “puedes”, “podés”, “ingresa” e “ingresá”. La voz funcional debería usar voseo argentino. Los textos devocionales o citas de una fuente pueden conservar su redacción original, pero deben distinguirse del microcopy de interfaz.

En la implementación también conviene corregir tildes visibles (`sesión`, `contraseña`, `ubicación`, `notificación`, `válida`) sin alterar identificadores, datos remotos ni claves técnicas.

### 4. Personas tratadas como registros

“Usuarios cargados”, “miembros cargados”, “usuario aprobado” y “destinatarios” son correctos para tablas internas, pero fríos en superficies comunitarias. Preferir “personas”, “miembros de la comunidad”, “perfil” o el nombre propio cuando sea posible.

### 5. Estados vacíos sin próxima acción

Un estado vacío útil debería responder:

- Qué ocurre: todavía no hay contenido.
- Qué puede pasar después: aparecerá cuando se publique.
- Qué puede hacer ahora la persona: volver, explorar, crear, contactar o actualizar.

## Plan de implementación posterior

### Fase 1 — Alta prioridad

- Crear helpers neutrales y con narrativa para bienvenida, aprobación y bloqueo.
- Revisar Login, confirmación, perfil pendiente, perfil aprobado y cuenta bloqueada.
- Impedir que `error.message` técnico llegue directamente a pantallas públicas.
- Retirar Supabase, Storage, APK, SQL, FCM y ProjectId de mensajes no administrativos.
- Unificar voseo y ortografía en los flujos críticos.

### Fase 2 — Prioridad media

- Renovar estados vacíos de Home, Comunidad, Buzón, Consultas, Materiales, Noticias, PM, Foro y Formación.
- Reemplazar el prefijo `changeDone()` por confirmaciones específicas.
- Unificar mensajes duplicados de envío, guardado y publicación.
- Ajustar notificaciones y recordatorios con una voz breve y natural.

### Fase 3 — Baja prioridad

- Revisar etiquetas y ayudas del Panel Dirigencial.
- Separar copy operativo de copy técnico/diagnóstico.
- Centralizar textos repetidos en constantes por dominio, sin convertir todo el contenido en una única tabla global.
- Añadir pruebas unitarias para helpers de narrativa y traducción de errores.

## Matriz de cobertura

| Área solicitada | Archivos principales revisados | Resultado |
| --- | --- | --- |
| Login, registro y confirmación | `AuthFlow.tsx`, `GuestProfileAuthCard.tsx`, `reset-password.html` | Hallazgos altos en confirmación, bloqueo, consistencia de voz y errores. |
| Perfil pendiente, aprobado y bloqueado | `PendingEmailProfile.tsx`, `ProfileScreen.tsx`, `appMessages.ts` | Requiere mensajes contextuales y narrativa en hitos. |
| Home | `HomeScreen.tsx`, `profileDisplay.ts`, `HomeAdminPanel.tsx` | El saludo ya usa narrativa; vacíos y avisos técnicos necesitan ajuste. |
| Mi Comunidad y Panel Comunitario | `CommunitiesScreen.tsx`, `src/screens/community/**` | Vacíos y confirmaciones hablan de registros o bandejas. |
| Buzón | `MailboxPanel.tsx`, `useMailboxController.ts` | Buen alcance funcional; faltan tono, salida útil y unificación. |
| Consultas | `PublicQueriesInboxScreen.tsx`, `PublicQueryCard.tsx` | Copy operativo mayormente correcto; pulir vacíos y seguimiento. |
| Avisos y notificaciones | `CommunityNotice*`, `notificationHelpers.ts`, `dailyGospelNotifications.ts` | Prioridad alta en permisos, errores y recordatorio diario. |
| Panel Dirigencial y administración | `ProfileScreen.tsx`, `src/screens/profile/**` | Mantener precisión; humanizar personas, éxitos y restricciones. |
| Materiales y biblioteca | `MaterialsScreen.tsx`, `LibrarySectionScreen.tsx`, `DownloadsAdminPanel.tsx` | Varias referencias públicas a infraestructura. |
| Noticias y agenda | `NotilestraScreen.tsx`, `HomeScreen.tsx` | Recordatorios y favoritos admiten un tono más cercano. |
| Intenciones | `IntentionsScreen.tsx`, `IntentionsAdminPanel.tsx` | Buen cierre de oración; mejorar acceso, creación y vacíos. |
| Período Motivador | `MotivadorScreen.tsx`, panel correspondiente en `ProfileScreen.tsx` | Vacío público expone Supabase y estado interno. |
| QR | `ProfileScreen.tsx`, `credentialQr.ts` | Mantener estados exactos; ocultar instrucciones SQL al público. |
| Modo mantenimiento | `StaticScreens.tsx`, `GeneralSettingsAdminPanel.tsx` | Mensaje correcto pero duplicado y poco comunitario. |

## Criterios de validación para la futura implementación

- Ningún mensaje público nuevo contiene nombres de backend o instrucciones de desarrollo.
- Bienvenida, aprobación y acompañamiento usan género solo cuando `genderPreference` existe.
- El fallback sin narrativa es gramaticalmente neutral.
- Los mensajes funcionales usan voseo consistente.
- Cada error crítico ofrece una acción posible.
- Los estados de QR, permisos, seguridad y eliminación siguen siendo inequívocos.
- La longitud de banners, toasts y botones se prueba en celulares angostos y en dark mode.
- Los textos administrativos conservan claridad y no se vuelven excesivamente pastorales.

## Decisión de esta auditoría

No se reemplazó ningún texto ni se modificó lógica funcional. La recomendación es comenzar la implementación por autenticación y estados de cuenta, porque allí el tono tiene mayor impacto emocional y ya existe la información de narrativa necesaria.
