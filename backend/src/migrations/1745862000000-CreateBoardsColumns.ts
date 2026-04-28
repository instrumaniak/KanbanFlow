import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoardsColumns1745862000000 implements MigrationInterface {
  name = 'CreateBoardsColumns1745862000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`boards\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`background_color\` varchar(7) NOT NULL DEFAULT '#0079BF', \`user_id\` int NOT NULL, \`project_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`columns\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`position\` int NOT NULL, \`board_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD CONSTRAINT \`FK_boards_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD CONSTRAINT \`FK_boards_project_id\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`columns\` ADD CONSTRAINT \`FK_columns_board_id\` FOREIGN KEY (\`board_id\`) REFERENCES \`boards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX \`IDX_boards_user_id\` ON \`boards\`(\`user_id\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_boards_project_id\` ON \`boards\`(\`project_id\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_columns_board_id\` ON \`columns\`(\`board_id\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_columns_board_id\` ON \`columns\``);
    await queryRunner.query(`DROP INDEX \`IDX_boards_project_id\` ON \`boards\``);
    await queryRunner.query(`DROP INDEX \`IDX_boards_user_id\` ON \`boards\``);
    await queryRunner.query(`ALTER TABLE \`columns\` DROP FOREIGN KEY \`FK_columns_board_id\``);
    await queryRunner.query(`ALTER TABLE \`boards\` DROP FOREIGN KEY \`FK_boards_project_id\``);
    await queryRunner.query(`ALTER TABLE \`boards\` DROP FOREIGN KEY \`FK_boards_user_id\``);
    await queryRunner.query(`DROP TABLE \`columns\``);
    await queryRunner.query(`DROP TABLE \`boards\``);
  }
}