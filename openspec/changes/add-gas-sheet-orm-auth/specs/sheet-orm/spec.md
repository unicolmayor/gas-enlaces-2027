## Purpose

Proporciona una abstracción estable para tratar hojas de Google Sheets como tablas JSON, con encabezados verificables y operaciones seguras para lecturas y escrituras.

## ADDED Requirements

### Requirement: Mapear una hoja a registros JSON
El sistema SHALL convertir la fila de encabezados y las filas de datos de una hoja configurada en objetos JSON, conservando los nombres de columnas y omitiendo filas completamente vacías.

#### Scenario: Leer una hoja con registros
- **WHEN** se solicita la colección de una hoja existente con encabezados válidos
- **THEN** la API devuelve un arreglo de objetos JSON cuyos campos corresponden a los encabezados de la hoja

#### Scenario: Hoja inexistente o sin encabezados
- **WHEN** se solicita una hoja que no existe o no tiene una fila de encabezados válida
- **THEN** la operación devuelve un error JSON explícito y no devuelve una colección vacía con apariencia de éxito

### Requirement: Consultar y persistir registros
El sistema SHALL permitir localizar registros por identificador y crear, actualizar o eliminar lógicamente registros usando la misma representación de columnas.

#### Scenario: Actualizar un registro existente
- **WHEN** se envía un identificador válido y campos permitidos para actualizar
- **THEN** se modifica la fila correspondiente y la respuesta JSON confirma el registro persistido

#### Scenario: Identificador no encontrado
- **WHEN** se intenta actualizar o eliminar un identificador que no existe
- **THEN** la API devuelve un error JSON con estado de recurso no encontrado y no modifica otras filas
