# Auditoria del ecosistema de comunidad y mensajeria

Fecha de revision: 12 de junio de 2026  
Alcance: Issue #59  
Tipo de trabajo: auditoria documental, sin cambios funcionales ni de base de datos.

## Resumen ejecutivo

Palestra tiene actualmente tres experiencias que conviene tratar como dominios separados:

1. **Avisos comunitarios**: publicaciones oficiales de una comunidad, visibles en `Mi Comunidad`.
2. **Buzon privado**: mensajes entre usuarios registrados y envios dirigenciales segmentados.
3. **Consultas publicas**: mensajes enviados desde la ficha de una comunidad, incluso por personas sin sesion.

La interfaz ya diferencia parcialmente estas experiencias, pero la persistencia actual solo las separa en dos familias:

- `community_publications` almacena avisos, noticias, fechas y encuestas comunitarias.
- `direct_messages` y `direct_message_recipients` almacenan mensajes privados modernos.
- `community_contact_messages` concentra consultas publicas, mensajes a responsables, mensajes a secretariados y envios segmentados heredados.

La funcion `get_my_mailbox_messages()` unifica las dos familias de mensajeria en una sola bandeja. Esto permite una experiencia centralizada, pero tambien mezcla conversaciones privadas con consultas operativas que tienen reglas de respuesta diferentes.

La recomendacion de menor riesgo es conservar la base actual mientras se separa primero la presentacion y el contrato de dominio. Una migracion fisica de datos puede hacerse despues, con compatibilidad temporal.

## Fuentes revisadas

### Frontend

- `src/screens/ProfileScreen.tsx`
- `src/screens/CommunitiesScreen.tsx`
- `src/screens/StaticScreens.tsx`
- `src/screens/profile/MailboxPanel.tsx`
- `src/screens/profile/useMailboxController.ts`
- `src/lib/profiles.ts`
- `src/lib/remoteData.ts`
- `src/lib/sessionAccess.ts`
- `src/lib/roles.ts`
- `src/types/auth.ts`

### Supabase

- `supabase/migrations/20260606010000_direct_user_messaging.sql`
- `supabase/migrations/20260607133000_mailbox_conversation_rows.sql`
- `supabase/patch_community_mailbox.sql`
- `supabase/patch_beta_functional_stability.sql`
- `supabase/patch_secretariats.sql`
- `supabase/patch_community_management_scope.sql`
- `supabase/patch_community_sync_push_delivery.sql`

## 1. Como funciona Mi Comunidad

`Mi Comunidad` es un panel privado dentro del perfil. Usa la provincia y la comunidad asociadas a la sesion.

El panel contiene:

- nombre de la comunidad de origen;
- formulario de nuevo aviso para Animador o Coordinador de Comunidad;
- listado de avisos comunitarios;
- edicion, cierre y archivo de avisos segun autoria o jerarquia;
- encargados de la comunidad;
- lista desplegable de miembros;
- acceso a perfiles o credenciales publicas.

Al entrar al panel:

- `refreshCommunityForum()` consulta `get_my_community_publications`;
- el frontend vuelve a filtrar por `session.communityOfOrigin`;
- `fetchMyCommunityMembers()` consulta `get_my_community_members`;
- los encargados se identifican por los roles `animador_comunidad` y `coordinador_comunidad`.

No es una red social completa. Los avisos se tratan como publicaciones internas; aunque la tabla admite encuestas y existen componentes de foro en otras partes, la vista principal de `Mi Comunidad` prioriza lectura y gestion de avisos.

## 2. Donde se muestra la comunidad del usuario

La comunidad se obtiene de la sesion como `communityOfOrigin` y se muestra o utiliza en:

- encabezado de `Mi Comunidad`;
- credencial digital y perfil;
- filtros de avisos comunitarios;
- carga de miembros y encargados;
- destinatario `Responsables` del buzon;
- restricciones territoriales para dirigentes comunitarios;
- etiquetas de perfiles, usuarios, secretariados y conversaciones.

En base de datos conviven tres referencias:

- `profiles.community_id`;
- `profiles.managed_community_id`;
- `profiles.community_name`.

Las RPC recientes priorizan IDs y conservan `community_name` como compatibilidad. La comparacion por nombre normalizado sigue existiendo en lecturas y representa un riesgo si una comunidad cambia de nombre sin sincronizar el perfil.

