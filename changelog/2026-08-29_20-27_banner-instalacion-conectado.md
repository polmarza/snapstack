# El aviso de instalación se queda (y recomienda el alcance)

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Extiende C-08

## Qué se hizo

- El banner de la GitHub App ya no desaparece al instalar: pasa a una **línea discreta**
  ("GitHub App connected — manage which repos it covers") que recuerda que **los repos
  añadidos después hay que incluirlos también** en la instalación. Sin esto, quien instaló
  con "Only select repositories" y luego añade un repo no se entera de que ese repo no emite
  webhooks hasta echar en falta las notificaciones.
- La invitación (sin instalar) **explica las dos opciones de alcance** y recomienda
  **"All repositories"** como la de una sola vez, aclarando que snapstack solo lee.
- **Primer test de componente del proyecto** (`install-app-banner.test.tsx`): las dos caras,
  sus enlaces y el caso sin slug. El banner no tiene hooks ni estado, así que se renderiza
  directo con @testing-library/react (ya estaba instalada, sin usar) y cubre lo que el e2e no
  puede por exigir sesión de Clerk.
