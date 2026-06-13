# Auditoria UI de botones

Issue de origen: #73  
Fecha del relevamiento: 2026-06-13  
Alcance: inventario y recomendaciones. Este documento no modifica estilos ni flujos.

## Resumen ejecutivo

La aplicacion ya tiene una base visual reconocible, pero no tiene un sistema unico de botones. La mayor parte de las pantallas usa `TouchableOpacity` con combinaciones directas de estilos y texto. Existen familias compartidas utiles, aunque conviven con variantes locales y componentes especializados que repiten las mismas responsabilidades.

Datos del relevamiento:

- 1.415 apariciones de `TouchableOpacity`, `Pressable` o `Button` en `src/` y `App.tsx`.
- 428 apariciones estan en `src/screens/ProfileScreen.tsx`.
- 74 usos de `styles.primaryButton`.
- 73 usos de `styles.secondaryButton`.
- 49 usos de `styles.filterChip`.
- 37 usos de `styles.actionPill`.
- 25 usos de `styles.rowActionButton`.
- `ActionButton` encapsula solo el boton primario y tiene un unico uso renderizado.
- Hay sistemas visuales paralelos en `appStyles.ts`, `communityStyles.ts`, `communityPanelStyles.ts` y `queryStyles.ts`.

El problema principal no es la ausencia de estilos compartidos. Es que los estilos compartidos no expresan una API semantica completa y, por eso, cada modulo vuelve a resolver tamanos, radios, estados, iconos, peligro y modo oscuro.

## Fuentes revisadas

- `src/theme/appStyles.ts`
- `src/theme/designTokens.ts`
- `src/components/ActionButton.tsx`
- `src/components/EditableIntro.tsx`
- `src/components/AppDrawer.tsx`
- `src/components/ExternalNewsCarousel.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/MaterialsScreen.tsx`
- `src/screens/LibrarySectionScreen.tsx`
- `src/screens/IntentionsScreen.tsx`
- `src/screens/CommunitiesScreen.tsx`
- `src/screens/ForumScreen.tsx`
- `src/screens/NotilestraScreen.tsx`
- `src/screens/auth/AuthFlow.tsx`
- `src/screens/profile/MailboxPanel.tsx`
- paneles de `src/screens/profile/`
- pantallas de `src/screens/community/`
- pantallas de `src/screens/queries/`

## Familias actuales

| Familia actual | Uso observado | Diagnostico |
|---|---|---|
| `primaryButton` | Guardar, publicar, abrir herramientas, confirmar y ejecutar procesos | Mezcla acciones primarias de distinto peso. Su `alignSelf: flex-start` obliga a agregar `flexButton` o estilos locales cuando debe ocupar ancho. |
| `secondaryButton` | Cancelar, descargar, subir archivo, eliminar, navegar y alternar paneles | Es la familia mas sobrecargada. Incluye acciones neutrales, utilitarias y destructivas. |
| `actionPill` | Editar, eliminar, cerrar, favoritos, recordatorios y estados | La forma y el margen superior no sirven igual para filas densas, estados y comandos. |
| `rowActionButton` | Editar/eliminar elementos de listas administrativas | Es la base mas cercana a una accion compacta correcta. Necesita estados dark, disabled y loading integrados. |
| `filterChip` | Filtros, seleccion de roles, modos y flags booleanos | Mezcla filtros, seleccion multiple, radios y toggles. El aspecto no comunica siempre el tipo de control. |
| `compactSquareButton` | Herramientas administrativas y QR | El nombre describe forma, no intencion. Puede provocar textos apretados y alturas variables. |
| `smallActionButton` | Subir imagen y acciones de edicion | Duplica parte de `rowActionButton` e `inlineEditButton`. |
| `inlineEditButton` | Abrir/cerrar editores de pagina | Correcto como patron, pero deberia ser una variante compacta/terciaria y no una familia aislada. |
| `iconButtonGhost`, `tinyIconButton`, `iconActionButton`, `modalCloseButton` | Orden, duplicar, borrar, agregar y cerrar | Cuatro implementaciones de boton de icono con tamanos, radios y fondos distintos. |
| `backButton`, `navigationBackButton`, `authBackButton`, `communityPanelStyles.backButton` | Volver | Cuatro tratamientos diferentes para la misma accion global. |
| `dropdownButton`, `authSelectButton`, selectores locales | Abrir listas desplegables | Variantes razonables por contexto, pero falta un componente comun con estados abierto, disabled y error. |
| Botones de Auth | Ingreso y registro | Tienen una identidad visual deliberadamente inmersiva. Deben conservar su superficie propia, compartiendo solo contrato, accesibilidad y estados. |
| Botones de Intenciones | Crear, rezar y Amen | La identidad naranja es valida. Deben implementarse como variantes de marca, no como excepciones completas. |
| Botones Home Gospel/Instagram | Accesos editoriales destacados | Son cards de accion, no botones convencionales. Deben clasificarse como `FeatureAction`. |

