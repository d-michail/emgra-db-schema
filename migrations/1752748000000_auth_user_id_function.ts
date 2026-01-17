import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("CREATE SCHEMA IF NOT EXISTS auth");
  pgm.sql(`
    CREATE FUNCTION auth.user_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  
  pgm.sql(`
    CREATE FUNCTION auth.is_system_admin()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    AS $$
      select exists (
        select 1
        from jsonb_array_elements_text(
          current_setting('request.jwt.claim.realm_access', true)::jsonb->'roles'
        ) role
        where role = 'system_admin'
      );
    $$;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DROP FUNCTION IF EXISTS auth.is_system_admin()");
  pgm.sql("DROP FUNCTION IF EXISTS auth.user_id()");
}
