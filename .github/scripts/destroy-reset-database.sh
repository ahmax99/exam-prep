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
  obj record;
BEGIN
  FOR obj IN
    -- Relations first (views before tables), then routines, then types.
    -- Extension members and range constructors (owned by their type) are
    -- skipped; CASCADE + IF EXISTS absorbs anything an earlier drop took.
    SELECT format('DROP %s IF EXISTS %s CASCADE',
             CASE c.relkind
               WHEN 'v' THEN 'VIEW'
               WHEN 'm' THEN 'MATERIALIZED VIEW'
               WHEN 'S' THEN 'SEQUENCE'
               WHEN 'f' THEN 'FOREIGN TABLE'
               ELSE 'TABLE'
             END,
             c.oid::regclass) AS stmt,
           CASE c.relkind WHEN 'v' THEN 1 WHEN 'm' THEN 1 WHEN 'S' THEN 3 ELSE 2 END AS ord
      FROM pg_class c
     WHERE c.relnamespace = 'public'::regnamespace
       AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.classid = 'pg_class'::regclass
                          AND d.objid = c.oid AND d.deptype = 'e')
    UNION ALL
    SELECT format('DROP ROUTINE IF EXISTS %s CASCADE', p.oid::regprocedure), 4
      FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.classid = 'pg_proc'::regclass
                          AND d.objid = p.oid AND d.deptype IN ('e', 'i'))
    UNION ALL
    -- e = enum, d = domain, r = range, c = standalone composite (table and
    -- view row types are gone by now); array/multirange types go with these.
    SELECT format('DROP %s IF EXISTS %s CASCADE',
             CASE t.typtype WHEN 'd' THEN 'DOMAIN' ELSE 'TYPE' END,
             t.oid::regtype), 5
      FROM pg_type t
     WHERE t.typnamespace = 'public'::regnamespace
       AND t.typtype IN ('e', 'd', 'r', 'c')
       AND (t.typtype <> 'c' OR (SELECT relkind FROM pg_class WHERE oid = t.typrelid) = 'c')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d
                        WHERE d.classid = 'pg_type'::regclass
                          AND d.objid = t.oid AND d.deptype = 'e')
     ORDER BY ord
  LOOP
    RAISE NOTICE '%', obj.stmt;
    EXECUTE obj.stmt;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE 'public is already empty — nothing to drop.';
  END IF;
END
$$;
SQL

echo "Database reset — branch, compute endpoint and the public schema itself preserved; every table, enum and other object in it (including migration history) is gone. The next deploy's migrate job rebuilds them from prisma/migrations."
