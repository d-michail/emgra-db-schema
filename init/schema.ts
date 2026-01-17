import {
  RoleOptions,
  SchemaPrivilege,
  TablePrivilege,
} from "node-pg-migrate";

export const API_SCHEMA = "api";
export const AUTH_SCHEMA = "auth";
export const PUBLIC_SCHEMA = "public";

export const schemas = [API_SCHEMA, AUTH_SCHEMA, PUBLIC_SCHEMA] as const;
type SCHEMA = typeof schemas[number];

export const createSchemas = [API_SCHEMA, AUTH_SCHEMA] as const;

export const ROLE_AUTHENTICATOR = "authenticator";
export const ROLE_WEB_ANON = "web_anon";

const roles = [
    ROLE_WEB_ANON,
    ROLE_AUTHENTICATOR,
] as const;

type ROLE = typeof roles[number];

export const ROLES: Record<ROLE, RoleOptions> = {
    [ROLE_WEB_ANON]: {
        login: false
    },
    [ROLE_AUTHENTICATOR]: {
        login: true
    },
}

export const SCHEMA_ROLE_GRANTS: Record<SCHEMA, Partial<Record<ROLE, SchemaPrivilege | SchemaPrivilege[] | 'ALL'>>> = {
    api: {
        web_anon: ['USAGE'],
        authenticator: ['USAGE']
    },
    auth: { 
        web_anon: ['USAGE'],
        authenticator: ['USAGE']
    },
    public: {
        web_anon: ['USAGE'],
        authenticator: ['USAGE']      
    }
}

type RoleTablePrivileges = Record<string, TablePrivilege | TablePrivilege[] | 'ALL'>
export const SCHEMA_TABLE_ROLE_GRANTS: Partial<Record<SCHEMA, Partial<Record<ROLE,  RoleTablePrivileges>>>> = {
    api: {
        authenticator: {
            organizations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
        },
    },
}





