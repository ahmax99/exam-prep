#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

command -v psql >/dev/null 2>&1 || {
  echo "::error::psql is not installed on this runner — install postgresql-client before this step."
  exit 1
}

base_url="${DATABASE_URL%%\?*}"
export PGSSLMODE="${PGSSLMODE:-require}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-30}"

psql "$base_url" --no-psqlrc --quiet -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  targets text;
BEGIN
  SELECT string_agg(format('public.%I', tablename), ', ')
    INTO targets
    FROM pg_tables
   WHERE schemaname = 'public';

  IF targets IS NULL THEN
    RAISE NOTICE 'No tables in public — nothing to drop.';
  ELSE
    RAISE NOTICE 'Dropping %', targets;
    EXECUTE format('DROP TABLE %s CASCADE', targets);
  END IF;
END
$$;
SQL

echo "Database reset — branch and compute endpoint preserved; schema and migration history are gone. The next deploy's migrate job rebuilds both from prisma/migrations."
