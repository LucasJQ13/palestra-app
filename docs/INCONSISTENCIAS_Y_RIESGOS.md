# Informe de inconsistencias y riesgos futuros - Palestra App

## 1. Objetivo del documento

Este documento registra inconsistencias, fragilidades técnicas y posibles errores futuros detectados en el estado actual de Palestra App.

El objetivo no es criticar la app ni frenar su evolución, sino ordenar los puntos que pueden generar fallas a medida que el proyecto crezca, especialmente si se suman nuevos módulos, más usuarios, más provincias, más roles y más contenido administrable.

La recomendación general es no abordar todos los puntos juntos. Lo correcto es convertir cada bloque en tareas pequeñas, verificables y con pruebas manuales.

## 2. Resumen ejecutivo

La app ya tiene una base funcional amplia: autenticación, perfil, roles, permisos, Supabase, contenido dinámico, comunidades, materiales, noticias, agenda, notificaciones, QR, deep links, panel dirigencial y configuración remota.

El principal riesgo actual no es la falta de funciones, sino el crecimiento orgánico sin suficiente consolidación técnica.

Los riesgos más importantes son:

1. Exceso de responsabilidad en `App.tsx` y `ProfileScreen.tsx`.
2. Dependencia fuerte de Supabase sin contrato versionado completo.
3. Consultas con fallback que ocultan diferencias de esquema.
4. Roles y permisos mezclados entre frontend, base de datos y configuración remota.
5. Notificaciones dependientes de configuración externa sensible a fallos.
6. Deep links que pueden fallar si Supabase, APK y Android no están perfectamente alineados.
7. Contenido dinámico y navegación remota con riesgo de inconsistencias visuales o de permisos.
8. Falta de migraciones SQL versionadas.
9. Falta de checklist de QA obligatorio antes de cada cambio.
10. Riesgo de que futuras IA o desarrolladores hagan cambios grandes y rompan flujos existentes.

## 3. Inconsistencia entre estado real del proyecto y documentación histórica

### Observación

El proyecto nació como una APK inicial, pero hoy tiene una complejidad mucho mayor. El README ya fue actualizado, pero todavía conviene mantener documentación viva porque la app cambia rápido.

### Riesgo futuro

Si la documentación queda atrasada, cualquier asistente de IA o colaborador puede interpretar la app como un MVP simple y tocar partes sensibles sin entender la arquitectura real.

### Consecuencia posible

- Cambios destructivos en permisos.
- Refactors demasiado grandes.
- Duplicación de funcionalidades ya existentes.
- Reescritura innecesaria de pantallas.
- Rotura de flujos de login, perfil o administración.

### Recomendación

Mantener actualizados:

- `README.md`.
- `docs/INFORME_PRESENTACION_APP.md`.
- `docs/INCONSISTENCIAS_Y_RIESGOS.md`.
- `docs/supabase/*`.
- `AGENTS.md` o guía equivalente para asistentes de IA.

## 4. App.tsx concentra demasiadas responsabilidades

### Observación

`App.tsx` funciona como centro general de la app. Actualmente concentra navegación, sesión, deep links, drawer, tema, búsqueda global, carga de contenido, refresh remoto, notificaciones, mantenimiento, mensajes visuales y render de pantallas.

### Riesgo futuro

Cada nueva función que se agregue en `App.tsx` aumenta el riesgo de efectos colaterales.

### Posibles errores futuros

- Cambiar una pantalla puede romper navegación.
- Cambiar sesión puede romper deep links.
- Cambiar refresh puede afectar contenido remoto.
- Cambiar tema puede afectar identidad visual.
- Cambiar drawer puede afectar permisos o acceso a perfil.
- Se vuelve difícil detectar de dónde viene un bug.

### Recomendación

Seguir las issues ya creadas para extraer progresivamente:

- Tema y preferencias.
- Puntero táctil.
- Carga inicial y refresh.
- Sesión y enlaces internos.
- Búsqueda global.
- Navegación local.
- Drawer.
- Modal de búsqueda.

No conviene reescribir `App.tsx` de una sola vez.

## 5. ProfileScreen.tsx concentra demasiada lógica dirigencial

