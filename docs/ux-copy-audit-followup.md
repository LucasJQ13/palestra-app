# UX copy audit follow-up post issues #88-#90

## Objetivo

Auditoria complementaria de textos pendientes despues de las issues #88, #89 y #90. El foco es detectar copys que todavia suenan genericos, frios, tecnicos o poco pastorales, y dejar propuestas listas para implementar en issues separadas.

Alcance aplicado: solo documentacion. No se reemplazaron textos, no se modifico logica, no se tocaron permisos, Supabase ni APK.

## Hallazgos generales

- Todavia existen mensajes de sistema directos como "No se pudo...", "No pude..." y "Necesito permiso..." en pantallas que ve el usuario comun.
- Hay textos con mojibake o perdida de acentos en `APP_MESSAGES`, `profileDisplay`, Auth y algunos flujos administrativos. Ejemplos: `contraseÃ±a`, `aprobaciÃ³n`, `No tenÃ©s`, `operaciÃ³n`.
- Los textos tecnicos de Supabase, Storage, Firebase/FCM y patches SQL deben mantenerse claros, pero con contexto humano y accion concreta.
- Varios empty states dicen solamente que no hay datos. Conviene agregar una salida practica: que hacer ahora, a quien consultar o cuando volver a intentar.
- Algunos mensajes de cuenta y acceso necesitan narrativa masculino/femenino o neutral, especialmente bienvenida, perfil pendiente, perfil aprobado y bloqueado.
- El Buzon, QR, Intenciones y Comunidades ya tienen funcionalidad sensible. Sus mensajes deben evitar sonar a error frio porque aparecen en momentos de uso real.

## Issues de implementacion sugeridas

- `UX-COPY-93`: Auth, registro, recuperacion y estados de cuenta.
- `UX-COPY-94`: Home, Evangelio del Dia y contenido publico.
- `UX-COPY-95`: Mi Comunidad, Comunidades, consultas publicas y Panel Comunitario.
- `UX-COPY-96`: Buzon, notificaciones y mensajes enviados.
- `UX-COPY-97`: Intenciones, QR, Materiales y Periodo Motivador.
- `UX-COPY-98`: Administracion de usuarios y paneles administrativos.
- `UX-COPY-99`: Normalizacion de encoding, acentos y variantes masculino/femenino.

## Auditoria concreta

