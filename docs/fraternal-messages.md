# Sistema central de copy fraterno

El modulo principal es `src/lib/appMessages.ts`. Su objetivo es evitar frases largas duplicadas y mantener tres tonos claros:

- `functional`: errores, permisos y acciones criticas.
- `fraternal`: confirmaciones frecuentes y mensajes breves de acompanamiento.
- `pastoral`: bienvenida, perfil pendiente, comunidad y momentos sensibles.

## Helpers principales

```ts
fraternalTreatment(session.genderPreference);
fraternalWelcomeMessage(session, 'pastoral');
accountStatusMessage(session.status, session.genderPreference, 'fraternal');
pendingProfileMessage(session.genderPreference, 'pastoral');
blockedProfileMessage(session.genderPreference, 'functional');
emptyStateMessage('community', session.genderPreference, 'fraternal');
accessRequiredMessage('qr', session.genderPreference, 'functional');
actionDoneMessage('Perfil guardado', session.genderPreference, 'fraternal');
```

## Ejemplos de uso

```ts
setAuthMessage(APP_MESSAGES.auth.invalidEmail);
setAuthMessage(blockedProfileMessage(session.genderPreference, 'pastoral'));
setMessage(emptyStateMessage('mailbox', session.genderPreference, 'functional'));
setStatus(actionDoneMessage('Cambios guardados', session.genderPreference, 'fraternal'));
```

## Regla practica

Si el texto se usa en mas de una pantalla, debe vivir en `APP_MESSAGES` o en un helper de este modulo. Si el texto depende de genero, estado de cuenta o tono pastoral, debe pasar por un helper y no escribirse directo en el componente.
