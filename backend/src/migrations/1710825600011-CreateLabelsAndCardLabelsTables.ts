import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabelsAndCardLabelsTables1710825600011 implements MigrationInterface {
  name = 'CreateLabelsAndCardLabelsTables1710825600011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`labels\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`color\` varchar(20) NOT NULL, \`user_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`card_labels\` (\`card_id\` int NOT NULL, \`label_id\` int NOT NULL, PRIMARY KEY (\`card_id\`, \`label_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`labels\` ADD CONSTRAINT \`FK_labels_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`card_labels\` ADD CONSTRAINT \`FK_card_labels_card_id\` FOREIGN KEY (\`card_id\`) REFERENCES \`cards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`card_labels\` ADD CONSTRAINT \`FK_card_labels_label_id\` FOREIGN KEY (\`label_id\`) REFERENCES \`labels\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`card_labels\` DROP FOREIGN KEY \`FK_card_labels_label_id\``);
    await queryRunner.query(`ALTER TABLE \`card_labels\` DROP FOREIGN KEY \`FK_card_labels_card_id\``);
    await queryRunner.query(`ALTER TABLE \`labels\` DROP FOREIGN KEY \`FK_labels_user_id\``);
    await queryRunner.query(`DROP TABLE \`card_labels\``);
    await queryRunner.query(`DROP TABLE \`labels\``);
  }
}
