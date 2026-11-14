# VetPath

VetPath is an early-stage project intended to help people find veterinary care and help clinics coordinate incoming cases. **This development branch is incomplete and must not be used for real patients, clinical decisions, or public care operations.** See [build status](docs/BUILD_STATUS.md).

The separate [public landing page](https://vetpath-care-demo.aheadchime1.chatgpt.site) is a presentation demo. Its Google Maps search does not represent a connected clinic directory.

## Local development

Prerequisites: Node.js 24, pnpm, and Docker with Compose. Commands below are run from the project folder. The database setup must be used only with a new isolated demonstration database.

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local`. Set `BETTER_AUTH_SECRET` and `RATE_LIMIT_SECRET` to independently generated random values of at least 32 characters. Keep this file private.
3. Start PostgreSQL with `docker compose up -d`. For the following database commands, export `DATABASE_URL=postgresql://vetpath:vetpath@localhost:5432/vetpath` in the terminal; Next.js reads `.env.local` itself.
4. Run `pnpm db:migrate`, then `VETPATH_ENV=demo pnpm db:init:demo` and `VETPATH_ENV=demo pnpm db:seed:demo`. The initializer refuses a nonempty database and the seed requires a demo database marker.
5. Run `VETPATH_ENV=demo pnpm db:staff:demo` to create a demo account. The generated password is shown once. Save it securely; the script does not reset an existing account.
6. Run `pnpm dev` and open the displayed localhost address. Open `/clinic` to sign in and `/admin` for sources. Run `pnpm worker` in a separate terminal with the same database environment to process source polling and in-app notifications.
7. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` for current checks.

Docker/PostgreSQL and a multi-process deployment still need independent verification. Local integration tests use PGlite and cannot prove production concurrency behavior. Never use example credentials in production.

## Optional Google Sheets

Set `GOOGLE_SERVICE_ACCOUNT_JSON` on the server and worker only. Share the specific directory sheet with that service account. Configure the sheet ID, range, and column mapping in the admin source editor; a connection is shown only after a successful authorized read. CSV/XLSX uploads are snapshots and do not keep the original file in sync. Excel cloud synchronization and PIMS connections are not implemented.
