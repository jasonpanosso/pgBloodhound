SELECT nspname FROM pg_catalog.pg_namespace
WHERE
    nspname != 'information_schema'
    AND nspname NOT LIKE 'pg_%';
