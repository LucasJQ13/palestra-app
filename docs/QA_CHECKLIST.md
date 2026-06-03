# Checklist QA manual para Beta APK

Fecha: 2026-06-03

Issue relacionada: GitHub #5 - Fase 3.

## Objetivo

Tener una lista simple de pruebas manuales para ejecutar desde un celular Android antes y despues de cada cambio importante en Palestra APP.

## Como usar esta checklist

Para cada prueba marcar:

- Estado: `OK`, `Falla`, `Pendiente`.
- Dispositivo: modelo de celular y version Android.
- Build: version visible en header, por ejemplo `BETA 0.1.38`.
- Observaciones: que se vio, donde fallo, captura si aplica.

Formato sugerido:

```text
Estado:
Dispositivo:
Build:
Observaciones:
```

## 1. Arranque de app

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Abrir app instalada | Tocar icono de Palestra APP en Android | La app abre sin pantalla roja, sin crash y muestra Inicio o Login segun sesion | Registrar si tarda demasiado |
| Splash / carga inicial | Cerrar app completamente y volver a abrir | Se ve carga inicial sin quedarse congelada | Verificar logo/animacion si aplica |
| Sesion persistente | Iniciar sesion, cerrar app, abrir de nuevo | El usuario sigue logueado salvo que haya cerrado sesion manualmente | Probar con usuario real |
| Sin conexion | Abrir app con datos/WiFi apagados | La app no crashea; muestra contenido cacheado o error entendible | Volver a activar internet luego |

## 2. Navegacion principal

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Drawer/menu principal | Tocar menu principal | Se abre drawer/menu sin trabarse y permite scroll si hace falta | Verificar mobile chico |
| Volver a Inicio | Tocar logo de Palestra | La app vuelve a Inicio desde cualquier seccion principal | Probar desde Noticias y Perfil |
| Boton atras Android | Entrar en una seccion y tocar atras fisico/gesto | Vuelve a pantalla anterior o cierra modal primero; no sale directo salvo desde Inicio | Anotar comportamiento |
| Cambio de secciones | Ir a Inicio, Noticias, Descargas, Comunidades, Nuestra Historia, Contacto y Perfil | Cada seccion abre y mantiene layout legible | Revisar textos cortados |

## 3. Inicio

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Home como visitante | Abrir app sin sesion | Inicio se ve correctamente y muestra opciones publicas | No debe mostrar herramientas privadas |
| Home como usuario logueado | Iniciar sesion | Muestra saludo dinamico y contenido permitido | Verificar nombre y narrativa |
| Accesos rapidos | Tocar cada acceso rapido visible | Abre la seccion correcta | Registrar links rotos |
| Pull to refresh | Arrastrar hacia abajo | Actualiza sin spinner nativo extra y sin textos molestos | Verificar logo/animacion |
| Evangelio del Dia | Tocar bloque de Evangelio | Abre contenido y permite leer/scroll completo | Probar reflexion si aparece |

## 4. Noticias / Notilestra

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Abrir Noticias | Entrar a Noticias/Notilestra | Feed carga sin error y respeta visibilidad | Probar visitante y usuario |
| Leer noticia | Abrir una noticia | Texto completo se puede leer y copiar si corresponde | Probar links dentro del texto |
| Links en noticias | Tocar un link publicado | Abre navegador o app externa correctamente | No debe crashear |
| Favoritos | Marcar noticia como favorita | Aparece en subpestaña/listado de Favoritos | Cerrar y abrir app para persistencia |
| Recordatorios | Marcar recordatorio | Queda registrado y no se pierde al refrescar | Push/alerta depende configuracion |
| Calendario PM | Abrir calendario con PM cargados | PM aparece en dias correspondientes, sin duplicar cards en feed | Revisar privacidad por rango |

## 5. Descargas / Materiales

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Abrir Descargas | Entrar a Descargas | Materiales visibles cargan sin error | Revisar visitante/usuario |
| Descargar archivo | Tocar un material con archivo | Abre o descarga el recurso | Registrar si Android pide permisos |
| Visibilidad por rol | Comparar visitante vs usuario interno | Solo se ven materiales permitidos | Requiere usuarios de prueba |
| Subida admin | Como admin, seleccionar archivo | No se publica hasta tocar finalizar/guardar si ese flujo esta activo | Confirmar que no haya exito falso |

