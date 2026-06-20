# Auditoría de contenedores anidados en mobile

Issue de origen: #82  
Fecha del relevamiento: 2026-06-18  
Commit auditado: `f870334`  
Alcance: diagnóstico y recomendaciones. No se modifican estilos, lógica, permisos ni Supabase.

## Resumen ejecutivo

El principal problema no nace dentro de cada formulario, sino en el armazón compartido de `ProfileScreen`. Los módulos dirigenciales se renderizan dentro de una cadena de superficies con padding propio:

```text
contenido de App
└── profileShell
    └── stack del Panel Dirigencial
        └── adminPanel
            └── adminWorkspace del módulo
                └── panel/editor local
                    └── subpanel de una sección del formulario
```

En un viewport de 320 px, la cadena más profunda puede reducir el ancho útil aproximado de esta manera:

| Capa | Descuento horizontal acumulado | Ancho útil aproximado |
|---|---:|---:|
| Viewport | 0 px | 320 px |
| `content` | 36 px | 284 px |
| `profileShell` | 68 px | 252 px |
| `adminPanel` | 108 px | 212 px |
| `adminWorkspace` | 140 px | 180 px |
| `profileCommunityPanel` | 164 px | 156 px |
| `adminInlineEditor` con margen y padding | 212 px | 108 px |

El cálculo usa los valores actuales de `src/theme/appStyles.ts`. No cuenta `View` neutros: solo superficies que agregan padding o margen horizontal. Explica por qué un formulario puede verse angosto aun cuando sus inputs tengan `width: '100%'`.

Los casos más graves son edición de comunidades, edición de usuarios, Listas QR, Período Motivador y el editor general por bloques. Todos combinan un editor largo con cinco o más capas visuales y, además, listas o scrolls verticales internos.

## Criterio usado

El nivel de anidación indica cuántas superficies visibles o con padding separan el viewport del contenido principal de la tarea:

- **2 capas**: aceptable; pantalla más una sección.
- **3 capas**: revisar; puede ser válida si la última capa representa una unidad real.
- **4 capas**: alta pérdida de espacio en mobile.
- **5 o más capas**: crítica para formularios y editores largos.

La prioridad combina profundidad, longitud del formulario, ancho de los campos y presencia de scrolls internos:

- **Crítica**: el formulario principal queda demasiado chico o difícil de usar.
- **Alta**: funciona, pero desperdicia mucho espacio.
- **Media**: anidación molesta pero no bloqueante.
- **Baja**: ajuste visual menor.

## Hallazgos transversales

### 1. El Panel Dirigencial duplica la superficie de cada módulo

`ProfileScreen` coloca todos los módulos dentro de `profileShell` y `adminPanel`. Después, casi cada módulo vuelve a crear un `adminWorkspace` con fondo, borde, radio y padding. El módulo se percibe como una tarjeta dentro de otra tarjeta antes de renderizar su contenido real.

Recomendación: en mobile, el Panel Dirigencial debe funcionar como navegación hacia una vista de módulo full width. `adminPanel` puede conservar la grilla/selector, pero no debe envolver el cuerpo del módulo activo. En escritorio se puede mantener una variante con ancho máximo y superficie elevada.

### 2. Los editores se abren dentro de la fila o tarjeta que los invoca

Comunidades y Usuarios expanden formularios largos debajo del elemento seleccionado, todavía dentro de la lista, de la tarjeta de sección y del módulo administrativo. Listas QR repite el patrón para creación, compartir y gestión de una lista.

Recomendación: una fila puede mostrar resumen y acciones, pero `Crear` o `Editar` debe abrir un editor full screen con encabezado, volver/cerrar, scroll único y acciones fijas o claramente visibles al final.

### 3. Hay demasiados bordes para comunicar una misma jerarquía

