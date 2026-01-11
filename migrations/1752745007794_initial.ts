import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { schemas, createSchemas } from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  //https://docs.postgrest.org/en/v12/explanations/db_authz.html#functions
  pgm.sql("ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC");
  //Create schemas
  createSchemas.forEach((schema) => {
    pgm.createSchema(schema);
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  schemas.forEach((schema) => {
    pgm.dropSchema(schema);
  });
  //https://docs.postgrest.org/en/v12/explanations/db_authz.html#functions
  pgm.sql("ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC");
}
