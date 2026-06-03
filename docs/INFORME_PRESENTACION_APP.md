# Informe de presentación - Palestra App

## 1. Presentación general

Palestra App es una aplicación móvil desarrollada para acompañar la vida institucional, comunitaria y formativa del movimiento católico Palestra en Argentina.

El proyecto nace como una APK inicial, pero su evolución actual permite presentarlo como una plataforma móvil integral para comunicación, organización, identidad, formación y gestión interna del movimiento.

La app busca centralizar en un solo espacio aquello que hoy suele estar disperso entre grupos de mensajería, archivos sueltos, redes sociales, documentos locales, responsables particulares y comunicaciones informales.

Su valor principal no está solamente en mostrar información, sino en ordenar la vida digital del movimiento con una lógica pastoral, comunitaria y dirigencial.

## 2. Propósito institucional

El propósito de Palestra App es ofrecer una herramienta común para:

- Fortalecer la comunicación entre comunidades, provincias y equipos nacionales.
- Facilitar el acceso a materiales formativos y documentos internos.
- Ordenar noticias, agenda, avisos y actividades.
- Acompañar la vida de comunidad y la perseverancia.
- Dar visibilidad a las comunidades activas.
- Organizar usuarios según roles y responsabilidades.
- Permitir una gestión más clara de contenidos, permisos y participación.

La app está pensada para servir al movimiento, no para reemplazar la vida comunitaria presencial. Su función es acompañar, ordenar y potenciar lo que Palestra ya vive en sus comunidades.

## 3. Público destinatario

La aplicación contempla distintos perfiles de uso.

### Visitantes

Personas que todavía no tienen usuario o que ingresan para conocer el movimiento. Pueden acceder a contenido público, información general, historia, contacto y comunidades visibles.

### Palestristas

Usuarios registrados que forman parte del movimiento y pueden acceder a contenido básico según su estado, provincia, comunidad y permisos.

### Sedimentadores

Miembros que ya realizaron PM y pueden acceder a secciones internas, materiales o contenidos más específicos del proceso de perseverancia.

### Dirigentes comunitarios y provinciales

Animadores, coordinadores de comunidad, vocales, asesores y coordinadores diocesanos. Pueden acceder a herramientas de gestión según su alcance y permisos.

### Equipo nacional y administración

Roles nacionales y técnicos con capacidad de gestionar contenido, navegación, permisos, usuarios, comunidades, identidad visual y módulos internos.

## 4. Funcionamiento general de la app

La app funciona con una navegación principal por secciones. Cada usuario ve la aplicación según su estado, rol, provincia, comunidad y permisos.

El sistema distingue entre contenido público, contenido privado, contenido comunitario, contenido provincial y contenido nacional.

El usuario puede iniciar sesión, completar o actualizar su perfil, recibir contenido adecuado a su alcance y acceder a módulos dirigenciales si tiene autorización.

La información central se obtiene desde Supabase, mientras que algunos datos base o de respaldo permanecen dentro del código para asegurar continuidad funcional.

## 5. Secciones principales

### Inicio

Pantalla principal de bienvenida. Puede mostrar contenido institucional, novedades, saludo personalizado, identidad visual configurada y accesos relevantes.

### Notilestra

Sección destinada a noticias, agenda, actividades, avisos y comunicación del movimiento. Puede mostrar información pública, provincial, nacional o filtrada según el usuario.

### Materiales

Espacio de descarga o consulta de materiales internos. Está pensado para documentos de formación, subsidios, recursos comunitarios y archivos relevantes.

### Oraciones

Sección orientada a la dimensión espiritual del movimiento. Puede contener textos de oración, recursos devocionales y contenido editable según configuración.

### Cancionero

Espacio para canciones propias o utilizadas en actividades, encuentros, comunidades y retiros.

### Himno

Sección específica para identidad musical o simbólica del movimiento.

### Comunidades

Permite visualizar provincias, comunidades, datos de contacto, lugares de reunión, descripción, imagen, horarios y ubicación cuando está disponible.

### Intenciones

Módulo destinado a la oración comunitaria por intenciones. Puede fortalecer la comunión espiritual entre miembros.

### Historia

Espacio institucional para presentar la historia del movimiento, su identidad, camino recorrido y elementos fundacionales.

### Contacto

Sección para comunicación con responsables o áreas correspondientes. Puede incluir formularios o enlaces configurables.

### PM

Sección vinculada al Período Motivador. El acceso depende del rol del usuario y está orientada a contenidos o actividades internas relacionadas con PM.

### Perfil

Pantalla central del usuario. Permite ver y editar datos personales, comunidad, provincia, rol, estado, foto, solicitudes, perfil público y acceso a herramientas internas cuando corresponda.

## 6. Sistema de usuarios

La app trabaja con autenticación y perfil de usuario.

El usuario puede registrarse, ingresar, confirmar su correo y quedar asociado a un estado dentro del sistema.

Los estados principales son:

- Pendiente.
- Aprobado.
- Bloqueado.

El estado del usuario define si puede acceder plenamente o si debe esperar validación.

## 7. Roles y permisos

