# Deployment notes

The current branch is for isolated development and is not ready for public clinical use. A static site alone cannot provide the database, authenticated clinic backend, worker, or protected case workflows.

A future reference deployment needs a Node.js host, PostgreSQL 17, a separately running worker, TLS, a trusted reverse proxy that overwrites the configured client-IP header, and private secret storage. Set a unique Better Auth secret, rate-limit secret, database URL and exact public authentication origin. Keep service-account credentials server-side. Enable public endpoints only after security and clinical review, operational ownership, retention decisions and incident procedures are complete.

Back up PostgreSQL using the managed provider's encrypted backups or `pg_dump` to protected storage; periodically restore into an isolated environment and verify migrations and sample reads. Backups do not cover future private attachments unless those are separately backed up. No production deployment, backup schedule, or restore exercise has yet been verified.
