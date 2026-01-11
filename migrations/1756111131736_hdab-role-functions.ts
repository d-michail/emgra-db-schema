import { EMGRA_SCHEMA, ADMIN, MANAGER, ORGANIZATION_MANAGER, ORGANIZATION_USER, ROLE_WEB_ANON, ROLES } from '../init/schema';
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`SET schema '${EMGRA_SCHEMA}'`);
    pgm.createFunction('profile', [], {
        language: 'plpgsql',
        returns: 'json'        
    }, `
        DECLARE
            claims json := current_setting('request.jwt.claims', true)::json;
        BEGIN
            RETURN json_build_object(
                'role', claims->>'role'
                ,'first_name', claims->>'given_name'
                ,'last_name', claims->>'family_name'
                ,'email', claims->>'email'
            );
        END;        
      `
    );

    for (const role of [ADMIN, MANAGER, ORGANIZATION_MANAGER, ORGANIZATION_USER]) {
        pgm.sql(`GRANT EXECUTE ON FUNCTION ${EMGRA_SCHEMA}.profile TO "${role}"`)
    }

    pgm.sql(`NOTIFY pgrst, 'reload schema'`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`SET schema '${EMGRA_SCHEMA}'`)
    pgm.dropFunction('profile', []);
    pgm.sql(`NOTIFY pgrst, 'reload schema'`);
}
