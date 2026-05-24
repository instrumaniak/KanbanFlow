import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndDueDateToCards1778200000000 implements MigrationInterface {
  name = 'AddDescriptionAndDueDateToCards1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`description\` text NULL`);
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`due_date\` datetime NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`due_date\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`description\``);
  }
}
