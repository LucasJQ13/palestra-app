# Auditoria de permisos frontend

Fecha: 2026-06-07

Alcance: revision de roles, permisos y helpers de acceso usados por el frontend. No incluye politicas RLS, RPCs ni Supabase.

## Hechos comprobados

### Roles definidos

Los roles frontend estan definidos en `src/types/auth.ts` y ordenados en `src/lib/roles.ts` mediante `roleHierarchy`.

| Rol | Rank | Alcance | Descripcion operativa |
| --- | ---: | --- | --- |
| `invitado` | 0 | publico | Usuario sin cuenta, ve contenido publico. |
| `palestrista` | 1 | comunidad | Usuario basico con cuenta aprobada. |
| `sedimentador` | 2 | comunidad | Usuario con PM vinculado a provincia/comunidad. |
| `animador_comunidad` | 3 | comunidad | Puede gestionar su comunidad asignada. |
| `coordinador_comunidad` | 4 | comunidad | Puede gestionar su comunidad asignada. |
| `vocal` | 5 | provincia | Vocal Diocesano, gestiona dentro de su provincia. |
| `asesor` | 6 | provincia | Acompana la organizacion provincial. |
| `coordinador_diocesano` | 7 | provincia | Coordina su provincia. |
| `vocal_nacional` | 8 | nacional | Gestiona alcance nacional debajo de su rango. |
| `coordinador_nacional` | 9 | nacional | Coordina alcance nacional. |
| `administrador` | 10 | sistema | Perfil tecnico de administracion global. |

### Permisos definidos

Los permisos estan definidos en `src/types/auth.ts` como union `Permission`.

Permisos de visibilidad general:

- `ver_inicio`
- `ver_noticias`
- `ver_comunidades`
- `ver_historia`
- `ver_contacto`
- `ver_materiales_internos`
- `ver_fechas_privadas`
- `ver_noticias_comunidad`
- `ver_seccion_asesores`

Permisos de archivos:

- `descargar_archivos`
- `descargar_archivos_exclusivos`

Permisos comunitarios:

- `subir_noticias_comunidad`
- `gestionar_comunidad`
- `enviar_mensajes_comunidad`

Permisos dirigenciales:

- `aprobar_sedimentadores`
- `otorgar_roles_provincia`
- `otorgar_roles_diocesanos`
- `enviar_notificaciones`
- `gestionar_contenido`

Permisos de sistema:

- `gestionar_permisos`
- `gestionar_sistema`
- `gestionar_roles_globales`
- `gestionar_pestanas`
- `gestionar_comunidades_global`

### Matriz local de permisos

La matriz local vive en `src/lib/permissions.ts`.

| Rol | Permisos destacados |
| --- | --- |
| `invitado` | Base publica: inicio, noticias, comunidades, historia y contacto. |
| `palestrista` | Base publica, materiales internos, descarga comun y noticias de comunidad. |
| `sedimentador` | Palestrista + archivos exclusivos y fechas privadas. |
| `animador_comunidad` | Sedimentador + noticias/comunidad/mensajes comunitarios. |
| `coordinador_comunidad` | Igual a animador en la matriz local. |
| `vocal` | Gestion comunitaria, aprobacion de sedimentadores, roles de provincia y contenido. |
| `coordinador_diocesano` | Vocal + roles diocesanos. |
| `asesor` | Similar a vocal, con `ver_seccion_asesores`; no tiene `otorgar_roles_diocesanos`. |
| `vocal_nacional` | Alcance nacional, roles provincia/diocesanos, contenido y notificaciones. |
| `coordinador_nacional` | Vocal nacional + `gestionar_permisos`. |
| `administrador` | Todos los permisos de sistema y gestion global. |

La funcion `getDynamicPermissionsForRole` puede reemplazar la matriz local si existen permisos remotos en `role_permissions`; si falla, vuelve a `getPermissionsForRole`.

### Helpers de acceso revisados

Archivo: `src/lib/sessionAccess.ts`.

| Funcion | Criterio actual |
| --- | --- |
| `canAccessPrivate` | Requiere `status === 'aprobado'` y rol distinto de `invitado`. |
| `hasPermission` | Lee exclusivamente `session.permissions`. |
| `canManagePublishedContent` | Requiere `gestionar_contenido`. |
| `canManageNewsContent` | Requiere `gestionar_contenido`. |
| `canManageNationalPublishedContent` | Permite por rol: `vocal_nacional`, `coordinador_nacional`, `administrador`. |
| `isCommunityLeaderRole` | Verdadero para `animador_comunidad` y `coordinador_comunidad`. |
| `canCreateOrAdministrateCommunities` | Permiso global o roles diocesanos/nacionales/admin. |
| `canUseCommunityAdmin` | Permiso `gestionar_comunidad`, permiso global o roles comunidad/diocesanos. |
| `canManageMotivadorPanel` | Permiso `gestionar_contenido` o `gestionar_sistema`. |
| `canManageFormationPathAdmin` | Solo `administrador`. |
| `canManageRequestsPanel` | Roles desde `vocal` hasta nacionales/admin. |
| `canEditAdminUser` | Bloquea autoedicion, valida provincia, subrango y rank. |
| `canManageUsersPanel` | Usa permisos de aprobacion/asignacion/globales; excluye lideres comunitarios. |
| `canEditStaticInstitutionalPage` | `coordinador_nacional` o `administrador`. |
| `canManageGlobalInstagram` | `coordinador_nacional` o `administrador`. |
| `canEditPageContent` | Permisos `gestionar_pestanas`, `gestionar_contenido` o rol administrador. |