## 3. Datos comunitarios existentes

### Entidades principales

| Entidad | Uso actual |
| --- | --- |
| `provinces` | Provincia, identidad territorial y alcance diocesano |
| `communities` | Comunidad, provincia, datos de contacto, ubicacion y estado |
| `profiles` | Usuario, rol, provincia, comunidad de origen y comunidad gestionada |
| `community_publications` | Avisos, noticias, fechas y encuestas de una comunidad |
| `community_contact_messages` | Consultas y mensajes dirigidos por alcance |
| `direct_messages` | Cuerpo de mensajes privados entre usuarios |
| `direct_message_recipients` | Destinatarios, lectura y borrado individual |

### Datos visibles de una comunidad

La pantalla publica utiliza nombre, provincia, region, descripcion, direccion, telefono, dia y horario de reunion, imagen, coordenadas y subseccion comunitaria cuando existen.

## 4. Roles involucrados

| Alcance | Roles |
| --- | --- |
| Publico | `invitado` |
| Comunidad | `palestrista`, `sedimentador`, `animador_comunidad`, `coordinador_comunidad` |
| Provincia | `vocal`, `asesor`, `coordinador_diocesano` |
| Nacional | `vocal_nacional`, `coordinador_nacional` |
| Sistema | `administrador` |

Los permisos visibles se complementan con:

- `roleRank`;
- permisos persistidos en la sesion;
- provincia del actor;
- comunidad de origen o gestionada;
- reglas RPC y RLS.

## 5. Identificacion de animadores, coordinadores y asesores

### Encargados comunitarios

En `Mi Comunidad`, los encargados son perfiles de la misma comunidad cuyos roles sean:

- `animador_comunidad`;
- `coordinador_comunidad`.

### Secretariado provincial

`get_secretariat_members('provincia', provincia)` devuelve:

- `vocal`;
- `coordinador_diocesano`.

El Asesor no aparece actualmente en `Nuestro Secretariado`, aunque pertenece al alcance provincial y participa en algunas reglas de lectura de publicaciones.

### Secretariado nacional

`get_secretariat_members('nacional')` devuelve:

- `vocal_nacional`;
- `coordinador_nacional`.

## 6. Donde se crean noticias, avisos y publicaciones comunitarias

### Noticias generales

Se crean desde las herramientas de Noticias y persisten en las tablas/RPC del dominio de noticias. No forman parte del buzon.

### Avisos comunitarios

Se crean desde:

`Mi Perfil` -> `Mi Comunidad` -> `Nuevo aviso comunitario`

La RPC `create_community_publication`:

- admite `aviso`, `noticia`, `fecha` y `encuesta`;
- vincula automaticamente la comunidad del autor;
- permite publicar a Animador, Coordinador de Comunidad y Administrador;
- fuerza visibilidad publica para Animador;
- permite al Coordinador elegir `publica`, `registrados` o `sedimentadores`;
- puede generar una intencion push si el autor activa la opcion.

### Publicaciones de foro

El foro tiene su propio dominio. La documentacion SQL aclara que no reemplaza `community_publications`, que permanece destinado a avisos internos.

## 7. Diferencia actual entre noticia, aviso, mensaje y consulta

| Concepto | Persistencia | Interaccion | Destino |
| --- | --- | --- | --- |
| Noticia | Dominio de noticias | Lectura, favoritos y recordatorios segun pantalla | Audiencia por alcance |
| Aviso comunitario | `community_publications` | Lectura; edicion y archivo dirigencial | Miembros alcanzados de una comunidad |
| Mensaje privado | `direct_messages` + `direct_message_recipients` | Conversacion bilateral | Uno o varios usuarios registrados |
| Mensaje segmentado | `community_contact_messages` | Una respuesta operativa y estados | Comunidad, provincia, rol o jerarquia |
| Consulta publica | `community_contact_messages` | Respuesta operativa del dirigente | Responsables de una comunidad |

La diferencia conceptual existe, pero `community_contact_messages` todavia cubre demasiados casos.

## 8. Pantallas desde las que se envian mensajes

1. **Buzon de mensajes**
   - usuario individual;
   - responsables de mi comunidad;
   - comunidad;
   - todas las comunidades de una provincia;
   - dirigencia diocesana;
   - rol;
   - provincia;
   - rango y provincia;
   - todos, segun jerarquia.

