// src/utils/init-header.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  buildNavItems,
  buildAuthItems,
  buildUtilityItems,
} from './init-header';
import type { User } from '@supabase/supabase-js';

// Mock dependencies that have side effects
vi.mock('../api/auth', () => ({
  signOut: vi.fn(),
  onAuthReady: vi.fn(),
}));

vi.mock('./create-score-handler', () => ({
  startNewScore: vi.fn(),
}));

const mockAuthModal: import('../components/AuthComponents').AuthModalInterface =
  { show: vi.fn() };

describe('buildNavItems', () => {
  it('returns browse and create items', () => {
    const items = buildNavItems(mockAuthModal as never);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('browse');
    expect(items[1].id).toBe('create');
  });

  it('browse item links to /', () => {
    const items = buildNavItems(mockAuthModal as never);
    expect(items[0].href).toBe('/');
  });

  it('create item calls startNewScore with authModal', async () => {
    const { startNewScore } = await import('./create-score-handler');
    const items = buildNavItems(mockAuthModal as never);
    items[1].action!();
    expect(startNewScore).toHaveBeenCalledWith(mockAuthModal);
  });

  it('create item has no href', () => {
    const items = buildNavItems(mockAuthModal as never);
    expect(items[1].href).toBeUndefined();
  });
});

describe('buildAuthItems', () => {
  it('returns login and signup items when logged out', () => {
    const items = buildAuthItems(null, mockAuthModal as never);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('login');
    expect(items[1].id).toBe('signup');
  });

  it('login item calls headerModal.show("login")', () => {
    const items = buildAuthItems(null, mockAuthModal as never);
    items[0].action!();
    expect(mockAuthModal.show).toHaveBeenCalledWith('login');
  });

  it('signup item calls headerModal.show("signup")', () => {
    const items = buildAuthItems(null, mockAuthModal as never);
    items[1].action!();
    expect(mockAuthModal.show).toHaveBeenCalledWith('signup');
  });

  it('returns email and logout items when logged in', () => {
    const user = { email: 'chris@example.com', id: 'u1' } as User;
    const items = buildAuthItems(user, mockAuthModal as never);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('account');
    expect(items[1].id).toBe('logout');
  });

  it('account item is non-interactive and shows email', () => {
    const user = { email: 'chris@example.com', id: 'u1' } as User;
    const items = buildAuthItems(user, mockAuthModal as never);
    expect(items[0].nonInteractive).toBe(true);
    expect(items[0].label).toBe('chris@example.com');
  });
});

describe('buildUtilityItems', () => {
  it('returns theme, help, and about items', () => {
    const items = buildUtilityItems();
    expect(items.map((i) => i.id)).toEqual(['theme', 'help', 'about']);
  });

  it('help item links to /help/notation-formats', () => {
    const items = buildUtilityItems();
    expect(items[1].href).toBe('/help/notation-formats');
  });

  it('about item links to /about', () => {
    const items = buildUtilityItems();
    expect(items[2].href).toBe('/about');
  });

  it('theme toggle action flips data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const items = buildUtilityItems();
    items[0].action!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    items[0].action!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
