import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classname utility)', () => {
  it('merges simple classnames', () => {
    const result = cn('text-red-500', 'text-red-500');
    expect(result).toBe('text-red-500');
  });

  it('combines multiple classnames', () => {
    const result = cn('text-red-500', 'bg-blue-500', 'p-4');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('p-4');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('disabled-class');
  });

  it('handles undefined values', () => {
    const result = cn('base-class', undefined, 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
  });

  it('handles null values', () => {
    const result = cn('base-class', null, 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
  });

  it('handles empty strings', () => {
    const result = cn('base-class', '', 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
  });

  it('handles array of classnames', () => {
    const result = cn(['class1', 'class2', 'class3']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('handles mixed input types', () => {
    const result = cn('base', ['array1', 'array2'], { conditional: true }, undefined);
    expect(result).toContain('base');
    expect(result).toContain('array1');
    expect(result).toContain('array2');
    expect(result).toContain('conditional');
  });

  it('resolves Tailwind conflicts with tailwind-merge', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('resolves padding conflicts', () => {
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('resolves margin conflicts', () => {
    const result = cn('m-2', 'm-4', 'mt-6');
    expect(result).toContain('mt-6');
  });
});
