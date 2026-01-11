import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { ADMIN, MANAGER, ORGANIZATION_MANAGER, ORGANIZATION_USER, EMGRA_SCHEMA } from "../init/schema";


export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.createType("state", ["active", "inactive"]);
  pgm.createType("role", [
    ADMIN,
    MANAGER,
    ORGANIZATION_MANAGER,
    ORGANIZATION_USER
  ]);

  pgm.createType("status", ["pending", "approved", "rejected"]);  
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.dropType("state");
  pgm.dropType("role");
  pgm.dropType("status");  
}
