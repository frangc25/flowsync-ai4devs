# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FlowSync is a course practice project (team task management). Monorepo with two independent npm projects, no root `package.json`:

- `backend/` — AdonisJS 7 API (TypeScript, Lucid ORM, SQLite via better-sqlite3), port 3333
- `frontend/` — React 19 + Vite 8 + TypeScript, port 5173 (still the Vite template; not yet wired to the API)

## Commands

Backend (run from `backend/`):

```bash
cp .env.example .env && node ace generate:key   # first-time setup (APP_KEY is empty in .env.example)
node ace migration:run
npm run dev                                     # node ace serve --hmr
npm test                                        # node ace test
node ace test --files tests/functional/foo.spec.ts   # single file
node ace test --tests "test title"                   # single test by title
node ace test unit | functional                      # one suite
npm run lint | npm run typecheck | npm run format
```

Frontend (run from `frontend/`): `npm run dev`, `npm run build` (runs `tsc -b` first), `npm run lint` (oxlint, not eslint).

Tests use `backend/.env.test`. Test suites are `tests/unit/**` and `tests/functional/**` (functional suite auto-starts the HTTP server); neither directory has tests yet.

## Backend architecture

- API lives under `/api/v1` (see `start/routes.ts`): `auth/signup`, `auth/login` (public) and `account/profile`, `account/logout` (behind `middleware.auth()`). Auth is access tokens via `@adonisjs/auth` (`User.accessTokens`), not sessions, though session/shield middleware are still registered in `start/kernel.ts`.
- Controllers are referenced in routes through the generated `#generated/controllers` barrel (`controllers.NewAccount`, etc.), produced by the `indexEntities` hook in `adonisrc.ts` from files in `app/controllers/`. Don't hand-edit `.adonisjs/` (it is committed but generated; `generateRegistry()` from Tuyau also writes the typed API client registry there).
- Responses go through `providers/api_provider.ts`, which adds `ctx.serialize()` to `HttpContext`: output is wrapped as `{ data: ... }`. Controllers should return `serialize(Transformer.transform(model))` using classes in `app/transformers/`, rather than returning models directly.
- Input validation uses VineJS validators in `app/validators/` via `request.validateUsing(...)`.
- `force_json_response_middleware` forces JSON for all responses, including errors.
- Import aliases (`#models/*`, `#controllers/*`, `#start/*`, etc.) are defined in `backend/package.json` `imports`, and point at `.js` paths; always use these aliases instead of relative imports.
- Database schema classes are generated in `database/schema.ts` / `schema_rules.ts` from migrations; models extend them.
- CORS origins are configured through `CORS_ORIGIN` in `.env` (frontend dev origin is `http://localhost:5173`).

## Notes

- Repo docs and commit messages are written in Spanish; follow conventional-commit prefixes (`docs:`, `fix(backend):`).
- Working branch for the course is `s1/start`; PRs target `main`.

## Reglas de proceso
- Antes de tocar código: crear una rama nueva (`git checkout -b feat/<slug>`). Nunca commitear directo en `main`/`s1/start`.
- Al cerrar la tarea: usar la skill `/commit`, luego `gh pr create` con una descripción completa de los cambios en el cuerpo del PR.
- Después de abrir el PR: usar el subagente `adversarial-reviewer` sobre él, antes de darlo por terminado.
- No repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo con la URL del PR.