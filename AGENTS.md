# Guia para asistentes de IA

Instrucciones practicas para trabajar en `palestra-app` sin romper flujos existentes.

## Antes de editar

1. Leer la issue completa.
2. Revisar `README.md` y los archivos relacionados con el cambio.
3. Comprobar `git status` y conservar cambios ajenos.
4. Identificar el menor conjunto posible de archivos a modificar.

Si la tarea toca Supabase, permisos o autenticacion, revisar tambien:

- `docs/SUPABASE_CONTRACT.md`
- `docs/PERMISSIONS_AUDIT.md`
- `docs/QA_CHECKLIST.md`

## Reglas obligatorias

- Hacer cambios pequenos, verificables y faciles de revertir.
- No reescribir archivos completos cuando alcance una edicion puntual.
- Crear modulos o componentes pequenos antes de seguir sobrecargando archivos grandes.
- Respetar la arquitectura, estilos y helpers existentes.
- Ejecutar `npm run typecheck` antes de finalizar.
- No compilar APK salvo pedido explicito.
- No ejecutar SQL ni modificar configuracion externa salvo pedido explicito.
- No cambiar roles, permisos o seguridad sin una issue dedicada.
- No eliminar fallbacks sin comprobar primero el contrato real de Supabase.
- No agregar dependencias sin una necesidad clara.
- No mezclar refactors ajenos con la tarea actual.

## Archivos sensibles

Editar con especial cuidado:

- `App.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/lib/profiles.ts`
- `src/lib/remoteData.ts`
- `src/lib/permissions.ts`
- `src/lib/sessionAccess.ts`
- `src/lib/roles.ts`
- `app.json`
- `eas.json`

Ocultar una accion en la UI no reemplaza la validacion de seguridad en backend.

## Orden recomendado de issues

Cuando varias issues dependan entre si, avanzar en este orden:

1. Diagnostico, baseline y documentacion.
2. Errores de compilacion o `typecheck`.
3. Extraccion de componentes, hooks y modulos pequenos.
4. Limpieza de imports y duplicaciones.
5. Cambios de UI sin alterar comportamiento.
6. Cambios de datos, Supabase, permisos o autenticacion.
7. Funciones nuevas.

No implementar una issue dependiente antes de completar sus prerequisitos.

## Flujo de trabajo

1. Explicar brevemente el alcance.
2. Leer el codigo afectado antes de decidir.
3. Implementar el cambio minimo.
4. Revisar el diff para detectar cambios accidentales.
5. Ejecutar `npm run typecheck`.
6. Indicar las pruebas manuales relevantes.
7. Commit y push solo cuando el usuario o la issue lo soliciten.

## Reporte final

```text
Resumen:
- Cambio realizado.

Archivos modificados:
- ruta/al/archivo

Validacion:
- npm run typecheck: OK / Fallo / No ejecutado
- Pruebas manuales: ...

Riesgos o pendientes:
- Ninguno / detalle concreto
```

La prioridad es conservar lo que ya funciona. Primero estabilidad, luego modularizacion y finalmente nuevas funciones.
