# El alcance de la instalación se explica en un modal, con dibujos

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Extiende C-08

## Qué se hizo

- El párrafo diminuto que comparaba "All repositories" y "Only select repositories" sale del
  banner y pasa a un **modal** (`InstallScopeDialog`), abierto con un botón **More info**
  junto a Connect. El banner queda en una frase y dos botones.
- El modal enseña **una tarjeta por alcance con su ilustración SVG**: en "All repositories",
  todos los repos dentro del marco de cobertura, incluido uno futuro (discontinuo con "+");
  en "Only select repositories", los de después se quedan fuera, apagados. Texto a tamaño
  legible y la opción recomendada marcada.
- `<dialog>` nativo: Esc, foco atrapado y backdrop sin librerías; cierra también al pulsar
  el fondo. Patrón documentado en `docs/design-system.md` → "Modales".
- Tres tests de componente nuevos (abrir/cerrar, click en el fondo, contenido e
  ilustraciones etiquetadas).