### Observación

`ProfileScreen.tsx` agrupa perfil, autenticación auxiliar, administración, usuarios, comunidades, QR, permisos, solicitudes, paneles internos, notificaciones, contenido y configuración.

### Riesgo futuro

A medida que se agreguen herramientas dirigenciales, esta pantalla puede volverse inmanejable.

### Posibles errores futuros

- Un cambio en un panel puede romper otro panel.
- Se pueden duplicar estados internos.
- Los permisos pueden evaluarse distinto en distintas partes.
- Aumenta el riesgo de imports no usados o dependencias circulares.
- Se dificulta testear cada módulo.

### Recomendación

Dividir por paneles y dominios:

- Perfil público.
- Cuenta.
- Solicitudes.
- Comunidad.
- Usuarios.
- Materiales.
- Noticias.
- QR.
- Configuración.
- Permisos.

Cada extracción debe hacerse sin cambiar comportamiento.

## 6. Supabase no está suficientemente versionado en el repo

### Observación

La app depende de tablas, columnas y funciones remotas de Supabase. Sin embargo, el esquema real de base de datos y las funciones SQL no están completamente versionadas dentro del repositorio.

### Riesgo futuro

El frontend puede depender de una estructura que solo existe en el panel externo de Supabase. Si alguien cambia una tabla o función sin registrar el cambio, la app puede romperse sin que Git muestre el origen del problema.

### Posibles errores futuros

- Columnas inexistentes en consultas.
- RPCs que cambian parámetros.
- Funciones que devuelven otra forma de datos.
- Políticas de acceso que bloquean usuarios legítimos.
- Operaciones administrativas que fallan silenciosamente.
- Diferencia entre entorno real y lo que cree el código.

### Recomendación

Completar las fases Supabase creadas:

- Inventario real del esquema.
- Esquema canónico.
- Carpeta de migraciones.
- Auditoría de fallbacks.
- Migración inicial segura.
- Auditoría de reglas de acceso.
- Versionado de funciones remotas.
- Plan de eliminación de fallbacks.

## 7. Consultas con fallback pueden esconder problemas reales

### Observación

Hay funciones que intentan consultar una estructura y, si falla, vuelven a consultar una versión reducida o devuelven valores por defecto. Esto ayuda a que la app no se rompa, pero también puede ocultar que la base está incompleta o desalineada.

### Riesgo futuro

La app puede parecer funcionando, pero con datos parciales, imágenes faltantes, provincias incompletas o módulos degradados.

### Posibles errores futuros

- Comunidades sin imagen, logo o coordenadas.
- Noticias sin imagen o datos incompletos.
- Configuración remota que vuelve a valores por defecto sin avisar.
- Usuarios con permisos incompletos.
- Funciones nuevas que se apoyan en datos que no siempre existen.

### Recomendación

No eliminar fallbacks todavía. Primero documentar cada fallback y después quitarlo solo cuando la base esté alineada.

## 8. Riesgo de seguridad por confiar demasiado en controles del frontend

### Observación

La app tiene controles de permisos en frontend, pero la seguridad real debe vivir en Supabase: reglas de acceso, políticas por tabla y funciones remotas que validen al usuario autenticado.

### Riesgo futuro

Si Supabase permite operaciones sensibles sin validar rol o alcance, un usuario podría hacer acciones que el frontend no muestra pero que la base sí acepta.

### Posibles errores futuros

- Usuario común accediendo a datos privados.
- Dirigente de una provincia gestionando datos de otra provincia.
- Rol intermedio modificando usuarios de mayor jerarquía.
- Edición de contenido sin permiso real.
- Exposición de mensajes internos o datos personales.

### Recomendación

Auditar tabla por tabla:

- Quién puede leer.
- Quién puede insertar.
- Quién puede actualizar.
- Quién puede archivar.
- Qué alcance territorial tiene cada rol.

Todo permiso crítico debe validarse en base de datos, no solo en React Native.

## 9. Permisos dinámicos pueden dejar usuarios sin permisos básicos

### Observación

La app tiene permisos base por rol en frontend, pero también busca permisos remotos en `role_permissions`. Si la consulta remota devuelve datos, se usan esos permisos. Si esa tabla está incompleta, un rol podría quedar con menos permisos de los esperados.