`profileShell`, `adminPanel`, `adminWorkspace`, `profileCommunityPanel`, `inlineEditorPanel`, `adminInlineEditor`, `adminListRow`, `innerNewsCard` y `blockEditorCard` usan combinaciones similares de fondo, borde, radio y padding. Visualmente compiten aunque algunas capas solo sirven para agrupar.

Recomendación: una sola superficie elevada por contexto. Dentro de ella, usar títulos, espaciado y separadores. Reservar una nueva card para entidades independientes, no para cada subsección de un mismo formulario.

### 4. El ancho reducido se combina con scrolls verticales internos

El `ScrollView` raíz de `App.tsx` convive con `ScrollView` internos en dropdowns, usuarios QR, asesores, miembros y comunidades. `nestedScrollEnabled` evita algunos bloqueos, pero no elimina la competencia de gestos ni el exceso de scroll.

Recomendación: mantener un solo scroll vertical principal por pantalla. Dropdowns largos deben usar un modal/selector; listas extensas, una pantalla o lista dedicada; editores expandidos, una ruta full screen.

### 5. Los grupos horizontales dejan de ser confiables en la profundidad máxima

`filterRow` permite wrap, pero varios inputs usan `colorInput` con `minWidth: 130`. Dentro de un editor con cerca de 108 px útiles, el mínimo puede desbordar. Aun cuando el wrap funciona, cada par de campos pasa a dos filas y aumenta mucho el scroll.

Recomendación: debajo de 480 px, todos los campos de formularios largos deben apilarse a una columna y usar `minWidth: 0`. Los grupos horizontales deben limitarse a controles cortos que realmente entren.

## Mapa por pantalla

