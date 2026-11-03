## Purpose

Evita que solicitudes concurrentes sobrescriban cambios al escribir en Google Sheets y hace explícito el resultado cuando una operación no puede adquirir el bloqueo.

## ADDED Requirements

### Requirement: Serializar operaciones de escritura
El sistema SHALL adquirir un bloqueo exclusivo antes de cada operación que cree, actualice o elimine filas en Sheets y SHALL liberar el bloqueo en un bloque de finalización.

#### Scenario: Escrituras concurrentes
- **WHEN** dos solicitudes intentan escribir simultáneamente
- **THEN** solo una modifica la hoja a la vez y la siguiente observa el estado persistido por la anterior o espera hasta el tiempo configurado

#### Scenario: Tiempo de espera del bloqueo
- **WHEN** no se obtiene el bloqueo dentro del tiempo configurado
- **THEN** la API devuelve un error JSON explícito de conflicto o servicio temporalmente no disponible y no realiza una escritura parcial
