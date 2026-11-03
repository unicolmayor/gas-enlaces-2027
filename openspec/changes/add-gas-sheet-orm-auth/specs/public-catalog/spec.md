## Purpose

Permite consultar públicamente el catálogo académico relacionado y sus enlaces desde GitHub Pages, manteniendo fuera de la respuesta los registros eliminados y los campos administrativos.

## ADDED Requirements

### Requirement: Consultar el catálogo académico público
El sistema SHALL permitir leer facultades, programas, módulos, recursos, enlaces y carpetas relacionadas sin autenticación, y SHALL incluir únicamente registros cuyo `deleted_at` sea vacío o `null`.

#### Scenario: Obtener el catálogo relacionado
- **WHEN** un cliente público solicita el catálogo
- **THEN** la respuesta JSON contiene las relaciones Facultad -> Programa -> Módulo -> Recurso y los `ResourceLinks`/`Folders` asociados

#### Scenario: Excluir registros eliminados
- **WHEN** una fila de cualquiera de las tablas contiene un `deleted_at` no vacío
- **THEN** esa fila y las relaciones que dependan de ella no aparecen en el catálogo público

### Requirement: Cachear lecturas públicas sin consultas N+1
El sistema SHALL construir el catálogo mediante un número acotado de lecturas por hoja, SHALL evitar una lectura de Sheets por relación y SHALL usar cache con TTL corto para solicitudes concurrentes.

#### Scenario: Solicitudes concurrentes al catálogo
- **WHEN** múltiples clientes solicitan el catálogo durante el TTL
- **THEN** las respuestas se sirven desde el agregado cacheado o desde una reconstrucción acotada, sin ejecutar una consulta individual por cada relación

#### Scenario: Cache invalidado después de una escritura
- **WHEN** una operación administrativa modifica una tabla del catálogo
- **THEN** el cache del catálogo se invalida y la siguiente lectura observa los datos persistidos

### Requirement: Mantener separadas las superficies pública y administrativa
El sistema SHALL permitir lectura pública sin JWT, pero SHALL requerir JWT para listar usuarios o ejecutar cualquier escritura administrativa.

#### Scenario: Lectura pública sin token
- **WHEN** un cliente solicita el catálogo sin credenciales
- **THEN** recibe una respuesta JSON exitosa con datos públicos y sin campos administrativos

#### Scenario: Escritura o gestión protegida
- **WHEN** un cliente intenta modificar el catálogo o gestionar usuarios sin un JWT válido
- **THEN** recibe un error JSON `UNAUTHORIZED` y no se modifica ninguna hoja
