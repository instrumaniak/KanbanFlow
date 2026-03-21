import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme } from './use-theme';

function mockMatchMedia(dark: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: dark,
      media: query,
      onchange: null,
      addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      },
      removeEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
      },
      dispatchEvent: vi.fn(),
    })),
  });
  return listeners;
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    mockMatchMedia(false);
  });

  it('defaults to light theme when no preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('defaults to dark when prefers-color-scheme is dark and no localStorage', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('reads from localStorage when set', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme switches between light and dark', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });

  it('toggleTheme persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('setTheme updates state and persists', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
