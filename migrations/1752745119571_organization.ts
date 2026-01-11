import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { API_SCHEMA, EMGRA_SCHEMA } from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.createTable("organization", {
    id: {
      type: "integer",
      generated: {
        precedence: "ALWAYS",
      },
      notNull: true,
      primaryKey: true,
    },
    parent_id: {
      type: "varchar(255)",
    },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "varchar(255)"},
    state: { type: "state", notNull: true },
  });

  pgm.createIndex("organization", ["parent_id"]);

  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.createView(
    "organization",
    {},
    `
            SELECT 
                id
                ,parent_id
                ,name                
                ,description
                ,state
            FROM 
                ${EMGRA_SCHEMA}.organization
        `
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropView("organization");

  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.dropTable("organization");
}