## Hallazgos transversales

### P0 - Semantica destructiva insuficiente

Acciones como `Eliminar`, `Borrar`, `Denegar`, `Cerrar tema` o `Quitar` aparecen con frecuencia usando `secondaryButton` o `actionPill`, a veces con el mismo color de una accion segura. Esto reduce la capacidad de anticipar consecuencias.

Recomendacion:

- variante `danger` para eliminacion irreversible;
- variante `dangerGhost` para acciones destructivas compactas;
- confirmacion separada del estilo visual;
- icono `trash-outline` o equivalente cuando corresponda.

### P0 - Perfil y Administracion concentran demasiadas decisiones locales

`ProfileScreen.tsx` contiene 428 controles tactiles y combina casi todas las familias existentes. En una misma herramienta pueden coexistir primarios, secundarios, pills, chips y botones cuadrados sin una regla unica de jerarquia.

Recomendacion:

- abordar este archivo por paneles, no con un reemplazo global;
- migrar primero listas de usuarios, solicitudes, QR, navegacion y contenido;
- impedir que cada nueva herramienta agregue estilos de boton dentro de `ProfileScreen.tsx`.

### P1 - Controles de seleccion representados como botones

`filterChip` se utiliza para:

- filtrar contenido;
- seleccionar un unico valor;
- seleccionar multiples roles;
- activar un booleano;
- representar estado visible/invisible;
- decidir publicar/borrador.

Un mismo aspecto no comunica correctamente todos esos comportamientos.

Recomendacion:

- `FilterChip` para filtros;
- `ChoiceChip` para seleccion unica;
- `MultiSelectChip` con indicador de seleccion;
- `Switch` para booleanos persistentes;
- `SegmentedControl` para opciones mutuamente excluyentes de alta frecuencia.

### P1 - Botones de icono fragmentados

Agregar, cerrar, volver, editar, borrar, mover y duplicar tienen implementaciones distintas. Algunos usan circulos, otros cuadrados redondeados y otros pastillas con texto.

Recomendacion:

- un unico `IconButton`;
- tamanos `sm` 32, `md` 40 y `lg` 48;
- variantes `ghost`, `surface`, `primary` y `danger`;
- `accessibilityLabel` y tooltip web obligatorios;
- area tactil minima de 44 x 44 cuando el contexto lo permita.

### P1 - Modo oscuro aplicado por combinacion manual

Muchos botones requieren agregar `isDark && styles.*Dark` en cada uso. Esto ya produjo inconsistencias y hace probable que vuelvan a aparecer.

Recomendacion:

- resolver colores dentro del componente mediante `useAppTheme`;
- no exponer una variante `Dark` al consumidor;
- definir tokens de estados `pressed`, `disabled`, `danger`, `focus` y `border`.

### P1 - Tamanos y radios no siguen una escala unica

Se observaron alturas entre 34 y 72 px y radios entre 6 y 24 px para acciones comparables. Los modulos Comunidad y Consultas usan radios de 6 u 8 px, mientras el sistema general usa 12, 16, 18 o 22 px.

Escala recomendada:

- compacto: 36 px;
- estandar: 44 px;
- prominente: 52 px;
- icono: 40 o 44 px;
- radio compacto: 8 px;
- radio estandar: 12 px;
- radio destacado: 16 px;
- `pill` solo para chips, estados o acciones breves.