| Pantalla o flujo | Archivo probable | Problema visual | Nivel estimado | Prioridad | Recomendación |
|---|---|---|---:|---|---|
| Gestión de comunidades | `src/screens/ProfileScreen.tsx`, `src/screens/profile/CommunityAdminPanel.tsx` | El módulo comienza dentro de `profileShell → adminPanel → adminWorkspace`; subsecciones y filas vuelven a crear paneles | 4-5 | **Crítica** | Abrir el módulo como vista full width; quitar fondo/borde de `adminWorkspace` en mobile |
| Crear comunidad | `src/screens/profile/CommunityAdminPanel.tsx` | Formulario largo dentro de `profileCommunityPanel`, ya contenido por tres superficies administrativas | 5 | **Crítica** | Editor full screen; campos a una columna; una sola superficie |
| Editar comunidad existente | `src/screens/profile/CommunityAdminPanel.tsx` | `dropdownList → fila → adminInlineEditor → profileCommunityPanel` para ubicación; es la cadena más angosta detectada | 6-7 | **Crítica** | Editor full screen obligatorio; ubicación como sección sin card interna |
| Panel Comunitario | `src/screens/ProfileScreen.tsx`, `src/screens/community/CommunityPanelScreen.tsx`, `src/screens/community/panel/*` | Ya evita `profileShell` mediante retorno dedicado, pero cada bloque es una card y el compositor de avisos comparte panel con el historial | 2 | **Media** | Conservar como pantalla dedicada; separar compositor e historial si crecen; no agregar otra card exterior |
| Asesores de comunidad | `src/screens/profile/CommunityAdvisorsManager.tsx` | Selectores y listas quedan dentro del armazón dirigencial y de `adminWorkspace`; varios scrolls internos | 4 | **Alta** | Módulo full width sin card exterior; selectores en modal/lista; filas con separadores |
| Panel Dirigencial / selector de módulos | `src/screens/ProfileScreen.tsx`, `src/theme/appStyles.ts` | `profileShell`, cabecera colapsable, `adminPanel` y grilla consumen ancho antes del módulo activo | 3-4 | **Alta** | Separar navegación y contenido; el módulo activo no debe ser hijo visual de la grilla |
| Administración de usuarios - listado | `src/screens/ProfileScreen.tsx`, `src/screens/profile/AdminUsersToolMenu.tsx` | Provincia → panel → card de usuario → editor; el resumen y sus acciones ya llegan muy comprimidos | 5-6 | **Crítica** | Listado full width con filas simples; abrir detalle/edición en otra vista |
| Administración de usuarios - edición | `src/screens/ProfileScreen.tsx` | `profileCommunityPanel → innerNewsCard/adminInlineEditor`; formulario muy largo con dropdowns y PM personal | 6-7 | **Crítica** | Editor full screen obligatorio con secciones sin cajas anidadas |
| Administración de usuarios - crear/diagnóstico | `src/screens/ProfileScreen.tsx` | Formularios dentro de `profileCommunityPanel`; diagnóstico agrega `innerNewsCard` para el informe | 5-6 | **Alta** | Vistas de tarea separadas; informe plano con secciones y divisores |
| Listas QR - crear | `src/screens/ProfileScreen.tsx` | Formulario, dropdowns, selección de usuarios y compartir viven dentro de `profileCommunityPanel` | 5-6 | **Crítica** | Flujo full screen por pasos: datos, miembros, compartir, confirmar |
| Listas QR - gestionar/compartir | `src/screens/ProfileScreen.tsx` | La lista seleccionada abre paneles dentro del panel; hay listas verticales internas de hasta 80/90 usuarios | 6 | **Crítica** | Pantalla de detalle propia; miembros y permisos en subsecciones o modales |
| Descargas / Materiales admin | `src/screens/profile/DownloadsAdminPanel.tsx` | `adminWorkspace` contiene `inlineEditorPanel`, cards de documentos y otro formulario de material en el mismo plano | 5 | **Crítica** | Separar listado, editor de botón y editor de material; ambos editores full screen |
| Inventario de contenido publicado | `src/screens/profile/PublishedContentAdminPanel.tsx` | Listas simples dentro de cuatro capas; las filas repiten borde y fondo | 4-5 | **Alta** | Ajuste visual: quitar card exterior y usar filas con separadores; no requiere editor full screen |
| Noticias admin | `src/screens/ProfileScreen.tsx` | Compositor largo dentro de `adminWorkspace`; la previsualización agrega `adminPreviewPane` | 4-5 | **Alta** | Compositor full screen; preview colapsable o pestaña, no card permanente |
| Eventos / Notilestra admin | `src/screens/ProfileScreen.tsx` | Formulario y calendario dentro de `adminWorkspace`; `pmCalendarPanel` suma 22 px laterales | 5 | **Crítica** | Compositor full screen; calendario en modal o sección sin padding duplicado |
| Período Motivador admin | `src/screens/ProfileScreen.tsx` | `adminWorkspace → inlineEditorPanel → pmCalendarPanel`; muchos campos, chips y acciones | 5-6 | **Crítica** | Editor full screen obligatorio; calendario separado; lista de PM fuera del formulario |
| Configuración general | `src/screens/profile/GeneralSettingsAdminPanel.tsx` | Formulario corto dentro de cuatro capas; cada opción vuelve a parecer tarjeta | 4-5 | **Alta** | Ajuste visual: módulo sin card exterior y filas separadas; no necesita full screen adicional |
| Contenido general / editor por bloques | `src/screens/ProfileScreen.tsx` | Cada bloque usa `blockEditorCard` dentro del módulo profundamente anidado; edición extensa y repetitiva | 5-6 | **Crítica** | Editor full screen; bloque activo en panel propio o acordeón, sin card por bloque en mobile |
| Navegación de la app | `src/screens/ProfileScreen.tsx` | La consola dedicada usa margen negativo para recuperar ancho, pero conserva múltiples superficies (`navigationDedicatedShell`, builder, preview, focus panel) | 3-5 | **Alta** | Convertir el breakout parcial en pantalla real; preview colapsable en mobile |
| Editar perfil personal | `src/screens/ProfileScreen.tsx` | Formulario largo dentro de `profileShell → profileCommunityPanel`; color personal agrega `card` interna | 4 | **Crítica** | Vista full screen de edición; usar secciones y eliminar card de color interna |
| Ajustes de perfil | `src/screens/profile/ProfileSettingsPanel.tsx` | `profileCommunityPanel` contiene `inlineEditorPanel` cuando se abren opciones avanzadas | 3-4 | **Alta** | Mantener filas planas; abrir ajustes avanzados como pantalla/modal full screen |
| Modal de comunidad - detalle | `src/screens/CommunitiesScreen.tsx` | `modalOverlay → modalPanel`; metadatos usan subgrupos, pero el detalle sigue siendo legible | 2-3 | **Media** | Ajuste visual menor; mantener una única superficie de modal |
| Modal de comunidad - edición/contacto largo | `src/screens/CommunitiesScreen.tsx` | El modal agrega `inlineEditorPanel` dentro de `modalPanel`, con scroll y teclado | 3-4 | **Alta** | Modal full screen para formularios; el modal centrado queda solo para lectura/confirmación |
| Buzón - nuevo mensaje | `src/screens/profile/MailboxPanel.tsx` | `profileShell → mailboxShell → inlineEditorPanel`; destinatarios agregan panel y dropdowns internos | 4-5 | **Crítica** | Seguir el precedente del hilo full screen y abrir el compositor como pantalla completa |
| Buzón - reporte | `src/screens/profile/MailboxPanel.tsx` | Modal centrado con encabezado, motivos y textarea; profundidad moderada | 3 | **Media** | Mantener modal si el contenido entra; usar full screen en pantallas muy chicas o con teclado |
| Proceso educativo admin | `src/screens/profile/FormationPathAdminPanel.tsx` | `adminWorkspace → inlineEditorPanel`; estaciones pueden abrir otro `profileCommunityPanel` | 5-6 | **Crítica** | Editor de estación full screen; listado y edición no deben compartir la misma card |
| Provincias admin | `src/screens/profile/ProvinceAdminPanel.tsx`, `src/screens/ProfileScreen.tsx` | Alta/edición dentro de `profileCommunityPanel` y filas con varias acciones | 5 | **Alta** | Formulario separado; lista full width; reducir cards por fila |
| Identidad y Home admin | `src/screens/profile/IdentityAdminPanel.tsx`, `src/screens/profile/HomeAdminPanel.tsx` | `adminPreviewPane` agrega otra superficie, pero los formularios son relativamente cortos | 5 | **Media** | Ajuste visual; preview colapsable y sin borde exterior duplicado |
| Materiales - edición desde pantalla pública | `src/screens/MaterialsScreen.tsx` | Cards públicas pueden contener `inlineEditorPanel` o `profileCommunityPanel` para edición | 3-4 | **Alta** | Editor full screen para administradores; vista pública queda solo en modo lectura |
| Noticias/agenda - lectura y recordatorios | `src/screens/NotilestraScreen.tsx` | Cards y modales no presentan una cadena crítica; los modales mantienen una sola superficie principal | 2-3 | **Baja** | Conservar; evitar sumar wrappers en futuras ediciones |
| PM - vista pública | `src/screens/MotivadorScreen.tsx` | `featurePanel` y cards son hermanos, no cards anidadas | 2 | **Baja** | Sin cambio estructural; sirve como referencia de composición plana |

