import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";
import { API_SCHEMA, AUTH_SCHEMA, ROLE_WEB_ANON, ROLE_AUTHENTICATOR } from "../init/schema";

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

  pgm.createTable(
    "organization_app_users",
    {
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
    },
    {
      constraints: {
        primaryKey: ["organization_id", "app_user_id"],
      },
    },
  );

  pgm.createIndex("organization_app_users", ["app_user_id"]);
  pgm.createIndex("organization_app_users", ["organization_id"]);

  pgm.sql(`SET schema '${AUTH_SCHEMA}'`);

  pgm.createFunction(
    "user_id", [], {
      language: "sql",
      returns: "uuid",
      behavior: "STABLE",
      replace: true,
    }, `
      SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
    `
  );

  pgm.createFunction(
    "has_realm_role",
    [{ name: "role_name", type: "text" }],
    {
      language: "sql",
      returns: "boolean",
      behavior: "STABLE",
      replace: true,
    },
    `
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          current_setting('request.jwt.claims', true)::jsonb
            -> 'realm_access'
            -> 'roles'
        ) r
        WHERE r = role_name
      );
    `
  );

  pgm.createFunction(
    "is_org_member",
    [{ name: "org_id", type: "uuid" }],
    {
      language: "sql",
      returns: "boolean",
      behavior: "STABLE",
      replace: true,
    },
    `
      SELECT EXISTS (
        SELECT 1
        FROM ${API_SCHEMA}.organization_app_users ou
        WHERE ou.organization_id = org_id
          AND ou.app_user_id = ${AUTH_SCHEMA}.user_id()
      );
    `
  );

  pgm.createFunction(
    "is_org_owner",
    [{ name: "org_id", type: "uuid" }],
    {
      language: "sql",
      returns: "boolean",
      behavior: "STABLE",
      replace: true,
    },
    `
      SELECT EXISTS (
        SELECT 1
        FROM ${API_SCHEMA}.organization_app_users ou
        WHERE ou.organization_id = org_id
          AND ou.app_user_id = ${AUTH_SCHEMA}.user_id()
          AND ou.role = 'owner'
      );
    `
  );

  pgm.createFunction(
    "is_authenticated",
    [],
    {
      language: "sql",
      returns: "boolean",
      behavior: "STABLE",
      replace: true,
    },
    `
      SELECT current_setting('request.jwt.claims', true) IS NOT NULL;
    `
  );

  pgm.sql(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "${AUTH_SCHEMA}" TO "${ROLE_WEB_ANON}";`);
  pgm.sql(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "${AUTH_SCHEMA}" TO "${ROLE_AUTHENTICATOR}";`);

  pgm.sql(`SET schema '${API_SCHEMA}'`);

  pgm.sql(`ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE organization_app_users ENABLE ROW LEVEL SECURITY;`);

  pgm.createPolicy(
    "app_users",
    "app_users_select",
    {
      command: "ALL",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (id = ${AUTH_SCHEMA}.user_id() OR ${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support'))`,
    }
  );

  pgm.createPolicy(
    "organizations",
    "organizations_select",
    {
      command: "SELECT",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR ${AUTH_SCHEMA}.is_org_member(id))`,
    }
  );

  pgm.createPolicy(
    "organizations",
    "organizations_update",
    {
      command: "UPDATE",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR ${AUTH_SCHEMA}.is_org_owner(id))`,
    }
  );
  
  pgm.createPolicy(
    "organizations",
    "organizations_delete",
    {
      command: "DELETE",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR ${AUTH_SCHEMA}.is_org_owner(id))`,
    }
  );  

  pgm.createPolicy(
    "organizations",
    "organizations_insert",
    {
      command: "INSERT",
      check: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support'))`,
    }
  );  

  pgm.createPolicy(
    "organization_app_users",
    "org_users_select",
    {
      command: "SELECT",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR app_user_id = ${AUTH_SCHEMA}.user_id())`,
    }
  );

  pgm.createPolicy(
    "organization_app_users",
    "org_users_modify",
    {
      command: "ALL",
      using: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR ${AUTH_SCHEMA}.is_org_owner(organization_id))`,
      check: `${AUTH_SCHEMA}.is_authenticated() AND (${AUTH_SCHEMA}.has_realm_role('system-admin') OR ${AUTH_SCHEMA}.has_realm_role('system-support') OR ${AUTH_SCHEMA}.is_org_owner(organization_id))`,
    }
  );
  
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET schema '${API_SCHEMA}'`);
  pgm.dropPolicy("organization_app_users", "org_users_modify");
  pgm.dropPolicy("organization_app_users", "org_users_select");
  pgm.dropPolicy("organizations", "organizations_insert");
  pgm.dropPolicy("organizations", "organizations_delete");
  pgm.dropPolicy("organizations", "organizations_update");
  pgm.dropPolicy("organizations", "organizations_select");
  pgm.dropPolicy("app_users", "app_users_select");
  pgm.dropIndex("organization_app_users", ["app_user_id"]);
  pgm.dropIndex("organization_app_users", ["organization_id"]);
  pgm.dropTable("organization_app_users");
  pgm.dropType("org_role");
  pgm.dropTable("app_users");
  pgm.dropTable("organizations");
  
  pgm.sql(`SET schema '${AUTH_SCHEMA}'`);
  pgm.dropFunction("is_authenticated", []);
  pgm.dropFunction("is_org_owner", ["uuid"]);
  pgm.dropFunction("is_org_member", ["uuid"]);
  pgm.dropFunction("has_realm_role", ["text"]);
  pgm.dropFunction("user_id", []);
  
  pgm.sql(`DROP SCHEMA IF EXISTS ${AUTH_SCHEMA};`);
}
