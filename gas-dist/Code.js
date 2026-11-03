(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // server/errors.js
  var require_errors = __commonJS({
    "server/errors.js"(exports2, module2) {
      var AppError = class extends Error {
        constructor(status, code, message, details) {
          super(message);
          this.name = "AppError";
          this.status = status;
          this.code = code;
          this.details = details;
        }
      };
      module2.exports = { AppError };
    }
  });

  // server/config.js
  var require_config = __commonJS({
    "server/config.js"(exports2, module2) {
      var { AppError } = require_errors();
      var DEFAULT_PAGE_SIZE = 10;
      var DEFAULT_MAX_PAGE_SIZE = 100;
      var DEFAULT_TOKEN_TTL_SECONDS = 3600;
      function getProperties(properties) {
        if (properties && typeof properties.getProperty === "function") return properties;
        if (typeof PropertiesService !== "undefined") return PropertiesService.getScriptProperties();
        return {
          getProperty(name) {
            return process.env[name] || null;
          }
        };
      }
      function readConfig(properties) {
        const source = getProperties(properties);
        const required = ["SPREADSHEET_ID", "JWT_SECRET"];
        const values = {};
        required.forEach((name) => {
          values[name] = source.getProperty(name);
          if (!values[name]) throw new AppError(500, "CONFIGURATION_ERROR", `Missing required property: ${name}`);
        });
        const numberProperty = (name, fallback, minimum) => {
          const raw = source.getProperty(name);
          const value2 = raw === null || raw === "" ? fallback : Number(raw);
          if (!Number.isInteger(value2) || value2 < minimum) {
            throw new AppError(500, "CONFIGURATION_ERROR", `Invalid property: ${name}`);
          }
          return value2;
        };
        return {
          spreadsheetId: values.SPREADSHEET_ID,
          jwtSecret: values.JWT_SECRET,
          tokenTtlSeconds: numberProperty("JWT_TTL_SECONDS", DEFAULT_TOKEN_TTL_SECONDS, 60),
          defaultPageSize: numberProperty("DEFAULT_PAGE_SIZE", DEFAULT_PAGE_SIZE, 1),
          maxPageSize: numberProperty("MAX_PAGE_SIZE", DEFAULT_MAX_PAGE_SIZE, 1),
          jwtIssuer: source.getProperty("JWT_ISSUER") || "gas-enlaces-2027",
          jwtAudience: source.getProperty("JWT_AUDIENCE") || "admin"
        };
      }
      module2.exports = { readConfig };
    }
  });

  // server/sheet-orm.js
  var require_sheet_orm = __commonJS({
    "server/sheet-orm.js"(exports2, module2) {
      var { AppError } = require_errors();
      var SheetORM = class {
        constructor(sheet, options = {}) {
          this.sheet = sheet;
          this.requiredColumns = options.requiredColumns || [];
          this.lockService = options.lockService;
          this.cache = options.cache;
          this.cacheTtlSeconds = options.cacheTtlSeconds || 60;
        }
        headers() {
          if (!this.sheet || typeof this.sheet.getDataRange !== "function") {
            throw new AppError(500, "SHEET_UNAVAILABLE", "Sheet is unavailable");
          }
          const values = this.sheet.getDataRange().getValues();
          const headers = values.length ? values[0].map((value2) => String(value2).trim()) : [];
          if (!headers.length || headers.some((header) => !header)) {
            throw new AppError(500, "INVALID_HEADERS", "Sheet headers are missing or invalid");
          }
          this.requiredColumns.forEach((column) => {
            if (!headers.includes(column)) throw new AppError(500, "INVALID_HEADERS", `Missing required column: ${column}`);
          });
          return { headers, values };
        }
        all() {
          const cached = this.cache && this.cache.get();
          if (cached) return JSON.parse(cached);
          const { headers, values } = this.headers();
          const records = values.slice(1).filter((row) => row.some((value2) => value2 !== "" && value2 !== null)).map((row, index) => {
            const record = { __rowNumber: index + 2 };
            headers.forEach((header, column) => {
              record[header] = row[column] ?? null;
            });
            return record;
          });
          if (this.cache) this.cache.put(JSON.stringify(records), this.cacheTtlSeconds);
          return records;
        }
        findById(id) {
          return this.all().find((record) => String(record.id) === String(id)) || null;
        }
        create(record) {
          return this.withWrite(() => {
            const { headers } = this.headers();
            const unknown = Object.keys(record).filter((key) => key !== "__rowNumber" && !headers.includes(key));
            if (unknown.length) throw new AppError(400, "INVALID_FIELDS", `Unknown fields: ${unknown.join(", ")}`);
            this.sheet.appendRow(headers.map((header) => record[header] ?? ""));
            this.invalidate();
            return this.findById(record.id);
          });
        }
        updateById(id, changes) {
          return this.withWrite(() => {
            const current = this.findById(id);
            if (!current) throw new AppError(404, "NOT_FOUND", "Record not found");
            const { headers } = this.headers();
            const unknown = Object.keys(changes).filter((key) => key !== "__rowNumber" && !headers.includes(key));
            if (unknown.length) throw new AppError(400, "INVALID_FIELDS", `Unknown fields: ${unknown.join(", ")}`);
            const updated = { ...current, ...changes };
            this.sheet.getRange(current.__rowNumber, 1, 1, headers.length).setValues([headers.map((header) => updated[header] ?? "")]);
            this.invalidate();
            return this.findById(id);
          });
        }
        withWrite(callback) {
          if (!this.lockService) return callback();
          return this.lockService.runExclusive(callback);
        }
        invalidate() {
          if (this.cache && typeof this.cache.remove === "function") this.cache.remove();
        }
      };
      module2.exports = { SheetORM };
    }
  });

  // server/users.js
  var require_users = __commonJS({
    "server/users.js"(exports2, module2) {
      var USERS_COLUMNS = ["id", "name", "email", "username", "password_hash", "is_active", "is_lock", "deleted_at", "created_at", "updated_at"];
      function ensureUsersSheet(spreadsheet) {
        let sheet = spreadsheet.getSheetByName("Users");
        if (!sheet) sheet = spreadsheet.insertSheet("Users");
        const range = sheet.getDataRange();
        const values = range.getValues();
        if (!values.length || values[0].every((value2) => value2 === "")) {
          sheet.getRange(1, 1, 1, USERS_COLUMNS.length).setValues([USERS_COLUMNS]);
        }
        return sheet;
      }
      module2.exports = { USERS_COLUMNS, ensureUsersSheet };
    }
  });

  // server/normalization.js
  var require_normalization = __commonJS({
    "server/normalization.js"(exports2, module2) {
      function isTrue(value2) {
        return value2 === true || String(value2).trim().toUpperCase() === "TRUE";
      }
      function isFalse(value2) {
        return value2 === false || value2 === null || value2 === void 0 || String(value2).trim().toUpperCase() === "FALSE";
      }
      function isNotDeleted(value2) {
        return value2 === null || value2 === void 0 || String(value2).trim() === "";
      }
      function isEligibleUser(user) {
        return !isTrue(user.is_active ?? user.isActive) && !isTrue(user.is_lock ?? user.isLock) && isNotDeleted(user.deleted_at ?? user.deletedAt);
      }
      module2.exports = { isTrue, isFalse, isNotDeleted, isEligibleUser };
    }
  });

  // server/crypto-adapter.js
  var require_crypto_adapter = __commonJS({
    "server/crypto-adapter.js"(exports, module) {
      function utf8Bytes(value2) {
        if (typeof Utilities !== "undefined") return Utilities.newBlob(String(value2)).getBytes();
        return Buffer.from(String(value2), "utf8");
      }
      function bytesToHex(bytes) {
        return Array.from(bytes, (byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0")).join("");
      }
      function sha256(value) {
        if (typeof Utilities !== "undefined") {
          return bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, utf8Bytes(value)));
        }
        return eval("require")("crypto").createHash("sha256").update(String(value)).digest("hex");
      }
      function hmacSha256(value, secret) {
        if (typeof Utilities !== "undefined") {
          return Utilities.computeHmacSha256Signature(utf8Bytes(value), String(secret));
        }
        return eval("require")("crypto").createHmac("sha256", secret).update(value).digest();
      }
      function base64UrlEncode(value) {
        if (typeof Utilities !== "undefined") {
          const bytes = typeof value === "string" ? utf8Bytes(value) : value;
          return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
        }
        return eval("require")("buffer").Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      function base64UrlDecode(value, asText = false) {
        if (typeof Utilities !== "undefined") {
          const bytes = Utilities.base64DecodeWebSafe(value);
          if (asText) return Utilities.newBlob(bytes).getDataAsString();
          return bytes;
        }
        const buffer = eval("require")("buffer").Buffer.from(value, "base64url");
        return asText ? buffer.toString("utf8") : buffer;
      }
      function constantTimeEqual(left, right) {
        if (left.length !== right.length) return false;
        let result = 0;
        for (let index = 0; index < left.length; index += 1) {
          result |= left[index] ^ right[index];
        }
        return result === 0;
      }
      function randomHex(length = 16) {
        if (typeof Utilities !== "undefined") return bytesToHex(Utilities.getUuid().replace(/-/g, "").match(/.{2}/g).slice(0, length));
        return eval("require")("crypto").randomBytes(length).toString("hex");
      }
      module.exports = {
        sha256,
        hmacSha256,
        base64UrlEncode,
        base64UrlDecode,
        constantTimeEqual,
        randomHex
      };
    }
  });

  // server/password.js
  var require_password = __commonJS({
    "server/password.js"(exports2, module2) {
      var { randomHex: randomHex2, sha256: sha2562, constantTimeEqual: constantTimeEqual2 } = require_crypto_adapter();
      function hashPassword(password, salt = randomHex2()) {
        let derived = `${salt}:${String(password)}`;
        for (let index = 0; index < 1e4; index += 1) derived = sha2562(derived);
        return `sha256-iterated$${salt}$${derived}`;
      }
      function verifyPassword(password, encoded) {
        if (typeof encoded !== "string") return false;
        const [algorithm, salt, expected] = encoded.split("$");
        if (algorithm !== "sha256-iterated" || !salt || !expected) return false;
        const actual = hashPassword(password, salt).split("$")[2];
        return constantTimeEqual2(actual, expected);
      }
      module2.exports = { hashPassword, verifyPassword };
    }
  });

  // server/jwt.js
  var require_jwt = __commonJS({
    "server/jwt.js"(exports2, module2) {
      var { AppError } = require_errors();
      var { hmacSha256: hmacSha2562, base64UrlEncode: base64UrlEncode2, base64UrlDecode: base64UrlDecode2, constantTimeEqual: constantTimeEqual2 } = require_crypto_adapter();
      function signJwt(payload, config, now = Math.floor(Date.now() / 1e3)) {
        const header = { alg: "HS256", typ: "JWT" };
        const claims = { ...payload, iss: config.jwtIssuer, aud: config.jwtAudience, iat: now, exp: now + config.tokenTtlSeconds };
        const encoded = `${base64UrlEncode2(JSON.stringify(header))}.${base64UrlEncode2(JSON.stringify(claims))}`;
        return `${encoded}.${base64UrlEncode2(hmacSha2562(encoded, config.jwtSecret))}`;
      }
      function verifyJwt(token, config, now = Math.floor(Date.now() / 1e3)) {
        if (typeof token !== "string") throw new AppError(401, "UNAUTHORIZED", "Authentication required");
        const parts = token.split(".");
        if (parts.length !== 3) throw new AppError(401, "UNAUTHORIZED", "Invalid token");
        let header;
        let claims;
        try {
          header = JSON.parse(base64UrlDecode2(parts[0], true));
          claims = JSON.parse(base64UrlDecode2(parts[1], true));
        } catch (error) {
          throw new AppError(401, "UNAUTHORIZED", "Invalid token");
        }
        if (header.alg !== "HS256" || header.typ !== "JWT") throw new AppError(401, "UNAUTHORIZED", "Invalid token");
        const expected = hmacSha2562(`${parts[0]}.${parts[1]}`, config.jwtSecret);
        const actual = base64UrlDecode2(parts[2]);
        if (!constantTimeEqual2(actual, expected)) throw new AppError(401, "UNAUTHORIZED", "Invalid token");
        if (claims.iss !== config.jwtIssuer || claims.aud !== config.jwtAudience || !claims.sub || !Number.isInteger(claims.exp) || claims.exp <= now) {
          throw new AppError(401, "UNAUTHORIZED", "Invalid token");
        }
        return claims;
      }
      module2.exports = { signJwt, verifyJwt };
    }
  });

  // server/auth-service.js
  var require_auth_service = __commonJS({
    "server/auth-service.js"(exports2, module2) {
      var { AppError } = require_errors();
      var { isEligibleUser } = require_normalization();
      var { verifyPassword } = require_password();
      var { signJwt, verifyJwt } = require_jwt();
      var AuthService = class {
        constructor(userRepository, config) {
          this.userRepository = userRepository;
          this.config = config;
        }
        login(username, password) {
          const user = this.userRepository.all().find((candidate) => String(candidate.username || "").toLowerCase() === String(username || "").toLowerCase() || String(candidate.email || "").toLowerCase() === String(username || "").toLowerCase());
          if (!user || !isEligibleUser(user) || !verifyPassword(password, user.password_hash)) {
            throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
          }
          return {
            token: signJwt({ sub: String(user.id) }, this.config),
            user: publicUser(user)
          };
        }
        authenticate(token) {
          const claims = verifyJwt(token, this.config);
          const user = this.userRepository.findById(claims.sub);
          if (!user || !isEligibleUser(user)) throw new AppError(401, "UNAUTHORIZED", "Authentication required");
          return user;
        }
      };
      function publicUser(user) {
        return Object.fromEntries(Object.entries({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username
        }).filter(([, value2]) => value2 !== void 0 && value2 !== null));
      }
      module2.exports = { AuthService, publicUser };
    }
  });

  // server/response.js
  var require_response = __commonJS({
    "server/response.js"(exports2, module2) {
      var MESSAGES = {
        INVALID_CREDENTIALS: "Las credenciales no son v\xE1lidas",
        UNAUTHORIZED: "Debes iniciar sesi\xF3n para realizar esta operaci\xF3n",
        INVALID_TOKEN: "El token de acceso no es v\xE1lido",
        INVALID_JSON: "La solicitud no contiene un JSON v\xE1lido",
        INVALID_PAGINATION: "Los par\xE1metros de paginaci\xF3n no son v\xE1lidos",
        NOT_FOUND: "El recurso solicitado no existe",
        SHEET_UNAVAILABLE: "No se pudo acceder a los datos",
        INVALID_HEADERS: "La estructura de la hoja no es v\xE1lida",
        CONFIGURATION_ERROR: "La configuraci\xF3n del servidor no es v\xE1lida",
        LOCK_UNAVAILABLE: "El bloqueo de escritura no est\xE1 disponible",
        WRITE_LOCK_TIMEOUT: "El recurso est\xE1 ocupado. Intenta nuevamente"
      };
      function success(data, status = 200) {
        return { status, body: { success: true, data } };
      }
      function failure(error) {
        const status = Number.isInteger(error.status) ? error.status : 500;
        return {
          status,
          body: {
            success: false,
            error: {
              code: error.code || "INTERNAL_ERROR",
              message: status >= 500 ? "Ocurri\xF3 un error interno" : MESSAGES[error.code] || error.message,
              ...error.details ? { details: error.details } : {}
            }
          }
        };
      }
      function jsonResponse(result, headers = {}) {
        return {
          status: result.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            ...headers
          },
          body: JSON.stringify(result.body)
        };
      }
      module2.exports = { success, failure, jsonResponse };
    }
  });

  // server/users-service.js
  var require_users_service = __commonJS({
    "server/users-service.js"(exports2, module2) {
      var { AppError } = require_errors();
      var { isEligibleUser } = require_normalization();
      var { publicUser } = require_auth_service();
      function listUsers(repository, currentUserId, query, maxPageSize = 100, defaultPageSize = 10) {
        const page = parsePositiveInteger(query.page, 1);
        const pageSize = parsePositiveInteger(query.pageSize, defaultPageSize);
        if (pageSize > maxPageSize) throw new AppError(400, "INVALID_PAGINATION", `pageSize must be <= ${maxPageSize}`);
        const searchTerm = String(query.q || "").trim().toLowerCase();
        const filtered = repository.all().filter(isEligibleUser).filter((user) => String(user.id) !== String(currentUserId)).filter((user) => !searchTerm || [user.name, user.email, user.username].some((value2) => String(value2 || "").toLowerCase().includes(searchTerm))).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), void 0, { sensitivity: "base" }));
        const total = filtered.length;
        const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
        const data = filtered.slice((page - 1) * pageSize, page * pageSize).map(publicUser);
        return { total, page, totalPages, data };
      }
      function parsePositiveInteger(value2, fallback) {
        if (value2 === void 0 || value2 === null || value2 === "") return fallback;
        const number = Number(value2);
        if (!Number.isInteger(number) || number < 1) throw new AppError(400, "INVALID_PAGINATION", "Pagination values must be positive integers");
        return number;
      }
      module2.exports = { listUsers, parsePositiveInteger };
    }
  });

  // server/router.js
  var require_router = __commonJS({
    "server/router.js"(exports2, module2) {
      var { AppError } = require_errors();
      var { success, failure, jsonResponse } = require_response();
      function createRouter({ authService, userRepository, catalogRepository, config }) {
        function dispatch(input, authorization) {
          try {
            const action = input && input.action;
            if (action === "auth.login") {
              return jsonResponse(success(authService.login(input.username, input.password)));
            }
            if (action === "catalog.get") {
              return jsonResponse(success(catalogRepository.getCatalog()));
            }
            if (action === "users.list") {
              const token = extractToken(input, authorization);
              const user = authService.authenticate(token);
              const { listUsers } = require_users_service();
              return jsonResponse(success(listUsers(userRepository, user.id, input, config.maxPageSize, config.defaultPageSize)));
            }
            throw new AppError(404, "NOT_FOUND", "La acci\xF3n solicitada no existe");
          } catch (error) {
            return jsonResponse(failure(error));
          }
        }
        return { dispatch };
      }
      function extractToken(input = {}, authorization) {
        const supplied = input.accessToken || input.token || authorization || "";
        return String(supplied).replace(/^Bearer\s+/i, "").trim();
      }
      function parseInput(body) {
        if (body && typeof body === "object") return body;
        try {
          return JSON.parse(String(body || "{}"));
        } catch (error) {
          throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON");
        }
      }
      module2.exports = { createRouter, parseInput, extractToken };
    }
  });

  // server/index.js
  var require_index = __commonJS({
    "server/index.js"(exports2, module2) {
      var { readConfig } = require_config();
      var { parseInput, createRouter } = require_router();
      var { failure, jsonResponse } = require_response();
      var { AppError } = require_errors();
      function createApp({ config, authService, userRepository, catalogRepository }) {
        const router = createRouter({ authService, userRepository, catalogRepository, config });
        return {
          doPost(event = {}) {
            try {
              const body = parseInput(event.postData && event.postData.contents);
              return router.dispatch(body, event.headers && (event.headers.Authorization || event.headers.authorization));
            } catch (error) {
              return jsonResponse(failure(error));
            }
          },
          doGet(event = {}) {
            try {
              const params = event.parameter || {};
              return router.dispatch({ action: params.action || "catalog.get", ...params }, event.headers && (event.headers.Authorization || event.headers.authorization));
            } catch (error) {
              return jsonResponse(failure(error));
            }
          }
        };
      }
      function requireAppsScriptConfig(properties) {
        return readConfig(properties);
      }
      module2.exports = { createApp, requireAppsScriptConfig, AppError };
    }
  });

  // server/lock-service.js
  var require_lock_service = __commonJS({
    "server/lock-service.js"(exports2, module2) {
      var { AppError } = require_errors();
      var ScriptLockService = class {
        constructor(lock, timeoutMs = 5e3) {
          this.lock = lock;
          this.timeoutMs = timeoutMs;
        }
        runExclusive(callback) {
          if (!this.lock || typeof this.lock.tryLock !== "function" || typeof this.lock.releaseLock !== "function") {
            throw new AppError(500, "LOCK_UNAVAILABLE", "LockService is not configured");
          }
          if (!this.lock.tryLock(this.timeoutMs)) {
            throw new AppError(409, "WRITE_LOCK_TIMEOUT", "The resource is busy");
          }
          try {
            return callback();
          } finally {
            this.lock.releaseLock();
          }
        }
      };
      function createAppsScriptLockService(timeoutMs) {
        const appsScriptLockService = typeof globalThis !== "undefined" ? globalThis.LockService : void 0;
        if (!appsScriptLockService || typeof appsScriptLockService.getScriptLock !== "function") {
          throw new AppError(500, "LOCK_UNAVAILABLE", "Apps Script LockService is unavailable");
        }
        return new ScriptLockService(appsScriptLockService.getScriptLock(), timeoutMs);
      }
      module2.exports = { LockService: ScriptLockService, ScriptLockService, createAppsScriptLockService };
    }
  });

  // server/catalog.js
  var require_catalog = __commonJS({
    "server/catalog.js"(exports2, module2) {
      var { AppError } = require_errors();
      var { isNotDeleted } = require_normalization();
      var CATALOG_TABLES = {
        faculties: { sheet: "Faculties", id: "faculty_id", required: ["faculty_id", "faculty_name", "created_at", "updated_at", "deleted_at"] },
        programs: { sheet: "Programs", id: "program_id", required: ["program_id", "program_name", "faculty_id", "created_at", "updated_at", "deleted_at"] },
        modules: { sheet: "Modules", id: "module_id", required: ["module_id", "module_name", "program_id", "semester", "created_at", "updated_at", "deleted_at"] },
        resources: { sheet: "Resources", id: "resource_id", required: ["resource_id", "resource_type", "module_id", "resource_name", "created_at", "updated_at", "deleted_at"] },
        resourceLinks: { sheet: "ResourceLinks", id: "link_id", required: ["link_id", "resource_id", "type", "url", "created_at", "updated_at", "deleted_at"] },
        folders: { sheet: "Folders", id: "folder_id", required: ["folder_id", "path", "created_at", "updated_at", "deleted_at"] },
        resourceFolderLinks: { sheet: "ResourceFolderLinks", id: null, required: ["resource_id", "folder_id"] }
      };
      function activeRows(rows) {
        return rows.filter((row) => isNotDeleted(row.deleted_at));
      }
      function indexBy(rows, key) {
        return rows.reduce((index, row) => {
          index[String(row[key])] = row;
          return index;
        }, {});
      }
      function buildCatalog(rows) {
        const faculties = activeRows(rows.faculties);
        const programs = activeRows(rows.programs);
        const modules = activeRows(rows.modules);
        const resources = activeRows(rows.resources);
        const resourceLinks = activeRows(rows.resourceLinks);
        const folders = activeRows(rows.folders);
        const resourceFolderLinks = rows.resourceFolderLinks;
        const programsByFaculty = indexBy(programs, "program_id");
        const modulesByProgram = indexBy(modules, "module_id");
        const resourcesByModule = indexBy(resources, "resource_id");
        const linksByResource = resourceLinks.reduce((index, link) => {
          const key = String(link.resource_id);
          if (!index[key]) index[key] = [];
          index[key].push({ id: link.link_id, tipo: link.type, url: link.url });
          return index;
        }, {});
        const foldersByResource = resourceFolderLinks.reduce((index, relation) => {
          const folder = folders.find((item) => String(item.folder_id) === String(relation.folder_id));
          if (!folder) return index;
          const key = String(relation.resource_id);
          if (!index[key]) index[key] = [];
          index[key].push({ id: folder.folder_id, ruta: folder.path });
          return index;
        }, {});
        return {
          facultades: faculties.map((faculty) => ({
            id: faculty.faculty_id,
            nombre: faculty.faculty_name,
            programas: programs.filter((program) => String(program.faculty_id) === String(faculty.faculty_id)).map((program) => ({
              id: program.program_id,
              nombre: program.program_name,
              modulos: modules.filter((item) => String(item.program_id) === String(program.program_id)).map((item) => ({
                id: item.module_id,
                nombre: item.module_name,
                semestre: item.semester,
                recursos: resources.filter((resource) => String(resource.module_id) === String(item.module_id)).map((resource) => ({
                  id: resource.resource_id,
                  tipo: resource.resource_type,
                  nombre: resource.resource_name,
                  enlaces: linksByResource[String(resource.resource_id)] || [],
                  carpetas: foldersByResource[String(resource.resource_id)] || []
                }))
              }))
            }))
          }))
        };
      }
      var CatalogRepository = class {
        constructor(spreadsheet, options = {}) {
          this.spreadsheet = spreadsheet;
          this.cache = options.cache;
          this.cacheKey = options.cacheKey || "catalog:v1";
          this.cacheTtlSeconds = options.cacheTtlSeconds || 120;
          this.ormFactory = options.ormFactory;
        }
        readRows() {
          if (!this.spreadsheet || typeof this.spreadsheet.getSheetByName !== "function") {
            throw new AppError(500, "SHEET_UNAVAILABLE", "No se pudo acceder al Spreadsheet");
          }
          return Object.entries(CATALOG_TABLES).reduce((result, [name, definition]) => {
            const sheet = this.spreadsheet.getSheetByName(definition.sheet);
            if (!sheet) throw new AppError(500, "SHEET_UNAVAILABLE", `No existe la hoja ${definition.sheet}`);
            result[name] = this.ormFactory(sheet, { requiredColumns: definition.required }).all();
            return result;
          }, {});
        }
        getCatalog() {
          const cached = this.cache && this.cache.get(this.cacheKey);
          if (cached) return JSON.parse(cached);
          const catalog = buildCatalog(this.readRows());
          if (this.cache) this.cache.put(this.cacheKey, JSON.stringify(catalog), this.cacheTtlSeconds);
          return catalog;
        }
        invalidate() {
          if (this.cache && typeof this.cache.remove === "function") this.cache.remove(this.cacheKey);
        }
      };
      module2.exports = { CATALOG_TABLES, CatalogRepository, buildCatalog, activeRows };
    }
  });

  // server/cache.js
  var require_cache = __commonJS({
    "server/cache.js"(exports2, module2) {
      function createAppsScriptCache() {
        if (typeof globalThis === "undefined" || !globalThis.CacheService) return null;
        return globalThis.CacheService.getScriptCache();
      }
      module2.exports = { createAppsScriptCache };
    }
  });

  // server/apps-script-entrypoint.js
  var require_apps_script_entrypoint = __commonJS({
    "server/apps-script-entrypoint.js"(exports2, module2) {
      var { readConfig } = require_config();
      var { SheetORM } = require_sheet_orm();
      var { ensureUsersSheet, USERS_COLUMNS } = require_users();
      var { AuthService } = require_auth_service();
      var { createApp } = require_index();
      var { createAppsScriptLockService } = require_lock_service();
      var { CatalogRepository } = require_catalog();
      var { createAppsScriptCache } = require_cache();
      function buildAppsScriptApp() {
        const config = readConfig();
        const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
        const usersSheet = ensureUsersSheet(spreadsheet);
        const userRepository = new SheetORM(usersSheet, {
          requiredColumns: USERS_COLUMNS,
          lockService: createAppsScriptLockService()
        });
        const cache = createAppsScriptCache();
        const ormFactory = (sheet, options) => new SheetORM(sheet, { ...options, cache: null });
        const catalogRepository = new CatalogRepository(spreadsheet, {
          cache,
          ormFactory
        });
        return createApp({ config, authService: new AuthService(userRepository, config), userRepository, catalogRepository });
      }
      function toContentService(response) {
        return ContentService.createTextOutput(response.body).setMimeType(ContentService.MimeType.JSON);
      }
      function doGet(event) {
        return toContentService(buildAppsScriptApp().doGet(event));
      }
      function doPost(event) {
        return toContentService(buildAppsScriptApp().doPost(event));
      }
      module2.exports = { buildAppsScriptApp, doGet, doPost };
      if (typeof globalThis !== "undefined") {
        globalThis.doGet = doGet;
        globalThis.doPost = doPost;
      }
    }
  });
  require_apps_script_entrypoint();
})();
