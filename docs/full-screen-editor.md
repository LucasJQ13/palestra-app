# Patrón `FullScreenEditor`

Issue de origen: #84  
Caso inicial: edición de comunidades de la Issue #83.

## Propósito

`FullScreenEditor` es el layout compartido para formularios y editores largos en mobile. Evita renderizar un formulario dentro de la cadena de cards del panel que lo abre y deja una sola superficie de edición con todo el ancho disponible.

Ubicación:

```text
src/components/layout/FullScreenEditor.tsx
```

Importación pública:

```tsx
import { FullScreenEditor } from '../components/layout';
```

## Qué resuelve

- `Modal` con `presentationStyle="fullScreen"`.
- Safe areas superior e inferior.
- Header con volver, título, subtítulo y acción opcional.
- Un único `ScrollView` vertical para el contenido.
- Footer fijo opcional para Guardar/Cancelar.
- Cierre con botón o acción nativa de volver en Android.
- Dark mode mediante `AppThemeContext`.
- Teclado iOS mediante `KeyboardAvoidingView`.
- Teclado Android mediante el `adjustResize` configurado en `AndroidManifest.xml`, sin forzar un segundo resize desde React Native.
- Padding horizontal moderado de 16 px.

El componente no conoce formularios, permisos, Supabase ni reglas de negocio.

## API

| Prop | Tipo | Uso |
|---|---|---|
| `visible` | `boolean` | Abre o cierra el modal full screen |
| `title` | `string` | Título principal del editor |
| `subtitle` | `string` opcional | Contexto breve, por ejemplo nombre y provincia |
| `children` | `ReactNode` | Contenido scrolleable del formulario |
| `footer` | `ReactNode` opcional | Acciones persistentes inferiores |
| `headerAction` | `ReactNode` opcional | Acción compacta en el extremo derecho del header |
| `onClose` | `() => void` | Cerrar, cancelar o volver al listado |
| `onShow` | `() => void` opcional | Foco o posicionamiento inicial al abrir |
| `closeAccessibilityLabel` | `string` opcional | Etiqueta accesible del botón volver |
| `keyboardVerticalOffset` | `number` opcional | Ajuste de teclado para integraciones especiales |
| `contentContainerStyle` | `StyleProp<ViewStyle>` opcional | Ajuste puntual del contenido sin crear otra card |
| `footerStyle` | `StyleProp<ViewStyle>` opcional | Ajuste puntual del footer |
| `testID` | `string` opcional | Identificador para pruebas |

## Ejemplo mínimo

```tsx
<FullScreenEditor
  visible={editing}
  title="Editar material"
  subtitle={material.title}
  onClose={cancelEditing}
  footer={(
    <ButtonGroup wrap={false}>
      <AppButton label="Cancelar" variant="secondary" onPress={cancelEditing} />
      <AppButton label="Guardar" onPress={saveMaterial} />
    </ButtonGroup>
  )}
>
  <TextInput value={title} onChangeText={setTitle} />
  <TextInput value={description} onChangeText={setDescription} multiline />
</FullScreenEditor>
```

## Caso validado: Comunidades

`src/screens/profile/community/CommunityEditorFullScreen.tsx` usa el patrón para:

- datos principales;
- subsección;
- ubicación y coordenadas;
- descripción e imagen;
- habilitar, deshabilitar o eliminar según permisos existentes;
- guardar o cancelar y volver al listado.

`CommunityAdminPanel` conserva el listado. Al tocar una comunidad, solo selecciona el registro y abre el editor; el formulario ya no se renderiza dentro de la fila.

## Cuándo usarlo

Usar `FullScreenEditor` si el flujo tiene alguna de estas características:

- más de ocho controles;
- teclado y campos por debajo del primer viewport;
- carga de imágenes o archivos;
- calendarios o selectores largos;
- varias secciones;
- acciones Guardar/Cancelar que deben permanecer claras;
- un formulario que actualmente se expande dentro de una lista o card.

## Cuándo no usarlo

No usarlo para:

- confirmaciones breves;
- mensajes informativos;
- selectores pequeños;
- detalles de solo lectura que entran cómodamente en un modal centrado;
- formularios de dos o tres controles sin scroll.

## Reglas de composición

- No envolver `FullScreenEditor` en otra card visual; el `Modal` ya crea la superficie principal.
- Dentro del editor, separar secciones con títulos, espacio o divisores, no con cards dentro de cards.
- Mantener un solo scroll vertical. Dropdowns extensos deben abrir un selector o modal propio.
- En mobile, apilar inputs a una columna y evitar `minWidth` que supere el ancho disponible.
- Colocar Guardar/Cancelar en `footer` cuando deban permanecer visibles.
- Usar `headerAction` solo para una acción compacta; no convertir el header en una toolbar extensa.
- El estado y las funciones de negocio permanecen en el módulo consumidor.

## Checklist de migración

1. Extraer el formulario a un componente específico de la función.
2. Dejar el listado y la selección en la pantalla original.
3. Abrir `FullScreenEditor` con el registro seleccionado.
4. Conectar `onClose` para descartar/restablecer el borrador según la lógica existente.
5. Conectar las acciones existentes sin cambiar permisos ni persistencia.
6. Verificar 320, 360 y 412 px.
7. Probar teclado, scroll hasta el último campo, Guardar, Cancelar y volver de Android.
8. Probar modo claro y oscuro.

Las migraciones de Usuarios, Materiales, Noticias, PM y otros paneles deben realizarse en issues separadas; esta issue solo establece y valida el patrón común.
