# La conexión con la App vive en Settings, y el estado se comprueba de verdad

**Fecha:** ver nombre del archivo
**Tipo:** Fix / UI
**Requisitos:** Extiende C-08

## El fallo que lo motiva

Pol pulsó "Connect" con la App **ya instalada**: GitHub lo llevó a *actualizar* la
instalación (elegir "All repositories"), no a crearla. En una actualización GitHub **no**
reemite `installation.created` — manda `installation_repositories`, que no escuchábamos. El
perfil seguía sin `installation_id` y el aviso no se iba.

## Qué se hizo

- **Se escucha `installation_repositories`**: cambiar los repos cubiertos registra la
  instalación (y sirve para recuperar altas perdidas).
- **Comprobación real contra GitHub** (`syncInstallationState`): con el token de usuario se
  consulta `GET /user/installations` y se corrige la marca en los dos sentidos, al abrir
  Settings o la selección. Es la única vía que no depende de que un webhook llegara en su
  momento — repara también las instalaciones anteriores al handler.
- **Settings gana la sección "GitHub App"** (estado + conectar/gestionar + modal de alcances):
  es la casa permanente de la conexión.
- **La selección de repos solo avisa mientras falta**: al conectar, el banner desaparece — allí
  ya no queda nada que hacer — y enlaza a Settings para lo demás.
