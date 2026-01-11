import {
  RoleOptions,
  SchemaPrivilege,
  TablePrivilege,
} from "node-pg-migrate";

export const API_SCHEMA = "api";
export const EMGRA_SCHEMA = "emgra";
export const PUBLIC_SCHEMA = "public";
export const ROLE_WEB_ANON = "web_anon";

export const schemas = [API_SCHEMA, EMGRA_SCHEMA, PUBLIC_SCHEMA] as const;
export const createSchemas = [API_SCHEMA, EMGRA_SCHEMA] as const;

type SCHEMA = (typeof schemas)[number];

export const ADMIN = "admin";
export const MANAGER = "manager";
export const ORGANIZATION_MANAGER = "organization_manager";
export const ORGANIZATION_USER = "organization_user";

const roles = [
  ROLE_WEB_ANON,
  ADMIN,
  MANAGER,
  ORGANIZATION_MANAGER,
  ORGANIZATION_USER,
] as const;

type ROLE = (typeof roles)[number];

export const ROLES: Record<ROLE, RoleOptions> = {
  [ROLE_WEB_ANON]: {
    login: false,
  },
  [ADMIN]: {
    login: false,
  },
  [MANAGER]: {
    login: false,
  },  
  [ORGANIZATION_MANAGER]: {
    login: false,
  },
  [ORGANIZATION_USER]: {
    login: false,
  },  
};

export const SCHEMA_ROLE_GRANTS: Record<
  SCHEMA,
  Partial<Record<ROLE, SchemaPrivilege | SchemaPrivilege[] | "ALL">>
> = {
  api: {
    web_anon: ["USAGE"],
    admin: ["USAGE"],
    manager: ["USAGE"],
    organization_manager: ["USAGE"],
    organization_user: ["USAGE"],
  },
  emgra: {
    admin: ["USAGE"],
    manager: ["USAGE"],    
    organization_manager: ["USAGE"],
    organization_user: ["USAGE"],
  },
  public: {
    admin: ["USAGE", "CREATE"],
    manager: ["USAGE", "CREATE"],
    organization_manager: ["USAGE", "CREATE"],
    organization_user: ["USAGE", "CREATE"],
  },
};

type RoleTablePrivileges = Record<
  string,
  TablePrivilege | TablePrivilege[] | "ALL"
>;
export const SCHEMA_TABLE_ROLE_GRANTS: Partial<
  Record<SCHEMA, Partial<Record<ROLE, RoleTablePrivileges>>>
> = {
  api: {
    admin: {
      organization: ["SELECT"],
      users: ["SELECT"],
    },
    manager: {
      organization: ["SELECT"],
      users: ["SELECT"],
    },
  },
  emgra: {
    admin: {
      organization: "ALL",
      users: "ALL",
    },
    manager: {
      organization: "ALL",
      users: "ALL",
    },    
    organization_manager: {
      organization: ["SELECT", "INSERT", "UPDATE", "DELETE"],
    },
  },
};

export const SCHEMA_VIEWS_ROLE_GRANTS: Partial<
  Record<SCHEMA, Partial<Record<ROLE, RoleTablePrivileges>>>
> = {
  api: {
    admin: {
      organization: ["SELECT"],
      users: ["SELECT"],
    },
    manager: {
      organization: ["SELECT"],
      users: ["SELECT"],
    },
    web_anon: {
      organization: ["SELECT"],
    },
  },
};
