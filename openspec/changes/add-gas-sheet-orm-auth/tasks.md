## 1. Estructura y configuración de Apps Script

- [x] 1.1 Crear la estructura de módulos bajo `server/` para configuración, respuestas JSON, router y servicios, y verificar que todos los archivos puedan cargarse con el runtime CommonJS/Apps Script elegido
- [x] 1.2 Documentar y leer `SPREADSHEET_ID`, `JWT_SECRET`, duración del token y límites de paginación desde `PropertiesService`, y verificar que la ausencia de una propiedad requerida produzca un error explícito
- [x] 1.3 Definir el contrato de respuesta JSON (`success`, `error`, código y datos) y verificar casos de éxito, validación y excepción

## 2. SheetORM y modelo Users

- [x] 2.1 Implementar el adaptador de encabezados y conversión fila/objeto, y verificar lectura de registros, filas vacías, hoja inexistente y encabezados inválidos
- [x] 2.2 Implementar operaciones por identificador y validación de campos permitidos, y verificar creación, actualización, búsqueda y ausencia de registros sin modificar filas ajenas
- [x] 2.3 Crear la definición de la hoja `Users` con `id`, identidad, hash de contraseña, estados, `deleted_at` y timestamps, y verificar que el provisionamiento sea idempotente
- [x] 2.4 Implementar la normalización compartida de booleanos y `deleted_at`, y verificar que solo `null` o cadena vacía se traten como no eliminado

## 3. Autenticación JWT

- [x] 3.1 Implementar hashing/verificación de contraseñas con salt por usuario y comparación segura, y verificar que las contraseñas nunca aparezcan en respuestas ni logs
- [x] 3.2 Implementar emisión HS256 usando `JWT_SECRET` y claims `sub`, `iat`, `exp`, issuer y audience, y verificar firma, expiración y duración configurada
- [x] 3.3 Implementar middleware de autenticación para extraer y validar Bearer JWT, consultar la elegibilidad actual del sujeto y verificar rechazos de token ausente, manipulado, expirado o con algoritmo no permitido
- [x] 3.4 Implementar `auth.login` con respuesta genérica para credenciales inválidas, y verificar que usuarios inactivos, bloqueados o con `deleted_at` no reciban token

## 4. API JSON de usuarios

- [x] 4.1 Implementar `users.list` protegido con validación de `page`, `pageSize` y `q`, y verificar límites y errores de parámetros inválidos
- [x] 4.2 Aplicar filtros de elegibilidad, exclusión del usuario autenticado, búsqueda case-insensitive, orden por nombre y transformación sin campos sensibles, y verificar cada combinación con datos de prueba
- [x] 4.3 Implementar paginación y metadatos `total`, `page`, `totalPages` y `data`, y verificar lista vacía con `totalPages: 0`
- [x] 4.4 Conectar `doGet`/`doPost` al router JSON y configurar respuestas CORS compatibles con GitHub Pages sin depender de un preflight `OPTIONS`; verificar solicitudes con `text/plain` y respuestas `application/json`

## 5. Concurrencia, cache y operación

- [x] 5.1 Implementar un servicio de bloqueo con `LockService`, timeout acotado y liberación garantizada en `finally`, y verificar que un lock no adquirido no escriba parcialmente
- [x] 5.2 Envolver todas las mutaciones del ORM y servicios en el lock e invalidar caches después de escrituras, y verificar dos escrituras concurrentes con resultado serializado
- [x] 5.3 Añadir cache TTL corto solo a lecturas permitidas y verificar que `Users` no sirva datos obsoletos después de login, bloqueo o borrado lógico
- [x] 5.4 Documentar despliegue, configuración inicial de la hoja, rotación del secreto y rollback, y verificar el checklist en un entorno de Apps Script de prueba

## 6. Validación integrada

- [x] 6.1 Ejecutar las pruebas unitarias de ORM, normalización, JWT, filtros y LockService y verificar que todas pasen
- [ ] 6.2 Ejecutar una prueba de integración contra una hoja de prueba con `auth.login` y `users.list`, y verificar contratos JSON, estados HTTP y ausencia de campos sensibles

## 7. Catálogo público

- [ ] 7.1 Definir los esquemas de las hojas `Faculties`, `Programs`, `Modules`, `Resources`, `ResourceLinks`, `Folders` y `ResourceFolderLinks`, verificando encabezados, claves foráneas y normalización de `deleted_at`
- [ ] 7.2 Implementar la carga agregada del catálogo con lecturas acotadas por hoja y relaciones en memoria, verificando que no existan consultas N+1
- [ ] 7.3 Implementar cache TTL corto e invalidación al modificar cualquier tabla del catálogo, verificando lecturas concurrentes y datos actualizados después de una escritura
- [ ] 7.4 Exponer la consulta pública del catálogo sin JWT y proteger todas las escrituras/catalogación administrativa con JWT, verificando campos públicos y errores `UNAUTHORIZED`
- [ ] 7.5 Ejecutar pruebas de integración del catálogo contra el Spreadsheet configurado y verificar la cadena facultad-programa-módulo-recurso-enlaces-carpetas
