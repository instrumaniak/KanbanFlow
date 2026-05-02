import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionsTable1778100000000 implements MigrationInterface {
  name = 'AddSessionsTable1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`session\` (\`expiredAt\` bigint NOT NULL, \`id\` varchar(255) NOT NULL, \`json\` text NOT NULL, \`destroyedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`CREATE INDEX \`IDX_session_expiredAt\` ON \`session\`(\`expiredAt\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_session_expiredAt\` ON \`session\``);
    await queryRunner.query(`DROP TABLE \`session\``);
  }
}
