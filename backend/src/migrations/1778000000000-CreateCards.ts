import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCards1778000000000 implements MigrationInterface {
  name = 'CreateCards1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`cards\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`column_id\` int NOT NULL, \`position\` int NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cards\` ADD CONSTRAINT \`FK_cards_column_id\` FOREIGN KEY (\`column_id\`) REFERENCES \`columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX \`IDX_cards_column_id\` ON \`cards\`(\`column_id\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_cards_column_id\` ON \`cards\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP FOREIGN KEY \`FK_cards_column_id\``);
    await queryRunner.query(`DROP TABLE \`cards\``);
  }
}