## Why

La aplicación necesita una API JSON ejecutada como Google Apps Script que pueda leer y escribir datos de Google Sheets de forma consistente, sin depender de modelos inexistentes en `server/` o `app/`. También hace falta proteger la información administrativa: solo usuarios activos, no bloqueados y no eliminados deben autenticarse y consultar los recursos, mientras que las escrituras deben serializarse para evitar carreras en Sheets.

## What Changes

- Crear una capa `SheetORM` reutilizable para mapear hojas de cálculo a registros tipados, consultar por encabezados y persistir cambios.
- Definir y provisionar la hoja `Users` como tabla de control de acceso, incluyendo estado activo, bloqueo y `deleted_at`.
- Exponer endpoints JSON para autenticación y consulta paginada de usuarios, con búsqueda por nombre, correo o usuario, exclusión del usuario actual y transformación de la respuesta.
- Exponer un catálogo público de facultades, programas, módulos, recursos, enlaces y carpetas, sin requerir autenticación para lectura.
- Reservar la escritura de las tablas y la gestión de usuarios para la parte administrativa autenticada.
- Emitir y validar JWT desde el backend de Apps Script para proteger las operaciones administrativas.
- Aplicar la regla de registros vivos: `deleted_at` solo se considera eliminado cuando contiene un valor no vacío; vacío o `null` significa no eliminado.
- Crear `LockService` para serializar operaciones de escritura y evitar corrupción por solicitudes concurrentes.
- Establecer un contrato CORS/JSON compatible con GitHub Pages y Apps Script, evitando depender de preflight `OPTIONS`.

## Capabilities

### New Capabilities

- `sheet-orm`: Acceso estructurado y consistente a hojas de Google Sheets como tablas.
- `user-authentication`: Autenticación administrativa mediante la hoja `Users` y JWT.
- `users-api`: API JSON para listar usuarios activos, desbloqueados y no eliminados con paginación y búsqueda.
- `concurrent-sheet-writes`: Serialización de escrituras mediante `LockService`.
- `public-catalog`: Lectura pública del catálogo académico y sus enlaces relacionados.

### Modified Capabilities

- Ninguna; el proyecto no contiene capacidades existentes con requisitos definidos.

## Impact

- Nuevos archivos de backend para Apps Script bajo `server/` y configuración compartida si se requiere.
- Nuevos contratos de datos para la hoja `Users` y para respuestas JSON de autenticación y usuarios.
- Configuración de secretos de Apps Script para la clave JWT; la clave no debe almacenarse en el repositorio.
- El cliente Nuxt/GitHub Pages deberá enviar solicitudes según el contrato JSON/CORS definido.
- Se requerirán pruebas de la capa de persistencia, autenticación, filtrado/paginación y concurrencia.
