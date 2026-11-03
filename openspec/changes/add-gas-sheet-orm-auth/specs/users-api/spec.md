## Purpose

Ofrece una consulta JSON paginada y buscable para que la administración liste usuarios elegibles sin exponer registros eliminados, bloqueados o la identidad del usuario actual.

## ADDED Requirements

### Requirement: Listar usuarios elegibles
El endpoint JSON de usuarios SHALL devolver únicamente usuarios activos, no bloqueados, con `deleted_at` vacío o null y distintos del usuario autenticado.

#### Scenario: Consulta paginada sin búsqueda
- **WHEN** un usuario autorizado solicita la lista sin `q`
- **THEN** la respuesta contiene `total`, `page`, `totalPages` y `data`, ordena por nombre y respeta `page` y `pageSize`

#### Scenario: Búsqueda por campos de usuario
- **WHEN** un usuario autorizado envía `q`
- **THEN** `data` contiene los registros cuyo nombre, correo o nombre de usuario incluye el término sin distinguir mayúsculas y minúsculas

### Requirement: Responder en JSON con errores explícitos
El endpoint SHALL devolver JSON tanto en éxitos como en errores, con estados y mensajes consistentes, y SHALL devolver una lista vacía con metadatos cuando no haya coincidencias.

#### Scenario: Sin coincidencias
- **WHEN** los filtros no encuentran usuarios elegibles
- **THEN** la respuesta exitosa contiene `total: 0`, `totalPages: 0` y `data: []`

#### Scenario: Parámetros inválidos
- **WHEN** `page` o `pageSize` no son números enteros positivos dentro de los límites configurados
- **THEN** el backend devuelve un error JSON de solicitud inválida y no ejecuta una paginación ambigua