### Riesgo futuro

Una mala carga en `role_permissions` puede bloquear funciones que el rol debería tener.

### Posibles errores futuros

- Un coordinador no ve herramientas que debería ver.
- Un administrador pierde accesos si su fila remota está mal configurada.
- Usuarios aprobados ven menos secciones de las esperadas.
- Cambios en base generan bugs difíciles de rastrear.

### Recomendación

Definir una política clara:

- O los permisos remotos reemplazan totalmente los permisos base.
- O los permisos remotos complementan los permisos base.
- O se define una tabla remota completa y obligatoria para todos los roles.

Actualmente conviene documentar y auditar antes de cambiar.

## 10. Inconsistencia posible entre roles, rangos y subroles

### Observación

La app maneja jerarquía de roles, permisos, alias de roles, etiquetas provinciales y subroles. Esta riqueza permite representar mejor el movimiento, pero también aumenta la complejidad.

### Riesgo futuro

Puede haber contradicciones entre lo que dice el rol base, lo que muestra la etiqueta, lo que permite el permiso y lo que realmente valida Supabase.

### Posibles errores futuros

- Un usuario aparece como dirigente pero no puede gestionar.
- Un usuario puede gestionar pero visualmente parece no tener rol suficiente.
- Un alias provincial confunde el rol real.
- Una provincia interpreta distinto una etiqueta.
- Un cambio de comunidad no degrada correctamente el rol.

### Recomendación

Crear una tabla de verdad:

- Rol técnico.
- Nombre visible.
- Alcance.
- Permisos mínimos.
- Quién lo aprueba.
- Qué puede gestionar.
- Qué no puede gestionar.

## 11. Deep link de autenticación sensible a configuración externa

### Observación

La app usa `palestra://auth/callback` para confirmaciones y recuperación. La configuración Android está preparada, pero el funcionamiento real depende también de la configuración externa del servicio de autenticación y de que la APK instalada tenga el intent filter correcto.

### Riesgo futuro

El código puede estar bien, pero el flujo puede fallar por configuración externa.

### Posibles errores futuros

- El mail confirma en navegador pero no abre la app.
- El enlace abre la app pero no procesa la sesión.
- El flujo de recuperación no lleva al lugar esperado.
- Una build vieja no reconoce el deep link.
- Expo Go, web y APK real se comportan diferente.

### Recomendación

Crear prueba manual obligatoria en APK real:

1. Registrar usuario nuevo.
2. Recibir correo.
3. Abrir enlace desde celular.
4. Confirmar que abre la app instalada.
5. Confirmar que muestra pantalla correcta.
6. Confirmar que el usuario puede iniciar sesión.
7. Confirmar recuperación de contraseña.

## 12. Registro de usuario puede fallar si la validación externa de dominio no responde

### Observación

El registro valida dominio de email y disponibilidad antes de avanzar. Si la validación del dominio no puede realizarse, el flujo detiene el avance.

### Riesgo futuro

Usuarios con correos válidos podrían no registrarse por problemas de conexión o validación externa.

### Posibles errores futuros

- Bloqueo de registro por red inestable.
- Rechazo de dominios válidos poco comunes.
- Mala experiencia en comunidades con baja conectividad.
- Aumento de solicitudes manuales a dirigentes.

### Recomendación

Evaluar si la validación de dominio debe ser bloqueante o solo advertencia.

Opción segura:

- Si el dominio parece inválido, advertir.
- Si no se puede verificar, permitir continuar con confirmación por correo.
- Mantener control de disponibilidad real del email.

## 13. Notificaciones push dependen de configuración externa compleja

### Observación

La app registra push token, crea canales Android y maneja errores relacionados con Firebase/FCM, google-services y credenciales.

### Riesgo futuro

La UI puede indicar intención de notificar, pero la notificación real puede no llegar si falta configuración externa.

### Posibles errores futuros

- Token no generado.
- Token generado pero no guardado.
- Canal Android mal configurado.
- Notificaciones que funcionan en una APK pero no en otra.
- Usuarios sin permiso de notificaciones.
- Error silencioso en entrega real.

