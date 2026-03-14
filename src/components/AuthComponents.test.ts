import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInitials } from './AuthComponents';

describe('getInitials', () => {
  it('returns first two characters of local part, uppercased', () => {
    expect(getInitials('chris@example.com')).toBe('CH');
  });

  it('works with dots in local part', () => {
    expect(getInitials('john.doe@example.com')).toBe('JO');
  });

  it('works with plus-sign aliases', () => {
    expect(getInitials('chris+test@rauh.net')).toBe('CH');
  });

  it('returns single character when local part has only one character', () => {
    expect(getInitials('j@example.com')).toBe('J');
  });

  it('returns ? when local part is empty', () => {
    expect(getInitials('@example.com')).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });
});

// vi.mock must be at top level — not inside beforeEach — for Vitest hoisting to work
vi.mock('../api/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

describe('AuthWidget avatar render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-auth-widget"></div>';
  });

  it('renders avatar button with initials when user is set', async () => {
    const { AuthWidget, HeaderModal } = await import('./AuthComponents');
    const headerModal = new HeaderModal();
    const widget = new AuthWidget('test-auth-widget', headerModal);
    widget.setUser({ email: 'chris@example.com' } as never);

    const container = document.getElementById('test-auth-widget')!;
    const avatarBtn = container.querySelector('.auth-avatar-btn');
    expect(avatarBtn).not.toBeNull();
    expect(avatarBtn!.textContent?.trim()).toBe('CH');
  });

  it('does not render avatar button when no user is set', async () => {
    const { AuthWidget, HeaderModal } = await import('./AuthComponents');
    const headerModal = new HeaderModal();
    const widget = new AuthWidget('test-auth-widget', headerModal);
    widget.setUser(null);

    const container = document.getElementById('test-auth-widget')!;
    expect(container.querySelector('.auth-avatar-btn')).toBeNull();
  });
});
