import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsArchivedToBoards1777411200000 implements MigrationInterface {
  name = 'AddIsArchivedToBoards1777411200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD \`is_archived\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`boards\` DROP COLUMN \`is_archived\``);
  }
}
