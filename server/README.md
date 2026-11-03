# Apps Script JSON backend

The modules in this directory expose the JSON contract used by the static client:

- `POST` with a `text/plain` body such as `{"action":"auth.login","username":"...","password":"..."}`.
- Protected `users.list` requests should send `token` or `accessToken` in the
  JSON body. An `Authorization: Bearer ...` header is also accepted when the
  hosting layer exposes request headers.
- For a GET request, the token can be sent as the `token` query parameter, but
  POST with `text/plain` is preferred because query strings can be logged.
- Responses always use `application/json`.

Configure `SPREADSHEET_ID`, `JWT_SECRET`, `JWT_TTL_SECONDS`, `DEFAULT_PAGE_SIZE`,
`MAX_PAGE_SIZE`, `JWT_ISSUER`, and `JWT_AUDIENCE` in Apps Script
`PropertiesService`. Never commit the secret. The `Users` sheet must use the
columns declared by `USERS_COLUMNS`; `deleted_at` is empty/null for live users.

Apps Script deployments should expose `doGet` and `doPost` from an entrypoint
that constructs the repository with `SheetORM` and a script lock from
`createAppsScriptLockService`. The source entrypoint is
`apps-script-entrypoint.js`; publish it with the project's Apps Script bundling
process so the deployed script exposes those two global functions. A deployed
version must be republished after changes; the existing Web App is not updated
by local edits.

## clasp

The project includes `appsscript.json` and is configured for `clasp` with
`gas-dist/` as its upload root. Replace the `scriptId` in `.clasp.json` with
the Apps Script project ID, not the `/exec` deployment ID or Spreadsheet ID.

```powershell
npm run gas:build
npm run clasp:push
npm run clasp:deploy
```

`clasp` uploads source files, but Apps Script does not execute Node.js
`require()` or Node's `crypto` module directly. The build step bundles the
backend and adapts cryptography to Apps Script `Utilities`.