2. **Modal de una comunidad**
   - usuarios registrados envian con sus datos de sesion;
   - invitados deben indicar nombre y contacto;
   - crea una consulta asociada a `community_id`.

3. **Secretariado Nacional o Nuestro Secretariado**
   - usuario registrado selecciona una persona concreta;
   - crea un mensaje dirigido mediante `target_user_id`.

4. **Formulario dinamico de Contacto**
   - inserta directamente en `community_contact_messages`;
   - puede incluir un destino textual dentro del cuerpo;
   - no garantiza un `community_id` ni un destinatario estructurado.

El cuarto flujo es el menos consistente y deberia migrarse a una RPC con destino explicito.

## 9. Destino de los mensajes enviados desde Comunidades

### Contactar una comunidad

El mensaje queda asociado a `community_id`. Puede ser visto por:

- su propio remitente si esta autenticado;
- Animador o Coordinador de esa comunidad;
- Vocal o Coordinador Diocesano de la provincia;
- Coordinador Nacional;
- Administrador.

La funcion actual de acceso no incluye expresamente a `vocal_nacional` ni a `asesor` para consultas comunitarias.

### Contactar un secretariado

El mensaje queda dirigido a `target_user_id`. Solo se permite como destino:

- Vocal Diocesano;
- Coordinador Diocesano;
- Vocal Nacional;
- Coordinador Nacional.

El mensaje aparece en el buzon del destinatario y en enviados del remitente.

## 10. Comportamiento para un usuario con sesion

Un usuario aprobado puede:

- abrir su buzon;
- enviar mensajes privados a otros usuarios disponibles;
- enviar a responsables de su comunidad;
- contactar una comunidad sin volver a escribir sus datos;
- contactar integrantes de secretariados;
- consultar enviados, recibidos y eliminados;
- marcar lectura;
- eliminar o restaurar mensajes solo de su vista;
- reportar mensajes recibidos;
- conservar un borrador local por dispositivo.

Los destinos adicionales dependen del rol:

- comunidad: usuarios y responsables;
- diocesano: usuarios, roles, comunidades y responsables provinciales;
- nacional: usuarios, roles y dirigencia diocesana;
- administrador: todos los destinos segmentados.

## 11. Comportamiento para un invitado

Un invitado puede:

- ver la pantalla publica de Comunidades;
- abrir el detalle de una comunidad;
- enviar una consulta proporcionando nombre y contacto.

No puede:

- abrir un buzon personal persistente;
- consultar el estado de esa consulta dentro de la app;
- recibir una respuesta interna asociada a una cuenta;
- contactar directamente a un integrante del Secretariado.

Aunque `create_community_contact_message` admite `anon`, la respuesta depende del dato de contacto externo escrito por la persona. La aplicacion no implementa entrega automatica de esa respuesta por email, SMS o WhatsApp.

## 12. Donde ven los dirigentes los mensajes

Los mensajes se muestran en:

`Mi Perfil` -> `Buzon`

`get_my_mailbox_messages()` combina:

- mensajes privados recibidos;
- mensajes privados enviados;
- consultas comunitarias;
- mensajes segmentados heredados;
- mensajes a secretariados.

El frontend agrupa filas por contraparte cuando existe usuario. Los mensajes operativos sin contraparte directa pueden agruparse por origen, comunidad o identificador.

Los dirigentes autorizados pueden responder consultas de `community_contact_messages` con una unica respuesta persistida en el campo `response`. Esto no crea una conversacion bilateral completa.

## 13. Destino diocesano y nacional

### Diocesano

- `diocesan_leadership`: Vocales y Coordinadores Diocesanos, opcionalmente de una provincia.
- `province_communities`: Animadores y Coordinadores de Comunidad de la provincia del remitente.
- `community`: responsables de una comunidad de la provincia.

### Nacional

- `get_secretariat_members('nacional')`: muestra Vocales y Coordinadores Nacionales.
- Un mensaje a un miembro nacional se guarda con `target_user_id`.
- Vocal Nacional y Coordinador Nacional pueden enviar a usuarios, roles y dirigencia diocesana desde el buzon.

### Administrador

Puede utilizar alcance total, usuario, rol, provincia y combinaciones.

## 14. El buzon privado es solo para registrados

