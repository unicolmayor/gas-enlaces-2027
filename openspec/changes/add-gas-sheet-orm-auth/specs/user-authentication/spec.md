## Purpose

Protege las operaciones administrativas mediante usuarios gestionados en Google Sheets y tokens JWT emitidos exclusivamente por el backend.

## ADDED Requirements

### Requirement: Autenticar usuarios administradores
El sistema SHALL validar las credenciales contra la hoja `Users` y SHALL rechazar usuarios inactivos, bloqueados o con `deleted_at` distinto de vacío/null.

#### Scenario: Credenciales válidas
- **WHEN** un usuario activo, desbloqueado y no eliminado presenta credenciales correctas
- **THEN** el backend devuelve una respuesta JSON exitosa con un JWT firmado y los datos públicos mínimos del usuario

#### Scenario: Credenciales inválidas o usuario no elegible
- **WHEN** las credenciales son incorrectas o el usuario está inactivo, bloqueado o eliminado
- **THEN** el backend devuelve un error JSON de autenticación sin revelar cuál condición falló ni emitir un token

### Requirement: Validar JWT en endpoints protegidos
El sistema SHALL validar firma, algoritmo, expiración y sujeto del JWT antes de ejecutar cualquier operación administrativa protegida.

#### Scenario: Token válido
- **WHEN** una solicitud protegida incluye un JWT vigente y firmado por el backend
- **THEN** la operación se ejecuta con el usuario identificado en el token

#### Scenario: Token ausente, inválido o expirado
- **WHEN** una solicitud protegida no incluye un token aceptable
- **THEN** el backend devuelve un error JSON de no autorizado y no accede a los datos protegidos
