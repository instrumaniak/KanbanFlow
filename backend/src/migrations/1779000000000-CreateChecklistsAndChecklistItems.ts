import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChecklistsAndChecklistItems1779000000000 implements MigrationInterface {
  name = 'CreateChecklistsAndChecklistItems1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`checklists\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`card_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`checklist_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` varchar(255) NOT NULL, \`is_completed\` tinyint NOT NULL DEFAULT 0, \`checklist_id\` int NOT NULL, \`position\` int NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`checklists\` ADD CONSTRAINT \`FK_checklists_card_id\` FOREIGN KEY (\`card_id\`) REFERENCES \`cards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`checklist_items\` ADD CONSTRAINT \`FK_checklist_items_checklist_id\` FOREIGN KEY (\`checklist_id\`) REFERENCES \`checklists\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_checklists_card_id\` ON \`checklists\`(\`card_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_checklist_items_checklist_id\` ON \`checklist_items\`(\`checklist_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`checklist_items\` DROP FOREIGN KEY \`FK_checklist_items_checklist_id\``);
    await queryRunner.query(`ALTER TABLE \`checklists\` DROP FOREIGN KEY \`FK_checklists_card_id\``);
    await queryRunner.query(`DROP INDEX \`IDX_checklist_items_checklist_id\` ON \`checklist_items\``);
    await queryRunner.query(`DROP INDEX \`IDX_checklists_card_id\` ON \`checklists\``);
    await queryRunner.query(`DROP TABLE \`checklist_items\``);
    await queryRunner.query(`DROP TABLE \`checklists\``);
  }
}
