# Mensajes fraternos

La base reutilizable vive en `src/lib/fraternalMessages.ts`. Su propósito es mantener una voz breve y consistente sin repetir condicionales de género en cada pantalla.

## Narrativa

El módulo usa `Session['genderPreference']`, la misma preferencia que ya alimenta saludos y nombres de roles:

- `male`: hermano y formas masculinas.
- `female`: hermana y formas femeninas.
- `null` o `undefined`: redacción neutral, sin inferir género ni usar barras como “bienvenido/a”.

Las funciones aceptan una sesión, un objeto con `genderPreference` o la preferencia directamente.

```ts
fraternalMessages.approvedWelcome(session);
fraternalMessages.registrationReceived(profile.genderPreference);
fraternalMessages.inboxEmpty();
```

Para un caso nuevo que necesite narrativa, se puede reutilizar el selector de variantes:

```ts
narrativeMessage(session, {
  male: 'Te esperamos, hermano.',
  female: 'Te esperamos, hermana.',
  neutral: 'Te esperamos.'
});
```

## Catálogo inicial

| Función | Caso |
| --- | --- |
| `loginWelcome` | Bienvenida neutral antes de conocer la narrativa. |
| `approvedWelcome` | Bienvenida después de la aprobación del perfil. |
| `approvalConfirmed` | Confirmación para quien aprueba un perfil. |
| `profilePending` | Perfil todavía en revisión. |
| `profilePendingTitle` | Título breve y neutral para el estado pendiente. |
| `profileBlocked` | Acceso pausado con orientación para pedir ayuda. |
| `registrationReceived` | Registro recibido y confirmación de correo pendiente. |
| `mailConfirmed` | Correo confirmado. |
| `mailConfirmationFailed` | Enlace de confirmación inválido o vencido. |
| `privateAccessRequired` | Intento de entrar a un espacio privado; acepta una acción breve opcional. |
| `communityEmpty` | Comunidad sin novedades publicadas. |
| `inboxEmpty` | Buzón sin conversaciones. |
| `pastoralSupport` | Acompañamiento breve en momentos sensibles. |

## Reglas de uso

- Usar narrativa solo cuando la preferencia esté disponible; el fallback siempre debe ser neutral.
- Reservar hermano/hermana para bienvenida, aprobación, acompañamiento y oración.
- Mantener fuera de este catálogo los errores técnicos, límites de archivo y estados de seguridad que necesitan precisión específica.
- No concatenar frases largas alrededor del resultado. Cada mensaje debe funcionar por sí mismo.
- Agregar al catálogo únicamente textos compartidos o sensibles a narrativa. Las etiquetas exclusivas de una pantalla pueden permanecer junto a esa pantalla.

## Pilotos implementados

- Cuenta bloqueada en `AuthFlow`: usa `profileBlocked` con la sesión recuperada.
- Registro recibido en `AuthFlow`: usa `registrationReceived` con la narrativa elegida en el registro.

## Adopción de prioridad alta

- Login y confirmación de correo.
- Perfil pendiente, bloqueado y aprobación administrativa.
- Accesos privados de Intenciones y Foro.
- Estados vacíos de avisos comunitarios y Buzón.

El resto del catálogo queda listo para adopción gradual según el plan de `docs/ux-copy-audit.md`; esta issue no realiza una reescritura masiva.