## Formularios que deben pasar a full screen

Prioridad inmediata:

1. Edición y creación de comunidad.
2. Edición de usuario.
3. Crear, editar y compartir Listas QR.
4. Crear/editar Período Motivador y eventos.
5. Editor general por bloques.
6. Editores de materiales y documentos externos.
7. Compositor de noticias.
8. Editar perfil personal.
9. Nuevo mensaje del Buzón.
10. Editar estación del Proceso Educativo.

Estos flujos comparten una o más señales de riesgo: más de ocho controles, teclado, selectores largos, imágenes, calendarios, listas internas o acciones de guardado/descarte.

## Casos que solo requieren simplificación visual

No necesitan una nueva pantalla si se elimina la superficie redundante:

- Inventario de Contenido Publicado.
- Configuración general.
- Asesores de comunidad.
- Resumen del Panel Dirigencial.
- Identidad y Home admin.
- Listados de provincias, materiales, noticias y usuarios cuando no están en modo edición.
- Modal de detalle de comunidad y modales breves de confirmación.

En estos casos alcanza con quitar la card exterior del módulo en mobile, reemplazar cards por filas con separadores y mantener una sola superficie visible.

## Patrón visual común recomendado

Antes de corregir pantallas individualmente, conviene definir dos composiciones compartidas.

