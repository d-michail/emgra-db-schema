import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { API_SCHEMA } from "../init/schema";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);

  pgm.createTable("organizations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createTable("app_users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createType("org_role", ["member", "owner"]);

  pgm.createTable("organization_app_users", {
    organization_id: {
      type: "uuid",
      notNull: true,
      references: '"organizations"(id)',
      onDelete: "CASCADE",
    },
    app_user_id: {
      type: "uuid",
      notNull: true,
      references: '"app_users"(id)',
      onDelete: "CASCADE",
    },
    role: { type: "org_role", notNull: true, default: "member" },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  }, {
    constraints: {
      primaryKey: ["organization_id", "app_user_id"]
    }
  });

  pgm.createIndex("organization_app_users", ["app_user_id"]);
  pgm.createIndex("organization_app_users", ["organization_id"]);

}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropTable("organizations");
}
