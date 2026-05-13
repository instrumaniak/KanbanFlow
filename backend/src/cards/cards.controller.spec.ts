import { Test, TestingModule } from '@nestjs/testing';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';

describe('CardsController', () => {
  let controller: CardsController;

  type CardPayload = {
    id: number;
    title: string;
    column_id: number;
    position: number;
    created_at: string;
    updated_at: string;
  };

  type CardListResponse = { data: CardPayload[] };
  type CardMutationResponse = { data: CardPayload; message: string };

  const mockCardsService: jest.Mocked<
    Pick<CardsService, 'create' | 'findAllByColumnId' | 'update' | 'remove'>
  > = {
    create: jest.fn(),
    findAllByColumnId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [{ provide: CardsService, useValue: mockCardsService }],
    }).compile();

    controller = module.get<CardsController>(CardsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return cards for a column', async () => {
      const cards = [
        {
          id: 1,
          title: 'Card 1',
          column_id: 1,
          position: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: 'Card 2',
          column_id: 1,
          position: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockCardsService.findAllByColumnId.mockResolvedValue(cards as Card[]);

      const result = (await controller.findAll({ userId: 1 }, 1)) as CardListResponse;

      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, title: 'Card 1' }),
          expect.objectContaining({ id: 2, title: 'Card 2' }),
        ]),
      );
    });
  });

  describe('create', () => {
    it('should create a card and return response', async () => {
      const card = {
        id: 1,
        title: 'New Card',
        column_id: 1,
        position: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockCardsService.create.mockResolvedValue(card as Card);

      const result = (await controller.create(
        { userId: 1 },
        { title: 'New Card', column_id: 1 },
      )) as CardMutationResponse;

      expect(result.data).toMatchObject({
        id: 1,
        title: 'New Card',
        column_id: 1,
        position: 0,
      });
      expect(result.message).toBe('Card created');
      expect(result.data.created_at).toEqual(expect.any(String));
      expect(result.data.updated_at).toEqual(expect.any(String));
    });
  });

  describe('update', () => {
    it('should update a card and return response', async () => {
      const card = {
        id: 1,
        title: 'Updated Card',
        column_id: 1,
        position: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockCardsService.update.mockResolvedValue(card as Card);

      const result = (await controller.update({ userId: 1 }, 1, {
        title: 'Updated Card',
      })) as CardMutationResponse;

      expect(result.data).toMatchObject({
        id: 1,
        title: 'Updated Card',
        column_id: 1,
        position: 0,
      });
      expect(result.message).toBe('Card updated');
      expect(result.data.created_at).toEqual(expect.any(String));
      expect(result.data.updated_at).toEqual(expect.any(String));
    });
  });

  describe('remove', () => {
    it('should delete a card and return message', async () => {
      mockCardsService.remove.mockResolvedValue();

      const result = await controller.remove({ userId: 1 }, 1);

      expect(result).toEqual({ message: 'Card deleted' });
    });
  });
});