### P2 - Estados incompletos

El estado disabled suele depender solo de `opacity`. No existe un tratamiento comun para:

- loading;
- pressed;
- focus web;
- disabled con contraste accesible;
- icono durante carga;
- ancho estable mientras cambia la etiqueta.

### P2 - Etiquetas largas y ancho variable

Hay acciones con textos extensos dentro de botones compactos, por ejemplo herramientas administrativas, exportaciones y seleccion de alcance. Esto puede producir saltos de linea o botones de distinta altura.

Recomendacion:

- acciones breves en la fila;
- explicacion fuera del boton;
- menu contextual para mas de tres acciones secundarias;
- ancho y altura estables en barras de herramientas.

## Mapa por pantalla

| Pantalla o modulo | Botones actuales | Tipo real | Problema principal | Componente recomendado | Prioridad |
|---|---|---|---|---|---|
| Home | accesos rapidos, Evangelio, Instagram, editar/eliminar noticias | navegacion, feature action, acciones de fila | accesos editoriales usan estilos propios y editar/eliminar usan pills equivalentes | `FeatureAction`, `IconButton`, `RowAction` | P2 |
| Perfil personal | editar perfil, guardar/cancelar, QR, ajustes, menus | primario, secundario, icono, menu | demasiadas familias en una misma superficie; QR usa pills para comandos | `Button`, `IconButton`, `MenuButton`, `Toolbar` | P0 |
| Perfil publico | cerrar modal | icono | comparte intencion con otros cierres pero no contrato comun | `IconButton variant="surface"` | P1 |
| Administracion | herramientas, guardar, editar, eliminar, habilitar | tabs, primario, compacto, peligro | mayor densidad y jerarquia inconsistente; textos largos | `ToolGrid`, `Button`, `RowAction`, `OverflowMenu` | P0 |
| Usuarios | crear/listar/editar, confirmar mail, diagnostico, eliminar | herramientas, fila, peligro | acciones criticas compiten visualmente; eliminar no siempre parece destructivo | `ToolMenu`, `RowAction`, `DangerButton` | P0 |
| Solicitudes | pendientes/resueltas, aprobar/denegar | tabs, primario, peligro | denegar se presenta como secundario neutral | `SegmentedControl`, `Button`, `DangerGhostButton` | P0 |
| Listas QR | crear/actualizar, marcar todos, compartir, editar/eliminar | toolbar, seleccion, fila | botones cuadrados con texto, pills para eliminar y chips con multiples semanticas | `Toolbar`, `CheckboxAction`, `RowAction`, `MultiSelectChip` | P0 |
| Buzon | nuevo, actualizar, tabs, enviar, responder, reportar | toolbar, tabs, primario, ghost | la accion enviar y las utilidades no siempre conservan jerarquia; reportes tienen sistema local | `Toolbar`, `SegmentedControl`, `IconButton`, `Button` | P1 |
| Chat/hilo | volver, enviar, reportar | icono, primario, terciario | enviar puede variar de ancho; volver tiene otra variante | `IconButton`, `Button size="standard"`, `LinkButton` | P1 |
| Mi Comunidad | iconos header, contactar, ver miembros, panel | icono, compacto, disclosure, primario | estilos locales con radios y alturas diferentes al sistema general | `IconButton`, `DisclosureButton`, `Button` | P1 |
| Panel Comunitario | volver, guardar, cancelar, formato, medios | icono, primario, secundario, toggle | segundo sistema completo de botones; formato necesita estado seleccionado claro | `IconButton`, `Button`, `FormatToggle` | P1 |
| Comunidades | provincias, contacto, ubicacion, Maps, modales | volver, primario, icono | volver y cerrar repiten patrones globales; acciones de contacto y mapa tienen distinto peso | `BackButton`, `IconButton`, `Button` | P1 |
| Descargas | subir, descargar, editar, duplicar, ocultar, borrar | primario, secundario, fila, peligro | cuatro acciones por fila usando pills; borrar no destaca como peligro | `Button`, `OverflowMenu`, `RowAction` | P1 |
| Cancionero | agregar, editar, borrar, volver, subir imagen | icono, fila, volver, secundario | editar/borrar usan iconos pequenos sin contrato accesible comun | `IconButton`, `BackButton`, `Button` | P1 |
| Oraciones | agregar, editar, borrar, volver | icono, fila, volver | mismo problema que Cancionero; debe compartir implementacion | `IconButton`, `BackButton` | P1 |
| Intenciones | crear, rezar, guardar, Amen, cerrar | feature action, primario, icono | identidad correcta pero componentes aislados y textos sin escala comun | `FeatureAction accent="orange"`, `Button`, `IconButton` | P2 |
| Periodo Motivador | abrir mapa | secundario | accion externa puede usar icono y variante comun de enlace | `LinkButton` | P2 |
| Noticias/agenda | tabs, favoritos, recordar, editar/eliminar | filtros, toggles, fila | favoritos/recordar son toggles representados como pills; eliminar no es danger | `SegmentedControl`, `ToggleButton`, `RowAction` | P1 |
| Foro | crear, editar, cerrar, eliminar, responder | primario, secundario, peligro | cerrar y eliminar comparten estilo neutral | `Button`, `DangerGhostButton`, `RowAction` | P1 |
| Secretariado | abrir/cerrar consulta, enviar | disclosure, primario | `actionPill` agrega margen y forma poco adecuada al flujo | `DisclosureButton`, `Button` | P2 |
| Dirigencia | herramientas y filtros por alcance | tool buttons, chips, dropdowns | alta densidad y semantica variable | `ToolGrid`, `ChoiceChip`, `DropdownButton` | P1 |
| Navegacion editable | mover, visibilidad, roles, guardar/restaurar | fila, toggle, seleccion, peligro | sistema visual propio muy decorativo; visibilidad usa boton secundario activo | `RowAction`, `Switch`, `MultiSelectChip`, `DangerGhostButton` | P1 |
| Login/Registro | ingresar, continuar, volver, cerrar, selectores | primario, ghost, icono, dropdown | coherente internamente, pero no comparte estados/accessibility con el resto | `Button` con tema Auth, `IconButton`, `SelectButton` | P2 |
| Consultas publicas | filtros, cerrar, responder | filtro, icono, primario | tercer sistema local con radios de 6 px y sin tokens globales | `FilterChip`, `IconButton`, `Button` | P1 |
| Modales | cerrar, confirmar, cancelar | icono, primario, secundario | cierres de 34, 36, 38 y 42 px; fondos y radios variables | `ModalHeader` con `IconButton` fijo | P1 |
| Menus desplegables | abrir selector, elegir opcion | dropdown, menu item | varias implementaciones sin contrato comun | `DropdownButton`, `MenuItem` | P1 |

