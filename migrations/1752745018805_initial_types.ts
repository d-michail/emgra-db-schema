import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { API_SCHEMA } from "../init/schema";


export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.createType("state", ["active", "inactive"]);
  pgm.createType("status", ["pending", "approved", "rejected"]);  
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropType("state");
  pgm.dropType("status");  
}
