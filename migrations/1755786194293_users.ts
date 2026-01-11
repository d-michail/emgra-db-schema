import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import {
  API_SCHEMA,
  EMGRA_SCHEMA,
} from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  
  pgm.createTable("users", {
    id: {
      type: "integer",
      notNull: true,
      primaryKey: true,
      generated: {
        precedence: "ALWAYS",
      },
    },
    first_name: {
      type: "varchar(255)",
      notNull: false,
    },
    last_name: { type: "varchar(255)", notNull: true },    
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    state: { type: "state", notNull: true },
  });

  pgm.createIndex("users", ["email"]);

  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.createView(
    "users",
    {},
    `
                SELECT 
                    id
                    ,first_name
                    ,last_name
                    ,email
                    ,state
                FROM 
                    ${EMGRA_SCHEMA}.users
            `
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropView("users");

  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.dropIndex("users", ["email"]);
  pgm.dropTable("users");  
}
