# Auditoria responsive Android - Issue #32

Fecha: 2026-06-05

## Objetivo

Revisar puntos de responsividad y comportamiento de teclado Android sin tocar Supabase, permisos, roles, navegacion principal ni logica de datos.

## Alcance ejecutado

- Revision de `App.tsx`, `src/theme/appStyles.ts` y pantallas principales con busqueda de:
  - modales,
  - `KeyboardAvoidingView`,
  - `TextInput`,
  - `ScrollView`,
  - anchos/altos rigidos,
  - dropdowns y listas internas.
- Ajustes puntuales de estilos compartidos para reducir problemas en pantallas chicas.
- Ajustes de teclado Android sin alterar consultas ni resultados.

## Cambios aplicados

### Teclado Android

- El contenedor principal de contenido conserva `KeyboardAvoidingView` solo con `padding` en iOS.
- En Android queda sin comportamiento `height`, para evitar ciclos de resize/foco en pantallas con teclado sensible.
- La busqueda global mantiene cierre explicito de teclado al buscar, cerrar o tocar resultado.

### Modales

- `modalOverlay` usa padding horizontal/vertical mas conservador para ganar espacio util en pantallas chicas.
- `modalPanel` reduce levemente padding interno para evitar overflow.
- `modalKeyboardAvoider` y `globalSearchPanel` bajan un poco su altura maxima para que no choquen con safe areas y teclado.
- El scroll de resultados de busqueda global tiene estilo propio y `keyboardDismissMode` para Android/iOS.

### Listas y cards

- Dropdowns compartidos reducen altura maxima para no ocupar toda la pantalla en Android chico.
- Lista de herramientas de usuarios reduce altura maxima.
- Cards internas agregan `minWidth: 0` para evitar que textos largos empujen el layout.
- Titulo/texto de cards permiten shrink para reducir superposiciones.
- Metadatos del modal de comunidad agregan limites de ancho y `minWidth: 0`.

## Pantallas prioritarias cubiertas por estos cambios

- Home / Inicio: contenedor principal y teclado.
- Busqueda global: modal, teclado, resultados y cierre.
- Drawer lateral: revisado; sin cambios en esta tanda.
- Mi Perfil: mejora indirecta por contenedor principal, dropdowns y cards internas.
- Buzon / selector de destinatarios: mejora indirecta por dropdowns compartidos.
- Comunidades: mejora en modal y metadatos.
- Materiales / Notilestra / PM: mejora indirecta por cards y contenedor principal.
- Login / registro: revisado; sin cambios en esta tanda para evitar tocar flujo auth.
- Panel dirigencial: mejora indirecta por dropdowns, cards y teclado.

## Pendiente de prueba manual en APK

Probar en al menos dos Android reales:

1. Abrir Home con fuente normal y aumentada.
2. Abrir busqueda global, escribir, buscar sin resultados y cerrar.
3. Abrir busqueda global varias veces seguidas.
4. Abrir drawer y verificar scroll.
5. Entrar a Mi Perfil, editar perfil y abrir dropdowns.
6. Abrir Buzon, Nuevo mensaje y selector de usuarios.
7. Entrar a Comunidades, abrir modal de comunidad y scrollear.
8. Entrar a Panel Dirigencial y abrir herramientas con listas largas.
9. Probar modo claro y oscuro.
10. Probar con teclado abierto/cerrado.

Registrar:

- modelo del telefono,
- version Android,
- escala de fuente,
- pantalla probada,
- resultado.

## Riesgos

- Al desactivar `height` en `KeyboardAvoidingView` para Android, algunos formularios largos dependen mas del scroll natural. Esto es deseable para evitar bucles de teclado, pero debe validarse en APK real.
- Los ajustes son visuales y compartidos; no cambian datos ni permisos.