La app incorpora una jerarquía de roles que permite representar la estructura real del movimiento.

Roles contemplados:

- Invitado.
- Palestrista.
- Sedimentador.
- Animador de comunidad.
- Coordinador de comunidad.
- Vocal.
- Asesor.
- Coordinador diocesano.
- Vocal nacional.
- Coordinador nacional.
- Administrador.

Cada rol puede tener permisos específicos. Esto permite que no todos vean ni gestionen lo mismo.

Ejemplos de permisos:

- Ver secciones públicas.
- Ver materiales internos.
- Descargar archivos.
- Gestionar comunidad.
- Subir noticias comunitarias.
- Aprobar usuarios.
- Otorgar roles.
- Gestionar pestañas.
- Gestionar contenido.
- Enviar notificaciones.
- Administrar sistema.

Este modelo es una de las fortalezas principales de la app, porque permite crecer sin perder orden institucional.

## 8. Gestión dirigencial

La app incluye herramientas internas para dirigentes y administradores.

Según el rol, un usuario puede acceder a paneles para:

- Gestionar usuarios.
- Revisar solicitudes.
- Aprobar perfiles.
- Gestionar comunidades.
- Publicar o editar noticias.
- Administrar materiales.
- Configurar secciones.
- Revisar mensajes internos.
- Gestionar permisos y etiquetas.
- Crear o administrar provincias y comunidades.
- Modificar identidad visual.
- Preparar notificaciones.

Esta funcionalidad convierte a la app en una herramienta de gestión, no solo de consulta.

## 9. Comunidades y provincias

El módulo de comunidades permite agrupar información por provincia y comunidad.

Puede mostrar:

- Nombre de provincia.
- Región.
- Logo o identidad visual.
- Comunidades activas.
- Dirección.
- Teléfono o contacto.
- Día y horario de reunión.
- Descripción.
- Imagen.
- Coordenadas cuando estén disponibles.

El sistema contempla alcance territorial, de modo que ciertos usuarios pueden ver o gestionar solo su comunidad, su provincia o todo el país, según su rol.

## 10. Contenido dinámico

Una parte importante de la app está diseñada para no depender siempre de recompilar la APK.

El sistema admite contenido remoto y pestañas configurables. Esto permite cambiar textos, secciones o visibilidad desde administración, sin tener que publicar una nueva versión para cada ajuste menor.

Tipos de secciones dinámicas:

- Página simple.
- Biblioteca o archivos.
- Enlaces.
- Imagen con texto.
- Formulario.
- Módulo interno.

Esta capacidad es clave para que la app sea sostenible a largo plazo.

## 11. Noticias, agenda y publicaciones

La app puede mostrar noticias nacionales, provinciales o comunitarias.

También contempla agenda y actividades, permitiendo que los usuarios encuentren información ordenada sobre eventos, fechas importantes, PMs, avisos y novedades.

La búsqueda global permite localizar usuarios, comunidades, materiales, noticias, agenda, PMs, publicaciones y contenido cargado.

## 12. Materiales y biblioteca

La sección de materiales permite organizar recursos descargables o consultables.

Puede ser utilizada para:

- Documentos formativos.
- Subsidios.
- Archivos internos.
- Material de PM.
- Guías para dirigentes.
- Recursos comunitarios.

El acceso puede depender del rol, estado o permiso del usuario.

## 13. Notificaciones

La app incluye integración con notificaciones mediante Expo Notifications.

Puede manejar:

- Notificaciones locales.
- Notificaciones push.
- Registro de dispositivo.
- Avisos relacionados con contenidos o actividades.

Para un funcionamiento completo en producción, deben verificarse configuración externa, canales Android, permisos, proyecto EAS y flujo real de entrega.

## 14. QR y credenciales

El proyecto contempla funciones QR vinculadas a credenciales o listas internas.

Estas herramientas pueden servir para:

- Identificación de usuarios.
- Validación de credenciales.
- Registro de asistencia.
- Listas de actividades.
- Control interno en encuentros o eventos.

Este módulo tiene alto potencial para PMs, encuentros nacionales, actividades provinciales y gestión de asistencia.

## 15. Deep link y confirmación de correo

La app está preparada para recibir enlaces internos con el esquema:

```text
palestra://auth/callback
```

Este mecanismo permite que la app instalada procese confirmaciones o retornos relacionados con el ingreso de usuarios.

Para que funcione correctamente, debe estar alineada la configuración de la APK, el intent filter Android y la configuración externa del servicio de autenticación.

## 16. Identidad visual y personalización

La app permite adaptar colores, nombre de versión, identidad y elementos visuales desde configuración.

Esto permite que la aplicación mantenga una identidad institucional, pero también pueda evolucionar visualmente sin modificar todo el código.

## 17. Valor pastoral y comunitario

La app tiene valor porque puede ayudar a resolver problemas reales del movimiento:

- Información dispersa.
- Falta de acceso rápido a materiales.
- Dificultad para ubicar comunidades.
- Comunicación informal y fragmentada.
- Pérdida de continuidad entre gestiones.
- Falta de registro claro de roles y responsabilidades.
- Necesidad de herramientas para actividades y PMs.

