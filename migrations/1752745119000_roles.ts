import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import {
  ROLE_AUTHENTICATOR,
  ROLE_WEB_ANON,
  SCHEMA_ROLE_GRANTS,
  SCHEMA_TABLE_ROLE_GRANTS,
} from "../init/schema";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const authenticatorPassword = process.env.AUTHENTICATOR_ROLE_PASS;
  if (!authenticatorPassword) {
    throw new Error("AUTHENTICATOR_ROLE_PASS env var is required");
  }

  pgm.createRole(ROLE_WEB_ANON, { login: false });
  pgm.createRole(ROLE_AUTHENTICATOR, {
    login: true,
    password: authenticatorPassword,
  });
  pgm.grantRoles([ROLE_WEB_ANON], ROLE_AUTHENTICATOR);

}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropRole(ROLE_AUTHENTICATOR);
  pgm.dropRole(ROLE_WEB_ANON);
}