Si. La interfaz del buzon se monta dentro del perfil autenticado y las RPC de lectura y envio directo requieren `authenticated` y un perfil aprobado.

La excepcion no es un buzon privado: una consulta anonima puede escribirse en `community_contact_messages`, pero el invitado no obtiene bandeja ni historial.

## 15. Las consultas publicas estan separadas

**En interfaz, parcialmente. En datos, no completamente.**

- Se originan en el modal publico de Comunidades.
- Solicitan nombre y contacto cuando no hay sesion.
- Se guardan en `community_contact_messages`.
- Luego aparecen dentro del mismo buzon que los mensajes segmentados.

No existe una bandeja exclusiva de consultas publicas ni un canal de respuesta externa automatizado.

## Mapa de flujos actual

| Origen | Tipo de usuario | Destino esperado | Destino actual | Observacion |
| --- | --- | --- | --- | --- |
| Mi Comunidad -> Nuevo aviso | Animador/Coordinador | Miembros de su comunidad | `community_publications` de su comunidad | Separacion correcta |
| Buzon -> Usuario | Registrado | Usuarios seleccionados | `direct_messages` + destinatarios | Conversacion bilateral |
| Buzon -> Responsables | Registrado | Animador/Coordinador propios | `community_contact_messages`, alcance comunidad | Respuesta operativa, no chat completo |
| Buzon -> Comunidad | Dirigente diocesano/admin | Responsables comunitarios | `community_contact_messages` | Depende de reglas por comunidad |
| Buzon -> Comunidades de provincia | Dirigente diocesano/admin | Dirigentes comunitarios provinciales | `community_contact_messages`, alcance provincial | Un registro representa audiencia multiple |
| Buzon -> Dirigencia diocesana | Nacional/admin | Vocales/Coordinadores diocesanos | `community_contact_messages` | Puede abarcar todas las provincias |
| Buzon -> rol/provincia/todos | Administrador | Segmento indicado | `community_contact_messages` | Mensajeria masiva dentro de tabla de consultas |
| Comunidades -> Contactar | Invitado | Responsables de la comunidad | `community_contact_messages` | Sin historial ni entrega automatica de respuesta |
| Comunidades -> Contactar | Registrado | Responsables de la comunidad | `community_contact_messages` | Visible tambien en enviados |
| Secretariado -> Enviar mensaje | Registrado | Dirigente seleccionado | `community_contact_messages.target_user_id` | Mensaje directo legado, no `direct_messages` |
| Contacto institucional | Publico | Destino configurado | Insercion directa con etiqueta textual | Falta destino relacional estructurado |

## Inconsistencias y riesgos detectados

### 1. Multiples definiciones de las mismas RPC

Funciones como `get_my_mailbox_messages`, `current_user_can_access_community_message` y `respond_community_contact_message` aparecen en varios parches y migraciones.

Riesgo: el comportamiento real depende del orden exacto en que se aplicaron los SQL. La migracion mas reciente del repositorio devuelve el contrato que espera el frontend, pero la base desplegada debe verificarse.

### 2. `community_contact_messages` tiene demasiadas responsabilidades

La misma tabla representa:

- consulta publica;
- mensaje a responsables;
- mensaje a secretariado;
- envio a rol;
- envio provincial;
- envio masivo.

Esto dificulta distinguir:

- si una respuesta es chat o resolucion;
- quien es propietario del mensaje;
- cuantos destinatarios reales tuvo;
- estados de lectura individuales;
- entrega de una respuesta a invitados.

### 3. Respuesta no bilateral en mensajes comunitarios

`response` es un solo campo. Una segunda respuesta reemplazaria o extenderia una resolucion, pero no modela una conversacion.

### 4. Invitados sin seguimiento

La consulta anonima se persiste, pero:

- no tiene codigo de seguimiento;
- no tiene bandeja;
- no hay envio externo de la respuesta;
- `sender_id` es nulo.

### 5. Contacto institucional sin destino relacional

`DynamicContactForm` inserta directamente y puede guardar el destino como prefijo del texto. Esto evita que las reglas territoriales identifiquen con certeza a los receptores.

### 6. IDs y nombres de comunidad conviven

Las reglas modernas usan IDs, pero varias comparaciones mantienen `community_name`. Renombrar una comunidad puede generar perfiles o permisos desincronizados.

