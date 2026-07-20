DO $$
DECLARE
    tabelas text;
BEGIN
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO tabelas
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> 'usuarios';

    IF tabelas IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tabelas || ' RESTART IDENTITY CASCADE';
    END IF;
END $$;