| Pantalla / modulo | Texto actual | Problema | Propuesta fraterna | Tipo de mensaje | Prioridad | Issue sugerida |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `Mail o contraseÃ±a incorrectos.` | Tiene mojibake y suena seco en un momento de frustracion. | `El mail o la contrasena no coinciden. Revisalos y volve a intentar.` | Error | Alta | UX-COPY-93 |
| Login | `Ingresá tu contraseña.` | Correcto, pero puede ser mas claro y consistente con el resto del flujo. | `Ingresa tu contrasena para continuar.` | Ayuda contextual | Alta | UX-COPY-93 |
| Login | `Ingresá un mail válido.` | Mensaje minimo, sin guia. | `Revisa el mail: necesitamos una direccion valida para seguir.` | Error | Alta | UX-COPY-93 |
| Login | `Ingresando...` | Estado tecnico, poco calido. | `Estamos preparando tu ingreso...` | Estado de cuenta | Alta | UX-COPY-93 |
| Login | `No pude leer tu perfil.` | Habla desde el sistema y no orienta. | `No pudimos preparar tu perfil. Intenta nuevamente en unos minutos.` | Error | Alta | UX-COPY-93 |
| Login | `No hay una sesión real activa. Cerrá e iniciá sesión otra vez.` | Correcto para debug, pero brusco para usuario final. | `Tu sesion necesita renovarse. Cerra sesion e ingresa otra vez.` | Error | Alta | UX-COPY-93 |
| Registro | `Crear cuenta` | Funcional, podria mantener tono de comunidad. | `Unirme a Palestra` | Navegacion | Alta | UX-COPY-93 |
| Registro | `¿Cómo te llamás?` | Bueno, pero requiere variante sin mojibake y consistente. | `Como te llamas?` | Bienvenida | Alta | UX-COPY-93 |
| Registro | `Acerca de ti` | Neutro, algo generico. | `Contanos un poco de vos` | Ayuda contextual | Alta | UX-COPY-93 |
| Registro | `Completá nombre y apellido para continuar.` | Imperativo correcto, pero puede sonar administrativo. | `Necesitamos tu nombre y apellido para crear tu perfil.` | Error | Alta | UX-COPY-93 |
| Registro | `Completá fecha de nacimiento y contacto.` | Falta explicar por que. | `Agrega tu fecha de nacimiento y un contacto para que tu comunidad pueda acompanarte.` | Error | Alta | UX-COPY-93 |
| Registro | `Elegir provincia, comunidad y año de inicio es obligatorio.` | Frio y administrativo. | `Elegi provincia, comunidad y ano de inicio para ubicarte dentro de Palestra.` | Error | Alta | UX-COPY-93 |
| Registro | `El dominio del mail no parece valido.` | Correcto pero tecnico. | `El dominio del mail no parece recibir correos. Revisalo antes de seguir.` | Error | Alta | UX-COPY-93 |
| Registro | `Este mail ya se encuentra registrado.` | Correcto, falta salida. | `Ese mail ya tiene una cuenta. Ingresa o recupera tu contrasena.` | Error | Alta | UX-COPY-93 |
| Registro | `Creando tu registro...` | Aceptable, pero puede ser mas pastoral. | `Estamos preparando tu registro...` | Estado de cuenta | Alta | UX-COPY-93 |
| Perfil pendiente | `Perfil pendiente` | Etiqueta fria para usuario nuevo. | `Tu perfil esta en camino` | Estado de cuenta | Alta | UX-COPY-93 |
| Perfil pendiente | `Pendiente de aprobaciÃ³n` | Tiene mojibake y tono administrativo. | `Pendiente de aprobacion por un dirigente` | Estado de cuenta | Alta | UX-COPY-93 |
| Perfil pendiente | `En caso de no poder confirmar el mail, contactar con un dirigente` | Redaccion seca. | `Si no llega el correo de confirmacion, avisale a un dirigente para que pueda ayudarte.` | Ayuda contextual | Alta | UX-COPY-93 |
| Perfil aprobado | `Aprobado` | Correcto como badge, pobre como mensaje de estado. | `Cuenta aprobada. Ya podes vivir Palestra desde la app.` | Confirmacion | Alta | UX-COPY-93 |
| Perfil aprobado | `Estado actualizado desde Supabase.` | Tecnico para usuario comun. | `Tu estado fue actualizado correctamente.` | Confirmacion | Alta | UX-COPY-93 |
| Perfil bloqueado | `Bloqueado` | Duro si aparece sin explicacion. | `Cuenta detenida temporalmente` | Estado de cuenta | Alta | UX-COPY-93 |
| Perfil bloqueado | `Este usuario está bloqueado. Contactá a un dirigente.` | Mensaje necesario, pero puede ser mas cuidadoso. | `Tu cuenta esta detenida por ahora. Escribi a un dirigente para que podamos acompanarte.` | Advertencia | Alta | UX-COPY-93 |
| Recuperacion contrasena | `Enviar recuperacion` | Seco y sin destino claro. | `Enviar enlace de recuperacion` | Navegacion | Alta | UX-COPY-93 |
| Recuperacion contrasena | `Ingresa un mail valido para enviar la recuperacion.` | Error brusco. | `Escribi un mail valido para enviarte el enlace de recuperacion.` | Error | Alta | UX-COPY-93 |
| Recuperacion contrasena | `Enviando instrucciones...` | Correcto, pero impersonal. | `Estamos enviando las instrucciones a tu correo...` | Estado de cuenta | Alta | UX-COPY-93 |
| Recuperacion contrasena | `No pudimos enviar la recuperacion ahora. Revisa el mail e intenta nuevamente en unos minutos.` | Claro, pero largo y sin tono fraterno. | `No pudimos enviar el enlace ahora. Revisa el mail y volve a intentar en unos minutos.` | Error | Alta | UX-COPY-93 |
| Recuperacion contrasena | `Si el correo esta registrado, recibiras instrucciones para recuperar tu contrasena.` | Correcto por seguridad, puede suavizarse. | `Si ese correo pertenece a una cuenta, te enviaremos los pasos para recuperar el acceso.` | Confirmacion | Alta | UX-COPY-93 |
| Confirmacion email | `No pudimos confirmar el mail` | Mezcla mail/correo y no orienta. | `No pudimos confirmar tu correo todavia` | Error | Alta | UX-COPY-93 |
| Confirmacion email | `Mail confirmado` | Correcto, pero no consistente. | `Correo confirmado` | Confirmacion | Alta | UX-COPY-93 |
| Confirmacion email | `Tu correo fue confirmado correctamente. Ya podés ingresar a Palestra APP.` | Buen mensaje, requiere normalizar acentos y estilo. | `Tu correo fue confirmado. Ya podes ingresar a Palestra APP.` | Confirmacion | Alta | UX-COPY-93 |
| Home | `Ingresar a Palestra` | Correcto, pero puede ser mas de bienvenida. | `Entrar a Palestra` | Navegacion | Alta | UX-COPY-94 |
| Home | `Algunas secciones requieren registro y aprobación de un coordinador.` | Informativo pero administrativo. | `Algunas secciones se habilitan cuando un coordinador aprueba tu registro.` | Ayuda contextual | Alta | UX-COPY-94 |
| Home saludo | `Bienvenido/a a Palestra, {nombre}. Oh Bella Ciao!` | Saludo con frase interna poco clara para usuario nuevo. | `Bienvenido/a, {nombre}. Que este espacio te ayude a caminar con Cristo.` | Bienvenida | Alta | UX-COPY-99 |
| Home saludo masculino | `Bienvenido hno. en Cristo {nombre}, Oh Bella Ciao!` | Requiere narrativa masculina revisada y sin frase confusa. | `Bienvenido, hermano {nombre}. Caminemos juntos en Cristo.` | Bienvenida | Alta | UX-COPY-99 |
| Home saludo femenino | `Bienvenida hna. en Cristo {nombre}, Oh Bella Ciao!` | Requiere narrativa femenina revisada y sin frase confusa. | `Bienvenida, hermana {nombre}. Caminemos juntas en Cristo.` | Bienvenida | Alta | UX-COPY-99 |
| Evangelio del Dia | `Cargando Evangelio del dia...` | Correcto, falta tono y acento. | `Estamos preparando el Evangelio del Dia...` | Estado de cuenta | Alta | UX-COPY-94 |
| Evangelio del Dia | `No pude cargar el Evangelio automatico.` | Habla desde el sistema, no orienta. | `No pudimos cargar el Evangelio automaticamente. Podes intentar de nuevo o revisar la fuente.` | Error | Alta | UX-COPY-94 |
| Evangelio del Dia | `No hay evangelio cargado todavia.` | Empty state seco. | `Todavia no hay Evangelio cargado para hoy. Volve a intentar en unos minutos.` | Empty state | Alta | UX-COPY-94 |
| Mi Comunidad | `Actualizar Mi Comunidad` | Accion clara, pero poco natural. | `Actualizar datos de mi comunidad` | Navegacion | Alta | UX-COPY-95 |
| Mi Comunidad | `No hay miembros cargados.` | Empty state seco. | `Todavia no hay miembros cargados en esta comunidad.` | Empty state | Media | UX-COPY-95 |
| Mi Comunidad | `Sin comunidad asignada` | Correcto, pero puede guiar. | `Comunidad pendiente de asignar` | Estado de cuenta | Alta | UX-COPY-95 |
| Panel Comunitario | `No hay integrantes cargados por ahora.` | Correcto, puede agregar accion. | `Todavia no hay integrantes cargados. Cuando se aprueben perfiles, apareceran aca.` | Empty state | Media | UX-COPY-95 |
| Panel Comunitario | `No hay subsecciones habilitadas para esta provincia por ahora.` | Seco y largo. | `Esta provincia todavia no tiene subsecciones habilitadas.` | Empty state | Media | UX-COPY-95 |
| Panel Comunitario | `Notificar a miembros` | Correcto, falta indicar alcance. | `Enviar aviso a miembros de la comunidad` | Accion administrativa | Media | UX-COPY-95 |
| Comunidades | `No pude acceder a tu ubicacion. Activa el permiso para buscar comunidades cercanas.` | Mensaje util, falta tono y salida clara. | `Para buscar una comunidad cercana necesitamos tu ubicacion. Activala y volve a intentar.` | Error | Alta | UX-COPY-95 |
| Comunidades | `No hay comunidades con coordenadas validas cargadas para calcular distancia.` | Demasiado tecnico para usuario comun. | `Todavia no tenemos ubicaciones cargadas para calcular comunidades cercanas.` | Empty state | Alta | UX-COPY-95 |
| Comunidades | `No hemos encontrado una comunidad cerca de ti dentro de un radio de 5 km.` | Correcto, puede orientar proximo paso. | `No encontramos una comunidad dentro de 5 km. Podes consultar el listado general o escribirnos para ayudarte.` | Empty state | Alta | UX-COPY-95 |
| Comunidades | `No pude obtener tu ubicacion actual.` | Mensaje frio. | `No pudimos leer tu ubicacion actual. Revisá el permiso de ubicacion e intenta nuevamente.` | Error | Alta | UX-COPY-95 |
| Comunidades | `Sin provincia` | Fallback seco. | `Provincia no cargada` | Empty state | Media | UX-COPY-95 |
| Comunidades | `Sin comunidad` | Fallback seco. | `Comunidad no cargada` | Empty state | Media | UX-COPY-95 |
| Consultas publicas | `Enviar consulta` | Correcto. | `Enviar consulta a la comunidad` | Navegacion | Media | UX-COPY-95 |
| Consultas publicas | `Escribi un mensaje antes de enviarlo.` | Correcto, pero puede ser mas amable. | `Escribi tu consulta para que la comunidad pueda responderte.` | Error | Media | UX-COPY-95 |
| Consultas publicas | `No hay consultas en esta bandeja` | Empty state seco. | `No hay consultas pendientes en esta bandeja.` | Empty state | Media | UX-COPY-95 |
| Consultas publicas | `Escribe una respuesta antes de guardar.` | Correcto, falta tono. | `Escribi una respuesta antes de guardarla.` | Error | Media | UX-COPY-95 |
| Buzon | `Buzon de mensajes` | Falta acento y puede ser mas cercano. | `Buzon comunitario` | Navegacion | Media | UX-COPY-96 |
| Buzon | `No hay responsables asignados para tu comunidad actualmente.` | Claro, pero frio. | `Tu comunidad todavia no tiene responsables asignados para recibir mensajes.` | Empty state | Media | UX-COPY-96 |
| Buzon | `Selecciona al menos un usuario destinatario.` | Correcto, pero administrativo. | `Elegí al menos un destinatario para enviar el mensaje.` | Error | Media | UX-COPY-96 |
| Buzon | `No hay destinatarios para el criterio seleccionado.` | Seco, no ayuda a corregir. | `No encontramos destinatarios con esa seleccion. Proba ajustar provincia, comunidad o rango.` | Empty state | Media | UX-COPY-96 |
| Buzon | `Vas a enviar este mensaje a ${total} destinatarios. Confirmas el envio?` | Confirmacion necesaria, falta acento y tono. | `Vas a enviar este mensaje a ${total} destinatarios. Confirmas el envio?` | Confirmacion | Media | UX-COPY-96 |
| Buzon | `Mensaje enviado correctamente` | Correcto, duplicado con otras variantes. | `Mensaje enviado. Quedo disponible para sus destinatarios.` | Confirmacion | Media | UX-COPY-96 |
| Buzon | `Borrador guardado en este dispositivo.` | Util, pero podria aclarar que no se envio. | `Borrador guardado en este dispositivo. Todavia no fue enviado.` | Confirmacion | Media | UX-COPY-96 |
| Buzon | `Respuesta directa no disponible` | Seco. | `Este mensaje no permite respuesta directa.` | Advertencia | Media | UX-COPY-96 |
| Buzon | `Eliminar conversacion` | Accion riesgosa, falta contexto. | `Eliminar conversacion de mi vista` | Accion administrativa | Media | UX-COPY-96 |
| Buzon | `Esta conversacion se eliminara solo de tu vista. Deseas continuar?` | Buen contexto, falta acentos. | `Esta conversacion se eliminara solo de tu vista. Deseas continuar?` | Confirmacion | Media | UX-COPY-96 |
| Intenciones | `Necesitas iniciar sesion con un usuario aprobado para crear intenciones.` | Correcto, algo administrativo. | `Para compartir una intencion necesitas ingresar con una cuenta aprobada.` | Estado de cuenta | Alta | UX-COPY-97 |
| Intenciones | `Escribi una intencion antes de guardarla.` | Correcto, pero puede sonar mejor. | `Escribi tu intencion antes de guardarla.` | Error | Alta | UX-COPY-97 |
| Intenciones | `Necesitas iniciar sesion con un usuario aprobado para rezar por intenciones.` | Repetitivo y largo. | `Para rezar por una intencion necesitas ingresar con una cuenta aprobada.` | Estado de cuenta | Alta | UX-COPY-97 |
| Intenciones | `No hay intenciones disponibles de otros usuarios por ahora.` | Empty state seco. | `Todavia no hay intenciones de otros hermanos para rezar. Podes crear una y abrir camino.` | Empty state | Alta | UX-COPY-97 |
| Intenciones admin | `No hay intenciones publicadas para mostrar.` | Correcto pero seco para moderacion. | `No hay intenciones publicadas para revisar.` | Empty state | Baja | UX-COPY-98 |
| Intenciones admin | `Intencion eliminada y autor notificado.` | Correcto, pero falta tono pastoral. | `La intencion fue removida y el autor recibio el aviso correspondiente.` | Confirmacion | Baja | UX-COPY-98 |
| Intenciones admin | `Se notificara al autor que fue removida por considerarse inadecuada.` | Necesario, pero puede ser mas cuidadoso. | `El autor recibira un aviso indicando que la intencion fue removida por considerarse inadecuada.` | Advertencia | Baja | UX-COPY-98 |
| Materiales | `Solo Vocal Diocesano en adelante puede subir contenido.` | Correcto, pero duro. | `Esta carga esta reservada para rangos dirigenciales habilitados.` | Advertencia | Media | UX-COPY-97 |
| Materiales | `El PDF no puede pesar mas de 15Mb.` | Correcto, falta sugerencia. | `El PDF supera los 15 MB. Proba comprimirlo antes de subirlo.` | Error | Media | UX-COPY-97 |
| Materiales | `No se encontro el archivo de descarga.` | Seco y sin causa posible. | `No encontramos el archivo. Puede haber sido movido o eliminado.` | Error | Media | UX-COPY-97 |
| Materiales | `No se pudo abrir el documento externo.` | Tecnico. | `No pudimos abrir el documento externo. Revisa el enlace o intenta nuevamente.` | Error | Media | UX-COPY-97 |
| Materiales | `Material restringido por rango o permiso.` | Correcto, pero frio. | `Este material esta disponible solo para rangos habilitados.` | Advertencia | Media | UX-COPY-97 |
| Materiales | `Archivo no disponible` | Empty/error seco. | `Archivo no disponible por ahora.` | Error | Media | UX-COPY-97 |
| Noticias | `No pudimos cargar noticias externas en este momento.` | Correcto, puede quedar como tecnico claro. | `No pudimos cargar noticias externas ahora. Volve a intentar en unos minutos.` | Error | Media | UX-COPY-94 |
| Noticias | `Recordatorio guardado y notificacion programada.` | Correcto, duplicable. | `Recordatorio guardado. Te avisaremos en el momento indicado.` | Confirmacion | Media | UX-COPY-96 |
| Noticias | `Recordatorio eliminado y notificacion cancelada.` | Correcto. | `Recordatorio eliminado. Ya no enviaremos esa notificacion.` | Confirmacion | Media | UX-COPY-96 |
| Noticias | `Eliminar entrada` | Correcto pero generico. | `Eliminar noticia o aviso` | Accion administrativa | Baja | UX-COPY-98 |
| Periodo Motivador | `PM guardado.` | Muy seco. | `Periodo Motivador guardado correctamente.` | Confirmacion | Media | UX-COPY-97 |
| Periodo Motivador | `Sin fechas seleccionadas` | Correcto, falta guia. | `Selecciona al menos una fecha para cargar el PM.` | Error | Media | UX-COPY-97 |
| Periodo Motivador | `No tenes permisos para gestionar PM.` | Correcto, pero duro. | `Tu rango no tiene permisos para gestionar Periodos Motivadores.` | Advertencia | Media | UX-COPY-97 |
| QR | `No pude generar la credencial QR. Ejecuta el patch SQL de credenciales en Supabase.` | Tecnico y brusco para usuario comun. | `No pudimos generar tu credencial. Falta revisar la configuracion de credenciales en Supabase.` | Mensaje tecnico que debe mantenerse claro | Alta | UX-COPY-97 |
| QR | `Credencial verificable activa.` | Correcto, puede ser mas claro. | `Credencial verificable lista para validar.` | Confirmacion | Alta | UX-COPY-97 |
| QR | `Tu rango no tiene acceso a Escanear QR.` | Correcto, pero seco. | `Esta herramienta esta reservada para rangos dirigenciales habilitados.` | Advertencia | Alta | UX-COPY-97 |
| QR | `Selecciona una lista QR antes de escanear.` | Correcto. | `Selecciona una lista QR antes de iniciar el escaneo.` | Ayuda contextual | Alta | UX-COPY-97 |
| QR | `Necesito permiso de camara para escanear credenciales.` | Habla desde el sistema. | `Necesitamos permiso de camara para escanear credenciales.` | Error | Alta | UX-COPY-97 |
| QR | `Apunta la camara al QR para validar la lista.` | Correcto, puede ser mas preciso. | `Apunta la camara al QR de la credencial para validar la lista.` | Ayuda contextual | Alta | UX-COPY-97 |
| QR | `Credencial no valida.` | Necesario, pero falta orientacion. | `Credencial no valida. Revisa que sea el QR mas reciente o pedi ayuda a un dirigente.` | Error | Alta | UX-COPY-97 |
| QR | `Validando credencial en Supabase...` | Tecnico para usuario final. | `Estamos validando la credencial...` | Estado de cuenta | Alta | UX-COPY-97 |
| Administracion usuarios | `Solo Administrador puede gestionar contenido publicado.` | Correcto, pero duro. | `Esta accion esta reservada para administradores.` | Advertencia | Baja | UX-COPY-98 |
| Administracion usuarios | `Ingresa un correo valido` | Falta acento y contexto. | `Ingresa un correo valido para continuar.` | Error | Baja | UX-COPY-98 |
| Administracion usuarios | `Ingresa tu nombre completo` | Correcto, falta punto y consistencia. | `Ingresa el nombre completo del usuario.` | Error | Baja | UX-COPY-98 |
| Administracion usuarios | `No se pudo guardar el usuario. Revisa permisos y datos.` | Claro, pero frio. | `No pudimos guardar el usuario. Revisa los datos y tus permisos antes de intentar otra vez.` | Error | Baja | UX-COPY-98 |
| Administracion usuarios | `No pude diagnosticar el usuario.` | Habla desde el sistema. | `No pudimos diagnosticar este usuario.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-98 |
| Administracion usuarios | `No pude reparar el usuario.` | Habla desde el sistema. | `No pudimos reparar el acceso de este usuario.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-98 |
| Administracion usuarios | `No pude liberar el correo.` | Habla desde el sistema. | `No pudimos liberar ese correo.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-98 |
| Administracion usuarios | `Confirmacion final: otorgar Administrador puede cambiar permisos, usuarios y contenido global.` | Necesario, pero puede ser mas claro. | `Confirmacion final: el rango Administrador permite modificar permisos, usuarios y contenido global.` | Advertencia | Baja | UX-COPY-98 |
| Paneles administrativos | `Configuracion remota guardada en Supabase.` | Tecnico, aceptable solo admin. | `Configuracion remota guardada correctamente en Supabase.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-98 |
| Paneles administrativos | `No hay paginas publicadas cargadas desde Supabase.` | Empty tecnico. | `No hay paginas publicadas cargadas desde Supabase todavia.` | Empty state | Baja | UX-COPY-98 |
| Paneles administrativos | `Inventario central para distinguir contenido real de Supabase y contenido base/fallback usado para que la app no quede vacia.` | Correcto pero largo y tecnico. | `Inventario de contenido publicado y contenido base usado cuando Supabase no trae datos.` | Ayuda contextual | Baja | UX-COPY-98 |
| Paneles administrativos | `Biblioteca editable persistida en Supabase.` | Tecnico innecesario. | `Biblioteca editable guardada en Supabase.` | Ayuda contextual | Baja | UX-COPY-98 |
| Paneles administrativos | `Crea y ordena estaciones del camino formativo. El contenido queda guardado en Supabase.` | Bueno, pero puede sonar mas claro. | `Crea y ordena estaciones del camino formativo. Los cambios se guardan en Supabase.` | Ayuda contextual | Baja | UX-COPY-98 |
| Empty states global | `No hay contenido publicado en Supabase para esta sección todavía.` | Expone Supabase al usuario comun. | `Todavia no hay contenido publicado para esta seccion.` | Empty state | Media | UX-COPY-94 |
| Empty states global | `No hay enlaces cargados.` | Seco. | `Todavia no hay enlaces cargados.` | Empty state | Media | UX-COPY-94 |
| Empty states global | `Usuario sin nombre` | Fallback seco. | `Usuario sin nombre cargado` | Empty state | Media | UX-COPY-99 |
| Empty states global | `Descripcion pendiente.` | Correcto, falta acento. | `Descripcion pendiente de cargar.` | Empty state | Media | UX-COPY-99 |
| Errores globales | `No se pudo conectar con Supabase.` | Correcto tecnico, falta accion. | `No pudimos conectar con Supabase. Revisa la conexion e intenta nuevamente.` | Mensaje tecnico que debe mantenerse claro | Media | UX-COPY-99 |
| Errores globales | `No se pudo guardar` | Demasiado generico. | `No pudimos guardar los cambios. Intenta nuevamente.` | Error | Media | UX-COPY-99 |
| Errores globales | `No se pudo completar la operacion.` | Demasiado generico. | `No pudimos completar la accion. Revisa los datos e intenta nuevamente.` | Error | Media | UX-COPY-99 |
| Errores globales | `No tenÃ©s permisos para subir este archivo. RevisÃ¡ tu rango, provincia o ejecutÃ¡ el patch de permisos de materiales.` | Tiene mojibake y mezcla usuario/admin. | `No tenes permisos para subir este archivo. Revisa tu rango, provincia o la configuracion de permisos de materiales.` | Mensaje tecnico que debe mantenerse claro | Media | UX-COPY-99 |
| Errores globales | `No se pudo guardar el archivo en Storage. RevisÃ¡ permisos de Supabase o intentÃ¡ nuevamente.` | Tiene mojibake, pero la info tecnica es util. | `No pudimos guardar el archivo en Storage. Revisa permisos de Supabase e intenta nuevamente.` | Mensaje tecnico que debe mantenerse claro | Media | UX-COPY-99 |
| Exitos globales | `Cambio realizado. ${detail}` | Correcto, pero podria reducir duplicacion. | `Listo. ${detail}` | Confirmacion | Media | UX-COPY-99 |
| Exitos globales | `Mensaje enviado` | Variantes duplicadas. | `Mensaje enviado.` | Confirmacion | Media | UX-COPY-96 |
| Exitos globales | `Reporte enviado para revision.` | Correcto, falta tono. | `Reporte enviado para revision. Gracias por cuidar la comunidad.` | Confirmacion | Media | UX-COPY-96 |
| Notificaciones | `Permiso de notificaciones no habilitado.` | Correcto, pero seco. | `Las notificaciones no estan habilitadas en este dispositivo.` | Advertencia | Media | UX-COPY-96 |
| Notificaciones | `No se pudo inicializar push remoto en esta APK. Revisá la configuración Firebase/FCM.` | Tecnico necesario, falta normalizar. | `No pudimos inicializar push remoto en esta APK. Revisa Firebase/FCM antes de probar en dispositivo.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-96 |
| Notificaciones | `No se pudo activar push remoto en este dispositivo.` | Correcto, falta salida. | `No pudimos activar notificaciones push en este dispositivo.` | Error | Media | UX-COPY-96 |
| Notificaciones | `No pude leer canales Android.` | Habla desde el sistema. | `No pudimos leer los canales de notificacion de Android.` | Mensaje tecnico que debe mantenerse claro | Baja | UX-COPY-96 |

## Textos con narrativa masculino/femenino o neutral

Estos textos no deberian resolverse con una sola cadena fija:

| Modulo | Caso | Recomendacion |
| --- | --- | --- |
| Home | Saludo principal | Mantener variantes `male`, `female` y `neutral`, sin frases internas que confundan a usuarios nuevos. |
| Perfil aprobado | Bienvenida luego de aprobacion | Usar `Bienvenido hermano`, `Bienvenida hermana` o neutral segun preferencia de genero. |
| Perfil pendiente | Espera de aprobacion | Mantener tono de acompanamiento sin prometer tiempos exactos. |
| Perfil bloqueado | Cuenta detenida | Usar texto neutral, cuidadoso y no acusatorio. |
| Credencial | Rango y subrango | Mantener etiquetas con genero cuando corresponda: Animador/Animadora, Coordinador/Coordinadora, Vocal Diocesano/Diocesana. |
| Intenciones | Autor visible/anonimo | Evitar inferir genero si la intencion fue anonima. |

## Textos tecnicos que no conviene alargar demasiado

Algunos mensajes deben seguir siendo claros porque los ve un administrador o indican configuracion real:

- Supabase, Storage, RLS y permisos: mantener el nombre tecnico, pero agregar accion concreta.
- Firebase/FCM y APK: mantener terminos tecnicos solo en diagnosticos de notificaciones.
- QR y credenciales: evitar promesas pastorales largas. El estado debe ser inmediato: valida, invalida, vencida, revocada, sin lista, sin permiso.
- Administracion de usuarios: advertencias de eliminar, liberar correo u otorgar Administrador deben ser directas y con doble confirmacion.
- Materiales: limites de peso y permisos deben ser cortos, visibles y accionables.

## Normalizacion pendiente

Conviene crear una issue dedicada para revisar encoding y acentos antes de reemplazar mas copy. Archivos con evidencia actual:

- `src/lib/appMessages.ts`
- `src/lib/profileDisplay.ts`
- `src/screens/auth/AuthFlow.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/profile/useMailboxController.ts`
- `src/lib/notificationHelpers.ts`

El objetivo no es solo corregir acentos: tambien evitar que nuevas cadenas vuelvan a quedar dispersas. La implementacion posterior deberia centralizar mensajes frecuentes en `APP_MESSAGES` o en helpers de copy por modulo.