## 6. Comunidades

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Listado provincias | Entrar a Comunidades | Se ven provincias habilitadas, sin layout roto | Revisar logos |
| Entrar provincia | Tocar una provincia | Muestra subsecciones habilitadas para esa provincia | Jovenes/Adultos/Jovenes Adultos |
| Modal comunidad | Tocar comunidad | Abre modal/popup con detalle, scroll fluido y botones internos | Probar descripcion larga |
| Ubicacion | En modal, tocar icono ubicacion | Abre Maps/ubicacion externa | Registrar si faltan coordenadas |
| Contactar comunidad | En modal, tocar icono mensaje | Abre formulario, teclado no tapa input, mensaje se envia o muestra error claro | Probar visitante y logueado |
| Secretariado provincial | Abrir Secretariado de una provincia | Muestra miembros de esa provincia | Cambiar de provincia debe cerrar el panel anterior |
| Secretariado nacional | Abrir Secretariado Nacional | Muestra rangos nacionales y permite mensaje solo logueado | Verificar genero/rango visible |
| Buscar cercana | Usar Buscar Comunidad cercana | Pide permiso ubicacion y muestra resultado o mensaje claro | Probar con GPS activo |

## 7. Contacto y buzon

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Contacto publico | Entrar a Contacto | Informacion y formulario se ven bien | No debe exponer datos tecnicos |
| Enviar consulta | Completar formulario y enviar | Muestra confirmacion real si se guardo | Probar con internet |
| Buzon en perfil | Abrir Buzon/Mensajes | Lista mensajes sin textos blancos invisibles | Probar modo dark |
| Nuevo mensaje | Elegir destinatario | Selector muestra nombres legibles | Probar busqueda de usuario |

## 8. Perfil

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Ver perfil propio | Abrir Mi Perfil | Avatar, nombre, rango visible y credencial se ven bien | No debe mostrar textos tecnicos innecesarios |
| Editar perfil | Cambiar datos permitidos | Guarda cambios reales y muestra confirmacion | Revisar cooldown si aplica |
| Cambiar foto | Subir foto de perfil | Se actualiza y persiste al reabrir | Probar permiso galeria |
| QR credencial | Abrir QR | QR se ve completo, logo incrustado correcto por provincia/rango | Probar lectura si hay escaner |
| Mi Comunidad | Abrir Mi Comunidad | Muestra avisos, encargados y miembros con scroll si hace falta | Encargados deben cargar sin boton extra |
| Cerrar sesion | Usar menu de perfil y cerrar sesion | Vuelve al nuevo login premium, no al login viejo | Verificar sesion limpia |

## 9. Registro e ingreso

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Ingreso existente | Iniciar sesion con usuario valido | Entra sin errores y respeta rol/status | Probar usuario aprobado |
| Error login | Ingresar clave incorrecta | Muestra error amigable, no tecnico | No debe mostrar JSON |
| Registro nuevo | Completar onboarding multipaso | Crea usuario y perfil con provincia/comunidad/narrativa | Usar mail de prueba |
| Provincia/comunidad | Seleccionar provincia | Comunidad se filtra segun provincia | Listas desplegables legibles |
| Fecha nacimiento | Usar calendario registro | Permite elegir mes/año rapidamente sin saltos visuales | Probar año antiguo |
| Confirmacion mail | Tocar link del correo real | Abre Palestra APP y muestra confirmacion entendible | Verificar Supabase Auth |
| Recuperar clave | Usar recuperacion si esta disponible | Envia email o muestra mensaje claro | No debe romper flujo |

## 10. Deep link de confirmacion

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Preview visual PC | Ejecutar `npm run preview:mail-confirmed:web` | Se ve pantalla de Mail confirmado en navegador | Solo preview visual |
| Deep link Android | Con APK instalada, abrir `palestra://auth/callback?preview=mail-confirmed` | Abre pantalla Mail confirmado en app | Requiere herramienta de URI o link real |
| Link real Supabase | Registrar usuario y tocar correo de confirmacion | No abre localhost; abre app o fallback documentado | Verificar `email_confirmed_at` |

## 11. Perfiles de uso

