# Baseline tecnica del proyecto

Fecha: 2026-06-03

Issue relacionada: GitHub #2 - Fase 0.

## Objetivo

Registrar el estado tecnico actual de Palestra APP antes de continuar con nuevas extracciones, optimizaciones o refactors.

Este documento no introduce cambios funcionales en la app.

## Entorno usado

- Sistema: Windows / PowerShell.
- Directorio del proyecto: `C:\Users\Juan Carlos\Documents\New project\palestra-app`.
- Node: `v24.16.0`.
- npm: `11.13.0`.
- Version declarada de la app: `0.1.38`.
- Expo SDK declarado: `~54.0.34`.
- React Native declarado: `0.81.5`.

## Estado Git antes de la tarea

Antes de crear este documento habia un cambio local no relacionado:

```text
M ABRIR_APP_LOCAL.cmd
```

Ese archivo no fue modificado ni incluido en esta tarea.

## Comandos ejecutados

### 1. Versiones

```bash
node --version
npm --version
```

Resultado:

```text
v24.16.0
11.13.0
```

### 2. Instalacion de dependencias

```bash
npm install
```

Resultado:

```text
up to date, audited 734 packages in 15s
82 packages are looking for funding
12 moderate severity vulnerabilities
```

Observacion:

- No se corrigieron vulnerabilidades en esta fase porque la issue pide registrar baseline, no cambiar dependencias.
- `npm audit fix` queda pendiente de evaluacion separada.

### 3. Typecheck

```bash
npm run typecheck
```

Resultado:

```text
> palestra-app@0.1.38 typecheck
> tsc --noEmit
```

Estado: correcto. No se detectaron errores TypeScript en esta ejecucion.

### 4. Scripts disponibles

```bash
npm run
```

Scripts principales detectados:

```text
start                  expo start
android                expo start --android
web                    expo start --web
local                  expo start --web --port 8085 --localhost --clear
typecheck              tsc --noEmit
build:apk              npx eas-cli build -p android --profile beta-apk --clear-cache
build:apk:fast         npx eas-cli build -p android --profile beta-apk
build:apk:clean        npx eas-cli build -p android --profile beta-apk --clear-cache
preview:mail-confirmed node scripts/preview-mail-confirmed.js
preview:mail-confirmed:web node scripts/preview-mail-confirmed-web.js
```

### 5. Prueba controlada de arranque Expo

Comando intentado:

```bash
npm run start -- --localhost --port 8095
```

Resultado:

- El proceso no devolvio error antes del timeout controlado.
- Tampoco entrego salida util antes de los 45 segundos.
- Se corto la prueba por timeout para no dejar un servidor corriendo.
- Se detectaron procesos `node` posteriores al intento y fueron cerrados manualmente.

Estado:

```text
Arranque Expo no verificado de forma concluyente desde Codex en esta tanda.
```

Observacion:

- Esto no confirma una falla de Expo.
- Solo indica que la prueba automatizada/controlada no obtuvo salida suficiente antes del timeout.
- Para validacion manual, usar:

```bash
npm run local
```

o, para Expo normal:

```bash
npm run start
```

## Problemas registrados sin corregir

1. Hay `12 moderate severity vulnerabilities` reportadas por `npm install`.
2. `npm run start` no pudo documentarse como exitoso desde la prueba controlada por falta de salida antes del timeout.
3. Existe un cambio local previo en `ABRIR_APP_LOCAL.cmd`, fuera del alcance de esta issue.

## Conclusiones

- Dependencias instaladas: OK.
- TypeScript/typecheck: OK.
- Scripts principales: presentes.
- Arranque Expo: pendiente de validacion manual o con una prueba dedicada mas larga.
- No se modifico logica funcional, navegacion, pantallas, Supabase ni configuracion de build.