### Recomendación

Separar claramente:

- Notificación local.
- Push token registrado.
- Intención de notificación creada.
- Notificación realmente enviada.
- Notificación recibida por dispositivo.

Crear pantalla o log de diagnóstico administrativo.

## 14. Recordatorios locales usan horario fijo

### Observación

Los recordatorios locales de agenda se programan para la fecha del evento a las 09:00.

### Riesgo futuro

Eventos con horario real distinto pueden generar recordatorios poco útiles.

### Posibles errores futuros

- Recordatorio tarde para actividades matutinas.
- Recordatorio demasiado temprano para actividades nocturnas.
- Confusión si el evento tiene fecha pero no hora.
- Problemas por zona horaria si se interpreta mal la fecha.

### Recomendación

Agregar campos de hora real al evento o definir una regla clara:

- Recordatorio el día anterior.
- Recordatorio X horas antes.
- Recordatorio configurable por usuario.

## 15. Subida de imágenes con nombre basado solo en fecha actual

### Observación

La subida de imágenes usa una ruta basada en carpeta y `Date.now()`, manteniendo extensión derivada del archivo.

### Riesgo futuro

Aunque es improbable, puede haber colisiones si se suben archivos simultáneamente. Además, el nombre no incluye usuario, módulo ni propósito.

### Posibles errores futuros

- Sobrescritura accidental si coincide ruta y timestamp.
- Dificultad para auditar imágenes.
- Acumulación de archivos huérfanos.
- Falta de política de limpieza.

### Recomendación

Usar nombres más robustos:

- módulo
- usuario o entidad
- timestamp
- sufijo aleatorio

Ejemplo:

```text
community/{communityId}/{timestamp}-{random}.jpg
```

También conviene documentar política de buckets y limpieza.

## 16. Fuentes externas de noticias pueden romper por cambios de HTML/RSS

### Observación

La app consume fuentes externas católicas mediante RSS o parsing HTML. El parser HTML depende de patrones de enlaces específicos.

### Riesgo futuro

Si una fuente cambia su estructura, la sección puede quedar vacía o mostrar datos incompletos.

### Posibles errores futuros

- Noticias externas desaparecen sin explicación.
- Imágenes incorrectas.
- Fechas ausentes.
- Links duplicados.
- Parsing roto por cambios del sitio.

### Recomendación

Estas fuentes deben considerarse opcionales. La app debe mostrar estado claro:

- fuente no disponible
- última actualización
- cantidad de noticias encontradas
- opción de desactivar fuente desde configuración

## 17. Configuración remota puede ocultar fallas con valores por defecto

### Observación

Si `app_runtime_config` falla o no devuelve datos, la app vuelve a `defaultRuntimeConfig`.

### Riesgo futuro

La app puede funcionar con configuración local sin advertir que la configuración remota falló.

### Posibles errores futuros

- Modo mantenimiento no se aplica.
- Mensaje global no aparece.
- Feature flags quedan con valores por defecto.
- Versión recomendada o mínima no se respeta.
- Administradores creen haber cambiado algo, pero la app no lo carga.

### Recomendación

Agregar indicador interno para administradores:

- configuración remota cargada correctamente
- última sincronización
- error de carga si existió
- valores activos actuales

## 18. Identidad visual editable puede generar problemas de contraste

### Observación

La app permite configurar colores de identidad. Tiene validación de hex, pero no se observa una validación de contraste o accesibilidad.

### Riesgo futuro

Un administrador podría configurar colores visualmente atractivos pero ilegibles.

### Posibles errores futuros

- Texto poco legible.
- Botones con bajo contraste.
- Modo oscuro inconsistente.
- Mala experiencia en celulares con brillo bajo.

### Recomendación

Agregar validación mínima:

- contraste texto/fondo
- fallback si color inválido
- vista previa antes de guardar
- advertencia si el color no cumple legibilidad básica

## 19. Navegación dinámica puede crear secciones inconsistentes

### Observación

La app admite pestañas remotas, iconos y tipos de sección. Esto es potente, pero requiere reglas estrictas.

### Riesgo futuro