### 7. Diferencia entre permisos de publicaciones y consultas

El Asesor puede leer publicaciones provinciales en algunas reglas, pero no aparece como receptor/responsable de consultas comunitarias. `vocal_nacional` tampoco tiene acceso general explicito a esas consultas, mientras Coordinador Nacional si.

Esto puede ser intencional, pero debe definirse como politica y no quedar como efecto lateral de SQL.

### 8. Agrupacion visual de registros no conversacionales

El buzon intenta agrupar todo como conversaciones. Los envios segmentados y consultas anonimas no siempre tienen una contraparte identificable, por lo que pueden quedar agrupados de forma menos intuitiva.

## Separacion futura recomendada

### A. Avisos comunitarios

Objetivo: comunicacion oficial sin respuesta.

- Mantener `community_publications`.
- Mantener alcance, visibilidad y push.
- No mezclar con el buzon.
- Tratar comentarios o foro como modulo independiente.

### B. Buzon privado

Objetivo: conversacion entre personas registradas.

- Consolidar en `direct_messages` y `direct_message_recipients`.
- Usar una fila por mensaje y estados por participante.
- Migrar los mensajes a secretariados con `target_user_id` a este dominio.
- Mantener reportes y moderacion.

### C. Consultas publicas

Objetivo: contacto de invitados o usuarios con una comunidad/equipo.

- Mantener temporalmente `community_contact_messages`.
- A futuro renombrar conceptualmente a `public_inquiries` o crear tabla equivalente.
- Agregar tipo de destino estructurado: comunidad, provincia, nacional o contacto institucional.
- Guardar responsable asignado, estado de gestion y trazabilidad.
- Para invitados, agregar codigo de seguimiento o entrega externa de respuesta.
- Mostrar a dirigentes en una bandeja `Consultas`, separada del chat.

## Plan de migracion de menor riesgo

### Etapa 1: separar experiencia sin mover datos

- Mantener RPC y tablas.
- Dividir el buzon visualmente en `Conversaciones` y `Consultas`.
- Clasificar por `source`, `target_scope`, `sender_id` y `community_id`.
- No cambiar permisos.

### Etapa 2: normalizar contratos

- Crear una unica migracion canonica para las RPC de mensajeria.
- Agregar pruebas SQL de acceso por rol y territorio.
- Eliminar dependencia funcional de nombres de comunidad.
- Reemplazar inserciones directas del formulario institucional por RPC.

### Etapa 3: migrar mensajes personales heredados

- Los registros con `target_user_id` y remitente autenticado pueden migrarse a `direct_messages`.
- Mantener una vista de compatibilidad mientras existan clientes antiguos.
- No migrar consultas anonimas al chat.

### Etapa 4: formalizar consultas

- Crear dominio de consultas con destinatarios y estados propios.
- Incorporar asignacion, historial de respuestas y entrega externa opcional.
- Retirar gradualmente los usos multiproposito de `community_contact_messages`.

## Verificaciones recomendadas antes de cambios funcionales

1. Comparar la firma desplegada de `get_my_mailbox_messages()` con la migracion `20260607133000`.
2. Confirmar cual definicion de `current_user_can_access_community_message()` esta activa.
3. Probar con cuentas reales:
   - Palestrista;
   - Animador;
   - Coordinador de Comunidad;
   - Vocal;
   - Coordinador Diocesano;
   - Vocal Nacional;
   - Coordinador Nacional;
   - Administrador.
4. Enviar una consulta como invitado y verificar quien puede verla.
5. Enviar a Secretariado y verificar entrada/enviados.
6. Enviar mensajes directos y comprobar lectura, borrado y restauracion por participante.
7. Renombrar una comunidad de prueba y validar sincronizacion de IDs y nombres.

## Conclusion

La app ya tiene una base funcional valiosa: avisos comunitarios persistentes, mensajeria privada moderna, consultas publicas y segmentacion por jerarquia. El principal problema no es la ausencia de funciones, sino la superposicion historica dentro de `community_contact_messages`.

El siguiente paso seguro no es reemplazar todo. Es separar primero las experiencias y consolidar un contrato SQL canonico. Con eso estable, la migracion de mensajes personales heredados y la formalizacion de consultas publicas pueden realizarse sin interrumpir el funcionamiento actual.