### `AdminModuleScreen`

- Ocupa todo el ancho disponible en mobile.
- Encabezado con volver, título y acción principal opcional.
- Un solo `ScrollView` vertical.
- Padding horizontal de 12 a 16 px.
- Sin borde, radio ni sombra exterior en mobile.
- En escritorio puede usar ancho máximo y una sola superficie.

### `FullScreenEditor`

- Pantalla o modal full screen bajo safe areas.
- Título, cerrar/volver y estado de guardado.
- Campos a una columna debajo de 480 px.
- Secciones separadas por título, espaciado o divisor; no por cards anidadas.
- Acción primaria visible al final y, cuando sea necesario, barra inferior fija.
- Confirmación antes de descartar cambios.
- Sin `ScrollView` vertical dentro del scroll del editor.

Regla general: un formulario largo no debe estar dentro de una fila, un dropdown ni una card de listado.

## Orden recomendado de corrección

### P0 - Recuperar ancho común

1. Separar la navegación del Panel Dirigencial del cuerpo del módulo activo.
2. Implementar `AdminModuleScreen` y `FullScreenEditor`.
3. Definir comportamiento mobile: máximo dos superficies visibles y una sola para formularios largos.
4. Hacer que inputs y grupos usen `minWidth: 0` y una columna bajo 480 px.

### P1 - Flujos críticos

1. Comunidades.
2. Usuarios.
3. Listas QR.
4. Período Motivador y Eventos.
5. Contenido General.

### P2 - Contenido y comunicación

1. Descargas/Materiales.
2. Noticias.
3. Buzón.
4. Proceso Educativo.

### P3 - Simplificación visual

1. Asesores.
2. Configuración general.
3. Contenido Publicado.
4. Provincias, Identidad y Home admin.
5. Modales breves y listados restantes.

## Reglas para futuras pantallas

- Máximo dos superficies visibles entre la pantalla y el contenido interactivo.
- Un editor de más de ocho controles se abre full screen.
- No colocar una card alrededor de un componente que ya dibuja su propia card.
- No abrir formularios largos dentro de filas de lista.
- Un solo scroll vertical principal por pantalla.
- En mobile, preferir separadores y espaciado sobre borde + radio + sombra.
- Los modales centrados son para lectura breve, confirmación o formularios cortos.
- Validar al menos 320 px, 360 px y 412 px, con fuente normal y aumentada.
- Probar teclado abierto, listas largas, modo oscuro y textos extensos.

## Validación pendiente para las issues de implementación

Esta issue no autoriza rediseño ni compilación de APK. Después de implementar el patrón común, cada tanda debe validarse en Android real con:

- ancho equivalente a celular chico;
- teclado abierto y cerrado;
- scroll desde el primer campo hasta Guardar;
- foco en inputs de la parte inferior;
- modo claro y oscuro;
- fuente del sistema normal y aumentada;
- ausencia de scroll vertical anidado o contenido cortado.

## Criterio de cierre de la auditoría

La auditoría identifica el patrón repetido que origina la pérdida de espacio, clasifica las pantallas prioritarias, separa editores que requieren full screen de ajustes visuales menores y propone un patrón común antes de cualquier rediseño pantalla por pantalla.