## Sistema recomendado

### 1. `Button`

Props sugeridas:

```ts
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost';
  size?: 'compact' | 'standard' | 'prominent';
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};
```

Reglas:

- un solo primario visible por bloque de decision;
- `secondary` para cancelar o alternativa segura;
- `ghost` para utilidad de baja jerarquia;
- `danger` solo para consecuencia destructiva;
- no combinar `fullWidth`, `flexButton` y estilos locales manualmente.

### 2. `IconButton`

Props sugeridas:

```ts
type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  variant?: 'ghost' | 'surface' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
};
```

Debe reemplazar gradualmente:

- `modalCloseButton`;
- `tinyIconButton`;
- `iconButtonGhost`;
- `iconActionButton`;
- iconos locales de Comunidad;
- cierres y flechas propios de modales.

### 3. `RowAction`

Para acciones dentro de listas:

- icono mas etiqueta breve;
- tamano compacto estable;
- variantes neutral y danger;
- sin `marginTop` interno;
- maximo tres acciones visibles; el resto va a `OverflowMenu`.

### 4. `SegmentedControl`

Para opciones mutuamente excluyentes:

- Recibidos/Leidos;
- Pendientes/Resueltas;
- Publico/Desde rango/Solo rango;
- vistas administrativas frecuentes.

No usarlo para seleccion multiple.

