import { Test, TestingModule } from '@nestjs/testing';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';

describe('CardsController', () => {
  let controller: CardsController;
  let cardsService: jest.Mocked<CardsService>;

  const mockCardsService = {
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
    cardsService = module.get(CardsService);
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
      cardsService.findAllByColumnId.mockResolvedValue(cards as Card[]);

      const result = await controller.findAll({ userId: 1 }, 1);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1, title: 'Card 1' }),
          expect.objectContaining({ id: 2, title: 'Card 2' }),
        ]),
      });
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
      cardsService.create.mockResolvedValue(card as Card);

      const result = await controller.create({ userId: 1 }, { title: 'New Card', column_id: 1 });

      expect(result).toEqual({
        data: {
          id: 1,
          title: 'New Card',
          column_id: 1,
          position: 0,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
        message: 'Card created',
      });
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
      cardsService.update.mockResolvedValue(card as Card);

      const result = await controller.update({ userId: 1 }, 1, { title: 'Updated Card' });

      expect(result).toEqual({
        data: {
          id: 1,
          title: 'Updated Card',
          column_id: 1,
          position: 0,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
        message: 'Card updated',
      });
    });
  });

  describe('remove', () => {
    it('should delete a card and return message', async () => {
      cardsService.remove.mockResolvedValue();

      const result = await controller.remove({ userId: 1 }, 1);

      expect(result).toEqual({ message: 'Card deleted' });
    });
  });
});
