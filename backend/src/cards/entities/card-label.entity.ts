import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { Label } from '../../labels/entities/label.entity';

@Entity('card_labels')
export class CardLabel {
  @ManyToOne(() => Card, (card) => card.cardLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @PrimaryColumn({ name: 'card_id', type: 'int' })
  cardId!: number;

  @ManyToOne(() => Label, (label) => label.cardLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'label_id' })
  label!: Label;

  @PrimaryColumn({ name: 'label_id', type: 'int' })
  labelId!: number;
}