Una pestaña mal configurada puede aparecer vacía, duplicada, con icono incorrecto o con visibilidad errónea.

### Posibles errores futuros

- Dos tabs con la misma key.
- Tab visible para roles incorrectos.
- Sección dinámica sin contenido.
- Icono inválido que cae en fallback.
- Pestañas protegidas alteradas por error.

### Recomendación

Validar en administración:

- key única
- tipo de sección válido
- icono válido
- roles válidos
- contenido mínimo según tipo
- protección de tabs esenciales

## 20. Provincias con nombres normalizados de forma parcial

### Observación

El código usa nombres técnicos como `Cordoba` y nombres visibles como `Córdoba`. También hay provincias cargadas localmente y provincias remotas.

### Riesgo futuro

Diferencias de acento, mayúsculas o nombres pueden romper filtros por provincia.

### Posibles errores futuros

- Usuario de Córdoba no ve contenido de Cordoba.
- Provincia duplicada con y sin tilde.
- Logo no encontrado.
- Instagram provincial no asociado.
- Permisos territoriales incorrectos.

### Recomendación

Definir identificadores estables:

- `province_id` técnico sin acentos.
- `display_name` visible con acentos.
- `slug` único.
- Relaciones por id, no por texto.

## 21. Comunidades vinculadas por nombre pueden generar problemas

### Observación

Algunas comparaciones de comunidad usan nombre de comunidad. Esto puede ser suficiente al inicio, pero es frágil.

### Riesgo futuro

Si una comunidad cambia de nombre, se escribe distinto o existe el mismo nombre en otra provincia, pueden fallar permisos o relaciones.

### Posibles errores futuros

- Un coordinador pierde acceso a su comunidad.
- Usuarios quedan vinculados a comunidad inexistente.
- Duplicación de comunidades.
- Fallas en filtrado de miembros.

### Recomendación

Usar `community_id` como referencia principal y dejar `community_name` solo como dato visible o compatibilidad.

## 22. Estados de usuario requieren reglas estrictas

### Observación

La app contempla `pendiente`, `aprobado` y `bloqueado`. El frontend actúa distinto según estado.

### Riesgo futuro

Si se crean usuarios sin perfil completo, sin provincia o sin comunidad, la app puede bloquearlos o redirigirlos de forma inesperada.

### Posibles errores futuros

- Usuario confirmado pero sin perfil.
- Perfil pendiente que no puede avanzar.
- Usuario bloqueado que conserva sesión vieja.
- Usuario aprobado sin comunidad asignada.
- Redirecciones repetidas a Perfil.

### Recomendación

Crear proceso de normalización de perfiles:

- todo usuario autenticado debe tener perfil
- todo perfil aprobado debe tener provincia y comunidad válidas
- todo usuario bloqueado debe cerrar sesión o quedar sin acceso privado
- toda transición de estado debe registrarse

## 23. Falta de trazabilidad administrativa completa

### Observación

La app importa o usa conceptos como audit log y administración, pero no queda claro si todas las acciones críticas quedan registradas de forma consistente.

### Riesgo futuro

En una app con roles y gestión institucional, no saber quién cambió qué puede generar conflictos.

### Posibles errores futuros

- No saber quién aprobó un usuario.
- No saber quién cambió un rol.
- No saber quién editó una noticia.
- No saber quién archivó una comunidad.
- Dificultad para revertir errores administrativos.

### Recomendación

Toda acción sensible debería guardar:

- usuario que ejecuta
- fecha
- acción
- entidad afectada
- valor anterior
- valor nuevo
- motivo opcional

## 24. Falta de pruebas automatizadas y checklist obligatoria

### Observación

El proyecto tiene `npm run typecheck`, pero no se observa una suite formal de tests ni una checklist obligatoria ya versionada para flujos críticos.

### Riesgo futuro

Un cambio pequeño puede romper login, navegación, permisos o Supabase sin ser detectado antes de compilar.

### Posibles errores futuros

- Build exitoso pero flujo roto.
- TypeScript correcto pero Supabase falla en runtime.
- Pantallas que renderizan mal solo en Android.
- Problemas de permisos detectados tarde.

### Recomendación

