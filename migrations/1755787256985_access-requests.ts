import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import {
  API_SCHEMA,
  EMGRA_SCHEMA,
} from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);

  pgm.createTable("access_requests", {
    id: {
      type: "integer",
      generated: { precedence: "ALWAYS" },
      notNull: true,
      primaryKey: true,
    },
    organization_id: {
      type: "integer",
      notNull: true,
      references: '"organization"(id)',
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"(id)',
    },    
    role: { type: "role", notNull: true },
    state: { type: "state", notNull: true },
    status: { type: "status", notNull: true },
    comments: { type: "varchar(255)" },
  });

  pgm.createIndex("access_requests", "user_id");
  pgm.createIndex("access_requests", ["organization_id", "role"]);

  pgm.addConstraint(
    "access_requests",
    "access_requests_org_user_unique",
    {
      unique: ["organization_id", "user_id"],
    }
  );

  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.createView(
    "access_requests",
    {},
    `
            SELECT 
                id
                ,organization_id
                ,user_id
                ,role
                ,state
                ,status
                ,comments
            FROM 
                ${EMGRA_SCHEMA}.access_requests
        `
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropView("access_requests");

  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.dropIndex("access_requests", ["user_id"]);
  pgm.dropIndex("access_requests", ["organization_id"]);
  pgm.dropConstraint("access_requests", "access_requests_org_user_unique");
  pgm.dropTable("access_requests");
}
