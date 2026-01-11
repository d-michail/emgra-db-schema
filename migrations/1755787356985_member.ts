import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import {
  API_SCHEMA,
  EMGRA_SCHEMA,
} from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);

  pgm.createTable("member", {
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
  });

  pgm.createIndex("member", "user_id");
  pgm.createIndex("member", ["organization_id", "role"]);

  pgm.addConstraint(
    "member",
    "member_org_user_unique",
    {
      unique: ["organization_id", "user_id"],
    }
  );

  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.createView(
    "member",
    {},
    `
            SELECT 
                id
                ,organization_id
                ,user_id
                ,role
                ,state
            FROM 
                ${EMGRA_SCHEMA}.member
        `
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropView("member");

  pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
  pgm.dropIndex("member", ["user_id"]);
  pgm.dropIndex("member", ["organization_id"]);
  pgm.dropConstraint("member", "member_org_user_unique");
  pgm.dropTable("member");
}