| Perfil | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Visitante | Usar app sin login | Ve contenido publico, Comunidades, Contacto y Login/Ingresar | No ve herramientas internas |
| Palestrista | Iniciar sesion como usuario comun | Ve perfil, comunidad, noticias/materiales permitidos | No ve panel tecnico |
| Sedimentador | Iniciar como sedimentador | Ve contenido desde su rango y no ve solicitud de perseverancia | Verificar solicitudes |
| Animador/Coordinador comunidad | Entrar a Mi Comunidad y panel dirigencial | Puede publicar avisos de su comunidad segun permisos | No puede gestionar fuera de alcance |
| Vocal/Coordinador diocesano | Entrar Panel Dirigencial | Gestiona usuarios/provincia segun alcance | No ve herramientas exclusivas admin |
| Nacional | Entrar Panel Dirigencial | Ve alcance nacional segun rol | No puede editar administrador |
| Administrador | Entrar Panel Dirigencial | Ve herramientas completas y diagnosticos tecnicos | Verificar que debug no sea visible para otros |

## 12. Edicion de contenido segun permisos

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Editar pagina admin | Como admin, tocar Editar Pagina | Permite editar bloque actual o agregar bloque nuevo | Guardar debe persistir |
| Bloques nuevos | Agregar bloque en una pagina | Se crea card/bloque separado, no se mezcla todo en una card | Refrescar para confirmar |
| Noticias admin | Crear noticia | Publica texto, imagen opcional y links funcionales | Imagen no debe ser obligatoria |
| Comunidades admin | Editar comunidad/provincia/subseccion | Cambios impactan en vista publica | Probar cambiar provincia |
| Identidad admin | Cambiar textos/colores/version visible | Cambia globalmente al refrescar | No debe tapar teclado |
| Navegacion admin | Cambiar visibilidad/orden si esta disponible | Impacta segun permisos sin romper rutas | Probar con usuario comun |

## 13. Avisos y notificaciones

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Permiso notificaciones | Activar notificaciones en Configuracion | Android pide permiso y app guarda token | Verificar token solo en diagnostico admin |
| Notificacion local | Usar prueba local si existe | Llega notificacion al dispositivo | Confirmar canal Android |
| Push remoto individual | Usar prueba push admin si existe | Llega push real a APK instalada | Requiere FCM/EAS configurado |
| Notificar noticia | Publicar noticia con Notificar usuarios activo | Crea envio/intencion y llega a usuarios alcanzados | Verificar alcance por rol/provincia |
| Aviso comunitario | Publicar aviso con Notificar miembros activo | Miembros de comunidad ven aviso y reciben notificacion si corresponde | No mostrar exito falso |
| Recordatorio | Crear recordatorio de evento | Debe conservarse y avisar segun configuracion | Probar al menos persistencia |

## 14. Dark mode y responsive

| Prueba | Accion | Resultado esperado | Observaciones |
|---|---|---|---|
| Cambiar tema | Activar Dark Mode | Transicion termina sin overlay pegado | Verificar legibilidad |
| Textos dark | Recorrer secciones principales | No hay texto azul oscuro sobre fondo oscuro ni cards blancas fuertes | Capturar fallas |
| Teclado Android | Editar inputs largos | Teclado no tapa el campo activo | Probar Identidad y Contacto |
| Mobile chico | Probar en pantalla chica | No hay botones superpuestos ni textos verticales | Especialmente Crear Provincias |
| Tablet/web | Probar viewport amplio si aplica | Layout no queda roto ni excesivamente estirado | Localhost puede diferir de APK |

## 15. Cierre de prueba

Al terminar una ronda QA, registrar:

```text
Fecha:
Build:
Dispositivo:
Usuario/profiles probados:
Issues detectadas:
Capturas adjuntas:
Resultado general: Aprobada / Aprobada con observaciones / Bloqueada
```

## Criterio para considerar Beta testeable

La Beta puede considerarse lista para prueba comunitaria interna si:

- abre sin crash,
- login/registro funcionan,
- confirmacion de mail no queda en localhost,
- navegacion principal no se rompe,
- Comunidades y Perfil son usables,
- Admin puede publicar/editar contenido clave,
- notificaciones no muestran errores tecnicos a usuarios normales,
- no hay textos invisibles o modales imposibles de cerrar.

