# Evangelio del Dia automatico

La app queda preparada para actualizar el Evangelio del Dia una vez por dia usando Don Bosco Argentina como fuente inicial.

## Como funciona

1. La app abre el modal de Evangelio desde Home.
2. Busca el registro de hoy en `public.daily_gospel`.
3. Si no existe, llama la Edge Function `fetch-daily-gospel`.
4. La Edge Function lee `https://donbosco.org.ar/home/evangelio`, extrae Evangelio y reflexion, guarda el resultado en Supabase y lo devuelve a la app.
5. La app muestra Evangelio, fuente y boton `Reflexion` cuando hay texto disponible.

La actualizacion no depende de cargar texto manualmente todos los dias. El primer usuario que abra el Evangelio en el dia dispara la carga si todavia no existe cache.

## Pasos manuales necesarios

Ejecutar en Supabase SQL Editor:

```sql
-- archivo local
supabase/patch_daily_gospel.sql
```

Desplegar la funcion desde CMD en la raiz del proyecto:

```cmd
.\node_modules\@supabase\cli-windows-x64\bin\supabase-go.exe functions deploy fetch-daily-gospel
```

## Configuracion

En Panel Dirigencial > Evangelio del Dia:

- `Evangelio activo`: muestra u oculta el boton en Home.
- `Actualizacion automatica activa`: permite que la app busque/cachee el Evangelio diario.
- `Fuente del Evangelio`: por defecto Don Bosco.
- `Fuente de reflexion`: puede ser la misma fuente u otra.
- `Evangelio cargado manualmente`: queda como fallback si la fuente automatica falla o si se desactiva la actualizacion.

## Nota legal

La app muestra fuente y enlace externo. Antes de usar texto completo en una version publica masiva conviene pedir autorizacion a la fuente o usar una fuente con licencia/API clara.

## Sistema propio futuro

Para ser fuente propia, habria que crear una carga interna de calendario liturgico/evangelios por fecha. Eso puede ser manual, importado por lote o gestionado desde Panel Dirigencial. La app ya queda preparada para consumir `daily_gospel` como fuente central.
