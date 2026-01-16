import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { EMGRA_SCHEMA, ADMIN, MANAGER, ORGANIZATION_MANAGER, ORGANIZATION_USER, ROLES, SCHEMA_ROLE_GRANTS, SCHEMA_TABLE_ROLE_GRANTS } from '../init/schema';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    const current_role = (await pgm.db.query(`SELECT current_role`)).rows[0]
      .current_role;
    const current_schema = (await pgm.db.query(`SELECT current_schema`)).rows[0]
      .current_schema;

    Object.entries(ROLES).forEach(([role, roleOptions]) => {
      pgm.createRole(role, roleOptions);
      pgm.grantRoles(role, current_role);
    });

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
      pgm.sql(`SET schema '${schema}'`);
      Object.entries(roles).forEach(([role, roleTablePrivileges]) => {
        Object.entries(roleTablePrivileges).forEach(([table, privileges]) => {
          pgm.grantOnTables({
            privileges: privileges,
            tables: [table],
            roles: [role],
          });
        });
      });
    });

    pgm.sql(`
      GRANT USAGE ON SCHEMA public TO admin;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
    `);

}

export async function down(pgm: MigrationBuilder): Promise<void> {
    const current_schema = (await pgm.db.query(`SELECT current_schema`)).rows[0]
      .current_schema;

    Object.entries(SCHEMA_TABLE_ROLE_GRANTS).forEach(([schema, roles]) => {
      pgm.sql(`SET schema '${schema}'`);
      Object.entries(roles).forEach(([role, roleTablePrivileges]) => {
        Object.entries(roleTablePrivileges).forEach(([table, privileges]) => {
          pgm.revokeOnTables({
            privileges: privileges,
            tables: [table],
            roles: [role],
          });
        });
      });
    });

    Object.entries(SCHEMA_ROLE_GRANTS).forEach(([schema, roles]) => {
      pgm.sql(`SET schema '${schema}'`);
      Object.entries(roles).forEach(([role, privileges]) => {
        pgm.revokeOnSchemas({
          schemas: [schema],
          roles: [role],
          privileges: privileges,
        });
      });
    });

    pgm.sql(`SET schema '${current_schema}'`);

    Object.keys(ROLES).forEach((role) => {
      pgm.dropRole(role);
    });
}