Archivo: `src/lib/roles.ts`.

| Funcion | Criterio actual |
| --- | --- |
| `roleRank` | Rank numerico desde `roleHierarchy`. |
| `canSeeAllProvinces` | Nacionales y administrador. |
| `canAccessProvince` | Si no hay sesion o provincia, devuelve `true`; nacionales/admin ven todo. |
| `canManageProvince` | Admin o vocal/coordinador diocesano de la misma provincia. |
| `canEditCommunity` | Admin; lider comunitario solo su comunidad; vocal/coordinador diocesano su provincia. |
| `canApproveRole` | Usa rank y `approverRoles`, con casos especiales para administrador/nacionales/coordinador diocesano. |
| `assignableRolesFor` | Roles aprobables por la sesion. |
| `visibleHierarchyFor` | Admin ve todo; otros no ven `administrador`. |

## Observaciones de coherencia

Estas son observaciones sobre el frontend actual; no son cambios aplicados.

1. `canAccessProvince(session, province)` devuelve `true` cuando no hay sesion o no hay provincia. Esto puede ser correcto para contenido publico, pero conviene revisar usos administrativos para evitar que un dato sin provincia abra demasiado el alcance visual.

2. `asesor` tiene rank 6, superior a `vocal`, y en la matriz local tiene permisos de gestion comunitaria, aprobacion y roles de provincia. Sin embargo, varias herramientas nuevas excluyen explicitamente al asesor por regla funcional. Hay que mantener documentada esa excepcion para evitar accesos por rank.

3. `canManageNationalPublishedContent` permite por rol nacional/admin, aunque `vocal_nacional` no tiene `gestionar_pestanas` ni `gestionar_sistema`. Esto esta alineado con gestion nacional de contenido, pero no depende de `session.permissions`.

4. `canManageFormationPathAdmin` esta endurecido a `administrador`, mientras existe permiso generico `gestionar_contenido`. Si Proceso Educativo debe ser delegable luego, este helper sera el punto de cambio.

5. `canManageUsersPanel` depende de permisos, pero `enabledAdminModules` tambien mezcla reglas por rol para algunos modulos. La combinacion funciona, aunque dificulta auditar desde una unica fuente.

6. `canEditAdminUser` permite editar usuarios con rank igual o inferior (`>=`). Hay excepciones en UI y backend para administrador, provincia y subrol, pero conviene mantener pruebas manuales cuando se agreguen nuevos rangos/subrangos.

7. `animador_comunidad` y `coordinador_comunidad` tienen exactamente los mismos permisos locales. La diferencia real se expresa en labels, narrativa y reglas de negocio puntuales, no en la matriz `rolePermissions`.

8. Hay permisos definidos que se usan poco o indirectamente, por ejemplo `ver_seccion_asesores`, `enviar_mensajes_comunidad` y algunos `ver_*`. Conviene decidir si son contractuales para futuro o si deben conectarse mas explicitamente a UI.

## Pendientes

No aplicados en esta issue.

1. Crear una tabla o documento de decision para excepciones por rol, especialmente `asesor`, porque no siempre sigue rank puro.

2. Evaluar si `canAccessProvince` deberia devolver `false` en contextos administrativos cuando `province` viene vacia o nula.

3. Unificar gradualmente el criterio de visibilidad de modulos admin: hoy algunas herramientas usan permisos, otras roles explicitos y otras combinaciones.

4. Definir si `canManageFormationPathAdmin` debe seguir solo para administrador o pasar a permisos (`gestionar_contenido` / permiso especifico).

5. Revisar si `animador_comunidad` y `coordinador_comunidad` necesitan permisos diferenciados o si la igualdad actual es intencional.

6. Agregar tests unitarios livianos para `canEditAdminUser`, `canEditCommunity`, `canManageUsersPanel` y `canAccessProvince`.

7. Documentar el contrato entre permisos remotos (`role_permissions`) y fallback local (`rolePermissions`) para evitar diferencias sorpresivas entre localhost y Supabase.
