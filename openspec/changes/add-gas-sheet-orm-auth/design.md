## Context

El proyecto es un esqueleto sin implementación en `app/` ni `server/`; el runtime objetivo es Google Apps Script como Web App y el consumidor público/admin será una aplicación estática en GitHub Pages. Google Sheets será la persistencia y el contrato de transporte será JSON. Ver [proposal.md](./proposal.md) para la motivación y las especificaciones de esta propuesta para el comportamiento observable.

## Goals / Non-Goals

**Goals:**

- Crear una base backend pequeña, testeable y compatible con `doGet`/`doPost`.
- Centralizar el acceso a hojas mediante encabezados, normalización de valores y errores explícitos.
- Mantener la hoja `Users` como fuente de elegibilidad de acceso.
- Emitir JWT HS256 con secreto almacenado en `PropertiesService`, nunca en el repositorio.
- Permitir solicitudes desde GitHub Pages usando JSON como texto (`text/plain` cuando sea necesario) y respuestas `application/json`.
- Aplicar `LockService` únicamente a escrituras y garantizar liberación con `try/finally`.

**Non-Goals:**

- No construir el frontend Nuxt ni un proveedor de identidad externo.
- No crear permisos por rol o autorización granular por facultad en esta primera entrega.
- No borrar físicamente filas de usuarios; el borrado será lógico mediante `deleted_at`.
- No introducir una base de datos distinta de Google Sheets.

## Decisions

### Contrato de tablas

La hoja `Users` tendrá una fila de encabezados estable, incluyendo `id`, `name`, `email`, `username`, `password_hash`, `is_active`, `is_lock`, `deleted_at`, `created_at` y `updated_at`. El ORM convertirá valores booleanos y fechas de forma explícita, pero conservará los campos desconocidos para permitir evolución controlada.

Se elige encabezado por nombre frente a posiciones fijas porque las columnas pueden reordenarse sin romper el backend. La validación fallará si faltan columnas requeridas para la operación, en lugar de producir registros parcialmente válidos.

### Arquitectura del ORM y handlers

`SheetORM` recibirá el nombre de la hoja y un esquema de columnas; expondrá lectura de todos los registros, búsqueda por `id` y operaciones de escritura. Una capa de servicios aplicará las reglas de usuarios, autenticación, paginación y transformación. Los handlers de `doGet`/`doPost` convertirán la entrada a un comando JSON y devolverán siempre una forma de respuesta `success` o `error`.

Se prefiere un router por `action` (`auth.login`, `users.list`, etc.) dentro de `doPost`, con `doGet` reservado para consultas públicas/compatibles. Esto evita duplicar lógica y evita depender de `OPTIONS`, que Apps Script Web Apps no maneja como un servidor Express convencional.

### Autenticación JWT

El backend usará JWT compacto con HS256, generado mediante las utilidades criptográficas nativas de Apps Script y una clave de `PropertiesService`. El token incluirá `sub`, `iat`, `exp` y una versión de issuer/audience; la validación rechazará algoritmos distintos, firmas inválidas, expiración y sujetos que ya no sean elegibles.

La contraseña se almacenará como hash con salt por usuario y comparación en tiempo constante cuando sea posible. Las credenciales y `password_hash` nunca aparecerán en respuestas. Un error de login será genérico para no revelar si existe el usuario.

### Elegibilidad y borrado lógico

Se normalizarán `is_active`/`is_lock` aceptando los valores booleanos y las cadenas usadas por Sheets (`TRUE`/`FALSE`). Un registro solo estará vivo cuando `deleted_at` sea `null`, cadena vacía o valor equivalente vacío; cualquier otro valor se considera eliminado. La lógica será compartida por login y listado para evitar divergencias.

### Concurrencia y cache

Las lecturas podrán usar `CacheService` con TTL corto para el catálogo público, pero `Users` y cualquier lectura inmediatamente posterior a una escritura deberán invalidar el cache relevante. Todas las mutaciones adquirirán un lock de script con timeout acotado y liberarán el lock en `finally`. Si falla la adquisición, se devolverá un error explícito y no se intentará una escritura parcial.

### Separación pública y administrativa

La API tendrá dos superficies claramente separadas:

- **Pública:** lectura del catálogo `Faculties -> Programs -> Modules -> Resources -> ResourceLinks/Folders`, filtrando registros cuyo `deleted_at` sea vacío o `null`. No requiere JWT y debe devolver únicamente campos de catálogo y enlaces.
- **Administrativa:** autenticación JWT, listado/gestión de usuarios y futuras operaciones de creación, actualización o borrado lógico sobre las tablas. Toda escritura requiere usuario autenticado y `LockService`.

El catálogo se construirá con lecturas por hoja y relaciones en memoria, evitando consultas N+1. Se cacheará como un agregado normalizado con TTL corto; una mutación administrativa invalidará el cache del catálogo. La aplicación Nuxt consumirá la lectura pública desde GitHub Pages y enviará las operaciones administrativas usando el transporte JSON compatible con Apps Script.

## Risks / Trade-offs

- [Riesgo] Sheets no ofrece transacciones multihoja → [Mitigación] cada operación modifica una hoja bajo lock; las operaciones multihoja se diseñan como pasos idempotentes y reportan fallo explícito.
- [Riesgo] El secreto JWT en propiedades puede rotarse y dejar tokens vigentes inválidos → [Mitigación] documentar rotación como operación administrativa y usar expiraciones cortas.
- [Riesgo] Valores escritos manualmente en Sheets pueden tener formatos inconsistentes → [Mitigación] normalización centralizada, encabezados requeridos y validación antes de persistir.
- [Riesgo] Apps Script tiene cuotas y latencia variable → [Mitigación] limitar `pageSize`, usar cache solo donde sea seguro e instrumentar errores con contexto no sensible.
- [Riesgo] GitHub Pages es público y el código admin puede inspeccionarse → [Mitigación] toda autorización se aplica en backend; nunca confiar en ocultar rutas ni secretos del frontend.

## Migration Plan

1. Crear la hoja `Users` con encabezados y cargar usuarios iniciales con hashes generados por el backend.
2. Configurar el secreto JWT y el identificador de Spreadsheet en propiedades de Apps Script.
3. Publicar el Web App con acceso según el modelo operativo elegido y ejecutar pruebas de login, listado y concurrencia.
4. Apuntar el cliente a `/exec` usando el contrato JSON/CORS documentado.
5. Para rollback, desplegar la versión anterior del Web App y conservar la hoja; no eliminar `deleted_at` ni columnas nuevas durante el rollback.