Bien implementada, puede convertirse en una memoria viva y operativa del movimiento.

## 18. Estado técnico actual

El proyecto está construido con una base moderna y funcional:

- Expo.
- React Native.
- TypeScript.
- Supabase.
- EAS Build.

El estado actual es apto para beta interna, pruebas controladas y evolución gradual.

Sin embargo, antes de una publicación amplia se recomienda ordenar técnicamente el proyecto.

## 19. Riesgos actuales

### Concentración de lógica en archivos grandes

`App.tsx` y `ProfileScreen.tsx` concentran demasiadas responsabilidades. Esto dificulta mantenimiento y aumenta el riesgo de romper funcionalidades al hacer cambios.

### Dependencia fuerte de Supabase

La app depende de tablas, funciones remotas, políticas y configuración externa. Es necesario documentar bien ese contrato.

### Seguridad dependiente de reglas externas

Los controles del frontend no deben considerarse seguridad suficiente. La seguridad real debe verificarse en la base de datos y funciones remotas.

### Falta de documentación técnica completa

El README anterior describía un MVP inicial, pero la app ya tiene muchas más funciones. Es necesario mantener documentación actualizada.

### Falta de checklist formal de pruebas

Para avanzar sin romper la app, conviene tener una checklist manual de QA antes de cada build importante.

## 20. Mejoras recomendadas

### Mejoras de corto plazo

1. Documentar línea base técnica.
2. Actualizar documentación del proyecto.
3. Crear checklist manual de pruebas.
4. Documentar contrato Supabase.
5. Auditar permisos y roles.
6. Limpiar imports no usados.
7. Separar hooks desde `App.tsx`.
8. Extraer drawer y modal de búsqueda como componentes.

### Mejoras de mediano plazo

1. Modularizar `ProfileScreen.tsx` por paneles.
2. Optimizar búsqueda global.
3. Mejorar manejo de errores remotos.
4. Agregar pantallas de carga específicas.
5. Ordenar módulos administrativos.
6. Crear documentación de flujo de usuarios.
7. Validar notificaciones en APK real.
8. Validar deep links en APK real.

### Mejoras de largo plazo

1. Publicación formal en Play Store.
2. Módulo completo de eventos y asistencia.
3. Sistema de estadísticas dirigenciales.
4. Panel web administrativo complementario.
5. Integración con calendario.
6. Mejoras de accesibilidad.
7. Modo offline parcial para materiales importantes.
8. Auditoría completa de seguridad.
9. Migraciones versionadas de Supabase.
10. Sistema de backups y trazabilidad administrativa.

## 21. Propuesta de roadmap

### Etapa 1 - Estabilización

Objetivo: asegurar que la app actual no se rompa.

Acciones:

- Registrar estado técnico inicial.
- Correr typecheck.
- Crear checklist QA.
- Documentar configuración y Supabase.
- Actualizar README.

### Etapa 2 - Orden interno

Objetivo: reducir complejidad sin cambiar comportamiento.

Acciones:

- Extraer lógica de tema.
- Extraer puntero táctil.
- Extraer carga inicial.
- Extraer sesión y enlaces internos.
- Extraer búsqueda global.
- Extraer navegación local.

### Etapa 3 - Componentización

Objetivo: reducir archivos grandes.

Acciones:

- Extraer drawer.
- Extraer modal de búsqueda.
- Dividir ProfileScreen por paneles.
- Centralizar mensajes repetidos.

### Etapa 4 - Validación funcional

Objetivo: probar en entorno real.

Acciones:

- Probar APK en Android.
- Probar login y registro.
- Probar confirmación por enlace.
- Probar roles y permisos.
- Probar notificaciones.
- Probar QR.
- Probar edición de contenido.

### Etapa 5 - Preparación institucional

Objetivo: presentar la app como herramienta formal.

Acciones:

- Preparar demo guiada.
- Definir usuarios piloto.
- Definir responsables de contenido.
- Definir política de administración.
- Definir criterios de publicación.
- Recibir feedback de comunidades y secretariados.

## 22. Resultados esperados

Con una implementación ordenada, la app puede lograr:

- Mejor comunicación interna.
- Acceso más simple a materiales.
- Mayor sentido de pertenencia.
- Registro más claro de comunidades.
- Administración más ordenada de usuarios y roles.
- Reducción de información dispersa.
- Mayor continuidad entre gestiones.
- Mejor preparación de actividades, PMs y encuentros.

## 23. Conclusión

Palestra App ya no debe entenderse solo como una prueba técnica. El proyecto tiene una estructura funcional amplia y una visión institucional concreta.

Su mayor fortaleza es que traduce la organización real del movimiento en una herramienta digital: comunidades, provincias, roles, permisos, noticias, materiales, perfiles, PM, oración, contacto y gestión.

El siguiente paso no debería ser agregar funciones sin orden, sino consolidar lo que ya existe, documentarlo, probarlo y modularizarlo para que pueda crecer sin volverse frágil.

La app tiene potencial para convertirse en una herramienta nacional de comunicación, formación y gestión pastoral, siempre que su crecimiento técnico acompañe con prudencia la riqueza institucional que busca servir.
