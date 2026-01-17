import {
  RoleOptions,
  SchemaPrivilege,
  TablePrivilege,
} from "node-pg-migrate";

export const API_SCHEMA = "api";
export const PUBLIC_SCHEMA = "public";
export const ROLE_WEB_ANON = "web_anon";

export const schemas = [API_SCHEMA, PUBLIC_SCHEMA] as const;
export const createSchemas = [API_SCHEMA] as const;