### 5. `ChoiceChip` y `MultiSelectChip`

- `ChoiceChip`: un valor entre varios.
- `MultiSelectChip`: roles, permisos o etiquetas multiples.
- indicador visual de seleccion independiente del color.
- estado disabled legible.

### 6. `ToggleButton` o `Switch`

Para:

- visible/invisible;
- habilitado/deshabilitado;
- favorito;
- recordatorio;
- publicar como borrador;
- configuraciones binarias persistentes.

### 7. `FeatureAction`

Para accesos grandes que funcionan como contenido:

- Evangelio del Dia;
- Instagram;
- Crear/Rezar por una intencion;
- accesos destacados equivalentes.

Permite identidad visual sin contaminar el sistema de comandos.

### 8. `BackButton`, `DropdownButton` y `ModalHeader`

Conviene mantenerlos como composiciones pequenas:

- `BackButton` usa `IconButton` o boton ghost compacto;
- `DropdownButton` controla abierto, disabled, error y dark internamente;
- `ModalHeader` incluye titulo y cierre consistente.

## Tokens faltantes

Agregar al sistema de tema antes de una migracion masiva:

- `buttonPrimaryBackground`;
- `buttonPrimaryText`;
- `buttonSecondaryBackground`;
- `buttonSecondaryBorder`;
- `buttonGhostPressed`;
- `buttonDangerBackground`;
- `buttonDangerText`;
- `buttonDisabledBackground`;
- `buttonDisabledText`;
- `buttonFocusRing`;
- `buttonPressedOverlay`;
- alturas `buttonCompact`, `buttonStandard`, `buttonProminent`;
- radios `buttonCompact`, `buttonStandard`, `buttonFeature`;

Los componentes deben consumir `useAppTheme()` y evitar que cada pantalla agregue manualmente estilos `Dark`.

## Orden recomendado de implementacion

### Fase 1 - Fundacion

1. Crear `Button`, `IconButton`, `RowAction` y tokens faltantes.
2. Agregar estados loading, disabled, pressed y focus.
3. Mantener adaptadores temporales para los estilos actuales.
4. Crear pruebas visuales basicas en light/dark y mobile/web.

### Fase 2 - Riesgo alto

1. Usuarios y Solicitudes.
2. Listas QR.
3. Perfil y modales.
4. Administracion de contenido y navegacion.

Objetivo: corregir jerarquia destructiva y reducir densidad.

### Fase 3 - Comunicacion

1. Buzon y Chat.
2. Consultas publicas.
3. Foro.
4. Secretariado.

Objetivo: unificar toolbars, envio, reportes y estados.

### Fase 4 - Contenido

1. Descargas.
2. Cancionero y Oraciones.
3. Noticias y agenda.
4. Comunidades y Panel Comunitario.

Objetivo: reemplazar sistemas locales sin alterar flujos.

### Fase 5 - Identidad especial

1. Intenciones.
2. Evangelio e Instagram.
3. Login/Registro.

Objetivo: conservar identidades propias sobre componentes comunes.

## Reglas para futuras issues

- No crear un estilo nuevo si la diferencia solo es color, tamano o icono.
- No usar `secondaryButton` para eliminar o denegar.
- No usar chips como switches.
- No colocar mas de tres acciones visibles por fila.
- Los botones de solo icono requieren `accessibilityLabel`.
- La etiqueta debe ser verbo + objeto cuando aporte claridad: `Guardar perfil`, `Eliminar usuario`, `Abrir mapa`.
- Evitar textos explicativos dentro del boton.
- No agregar margen externo dentro de un componente reutilizable.
- El modo oscuro debe resolverse dentro del componente.
- Validar ancho de 320 px, viewport movil habitual y escritorio.
- Mantener la logica y los permisos fuera de los componentes visuales.

## Criterio de cierre de la auditoria

Esta auditoria se considera completa porque:

- identifica las familias existentes;
- cuantifica los principales puntos de concentracion;
- clasifica los botones por semantica;
- lista problemas y reemplazos por modulo;
- define prioridades;
- propone componentes reutilizables;
- establece una secuencia de migracion sin refactor masivo inmediato.

