import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

describe('CreateProjectDto', () => {
  it('should validate a valid project name', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: 'My Project' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty name', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should reject null name', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: null as unknown as string });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject undefined name', async () => {
    const dto = plainToInstance(CreateProjectDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject name exceeding 255 characters', async () => {
    const longName = 'a'.repeat(256);
    const dto = plainToInstance(CreateProjectDto, { name: longName });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toBeDefined();
  });

  it('should accept name with exactly 255 characters', async () => {
    const maxName = 'a'.repeat(255);
    const dto = plainToInstance(CreateProjectDto, { name: maxName });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject non-string name', async () => {
    const dto = plainToInstance(CreateProjectDto, { name: 123 as unknown as string });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateProjectDto', () => {
  it('should validate a valid project name', async () => {
    const dto = plainToInstance(UpdateProjectDto, { name: 'Updated Project' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should allow empty object (no fields)', async () => {
    const dto = plainToInstance(UpdateProjectDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty string name', async () => {
    const dto = plainToInstance(UpdateProjectDto, { name: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject name exceeding 255 characters', async () => {
    const longName = 'a'.repeat(256);
    const dto = plainToInstance(UpdateProjectDto, { name: longName });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string name', async () => {
    const dto = plainToInstance(UpdateProjectDto, { name: 123 as unknown as string });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
