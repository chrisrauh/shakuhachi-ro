import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInitials } from './AuthComponents';

describe('getInitials', () => {
  it('returns first character of local part, uppercased', () => {
    expect(getInitials('chris@example.com')).toBe('C');
  });

  it('works with dots in local part', () => {
    expect(getInitials('john.doe@example.com')).toBe('J');
  });

  it('works with plus-sign aliases', () => {
    expect(getInitials('chris+test@rauh.net')).toBe('C');
  });

  it('returns ? when local part is empty', () => {
    expect(getInitials('@example.com')).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });
});

describe('AuthWidget avatar render', () => {
  beforeEach(() => {
    // AuthWidget reads from document, so set up a minimal DOM
    document.body.innerHTML = '<div id="test-auth-widget"></div>';
    // Stub AuthModal to avoid full modal setup in unit tests
    vi.mock('../api/auth', () => ({
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }));
  });

  it('renders avatar button with initials when user is set', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const widget = new AuthWidget('test-auth-widget');
    widget.setUser({ email: 'chris@example.com' } as never);

    const container = document.getElementById('test-auth-widget')!;
    const avatarBtn = container.querySelector('.auth-avatar-btn');
    expect(avatarBtn).not.toBeNull();
    expect(avatarBtn!.textContent?.trim()).toBe('C');
  });

  it('does not render avatar button when no user is set', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const widget = new AuthWidget('test-auth-widget');
    widget.setUser(null);

    const container = document.getElementById('test-auth-widget')!;
    expect(container.querySelector('.auth-avatar-btn')).toBeNull();
  });
});
