import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import {
  ROLE_AUTHENTICATOR,
  ROLE_WEB_ANON,
  SCHEMA_ROLE_GRANTS,
  SCHEMA_TABLE_ROLE_GRANTS,
} from "../init/schema";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const current_role = (await pgm.db.query(`SELECT current_role`)).rows[0].current_role;
  const current_schema = (await pgm.db.query(`SELECT current_schema`)).rows[0].current_schema;

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

  //Grant privileges
  Object.entries(SCHEMA_ROLE_GRANTS).forEach(([schema, roles]) => {
    Object.entries(roles).forEach(([role, privileges]) => {
      pgm.grantOnSchemas({
        schemas: [schema],
        roles: [role],
        privileges: privileges,
      });
    });
  });

  Object.entries(SCHEMA_TABLE_ROLE_GRANTS).forEach(([schema, roles]) => {
        pgm.sql(`SET schema '${schema}'`)
        Object.entries(roles).forEach(([role, roleTablePrivileges]) => {
            Object.entries(roleTablePrivileges).forEach(([table, privileges]) => { 
                pgm.grantOnTables({
                    privileges: privileges,
                    tables: [table],
                    roles: [role],
                })
            });
        })
    })

     pgm.sql(`SET schema '${current_schema}'`)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropRole(ROLE_AUTHENTICATOR);
  pgm.dropRole(ROLE_WEB_ANON);
}