Como mínimo:

- mantener `npm run typecheck`
- crear `docs/QA_CHECKLIST.md`
- ejecutar pruebas manuales antes de APK
- registrar resultado de cada beta

A futuro:

- tests unitarios para helpers críticos
- tests de permisos
- tests de normalización de configuración

## 25. Riesgo de cambios grandes por asistentes de IA

### Observación

La repo está siendo preparada para que asistentes de IA trabajen sobre ella. Esto es útil, pero puede ser riesgoso si las tareas no son pequeñas.

### Riesgo futuro

Un asistente puede intentar “optimizar” reescribiendo archivos completos, eliminando fallbacks o cambiando arquitectura sin entender los flujos reales.

### Posibles errores futuros

- Pérdida de funcionalidades existentes.
- Refactor incompleto.
- Cambios de nombres que rompen Supabase.
- Eliminación de compatibilidad necesaria.
- Código más prolijo pero funcionalmente roto.

### Recomendación

Crear o mantener una guía para IA:

- no compilar APK salvo pedido
- no tocar Supabase sin issue específica
- no cambiar permisos sin auditoría
- no eliminar fallbacks sin plan
- no reescribir archivos completos
- ejecutar typecheck
- documentar cada cambio

## 26. Priorización de riesgos

### Críticos

1. Seguridad real de Supabase y reglas de acceso.
2. Esquema de base no versionado.
3. Permisos dinámicos y roles inconsistentes.
4. Deep link de autenticación no validado en APK real.
5. ProfileScreen y App.tsx demasiado grandes.

### Altos

1. Fallbacks que ocultan errores de esquema.
2. Notificaciones push sin diagnóstico completo.
3. Registro bloqueado por validación externa de correo.
4. Navegación dinámica mal configurada.
5. Provincias y comunidades dependientes de nombres de texto.

### Medios

1. Configuración remota que cae a valores por defecto sin alerta.
2. Fuentes externas de noticias frágiles.
3. Subida de imágenes con trazabilidad limitada.
4. Recordatorios locales con horario fijo.
5. Contraste visual configurable sin validación.

### Bajos

1. Textos duplicados.
2. Imports no usados.
3. README que requiere mantenimiento frecuente.
4. Diferencias menores de tono o acentos en textos.

## 27. Plan recomendado de acción

### Etapa 1 - Documentar antes de tocar

- Completar inventario Supabase.
- Completar auditoría de permisos.
- Completar checklist QA.
- Registrar baseline técnico.

### Etapa 2 - Estabilizar base y contrato remoto

- Diseñar esquema canónico.
- Versionar migraciones.
- Versionar funciones remotas.
- Revisar reglas de acceso.

### Etapa 3 - Reducir complejidad del frontend

- Extraer hooks desde `App.tsx`.
- Extraer componentes visuales grandes.
- Dividir `ProfileScreen.tsx` por paneles.
- Limpiar imports.

### Etapa 4 - Recién después, eliminar parches

- Tomar cada fallback documentado.
- Verificar que la base ya cumple el contrato.
- Eliminar uno por vez.
- Probar manualmente.
- Correr typecheck.

### Etapa 5 - Preparar beta más estable

- Probar APK real.
- Probar registro y confirmación.
- Probar roles.
- Probar administración.
- Probar notificaciones.
- Probar QR.
- Registrar resultados.

## 28. Conclusión

Palestra App tiene una base funcional valiosa y una visión institucional clara. El problema no es que falten ideas, sino que ya hay muchas funciones y el proyecto necesita consolidación.

La app puede crecer bien si se ordena en este orden:

1. Documentar.
2. Auditar.
3. Estabilizar Supabase.
4. Modularizar frontend.
5. Probar en APK real.
6. Recién después ampliar funcionalidades.

El error a evitar es seguir agregando módulos sobre una base que todavía depende de archivos demasiado grandes, reglas externas poco documentadas y fallbacks que esconden diferencias de esquema.

La recomendación final es avanzar con cambios pequeños, cada uno con criterio de aceptación, typecheck y prueba manual. Así la app puede pasar de beta funcional a herramienta institucional sólida sin perder lo ya construido.
