import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

const INITIALS_HINT_KEY = 'shakuhachi-auth-initials';

describe('AuthWidget avatar render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-auth-widget"></div>';
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders avatar button with initials when user is set', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser({ email: 'chris@example.com' } as never);

    const container = document.getElementById('test-auth-widget')!;
    const avatarBtn = container.querySelector('.auth-avatar-btn');
    expect(avatarBtn).not.toBeNull();
    expect(avatarBtn!.textContent?.trim()).toBe('CH');
  });

  it('does not render avatar button when no user is set', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser(null);

    const container = document.getElementById('test-auth-widget')!;
    expect(container.querySelector('.auth-avatar-btn')).toBeNull();
  });

  it('renders speculative disabled avatar on construction when hint is present', async () => {
    localStorage.setItem(INITIALS_HINT_KEY, 'CR');
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    new AuthWidget('test-auth-widget', authModal);

    const container = document.getElementById('test-auth-widget')!;
    const avatarBtn = container.querySelector(
      '.auth-avatar-btn',
    ) as HTMLButtonElement;
    expect(avatarBtn).not.toBeNull();
    expect(avatarBtn.textContent?.trim()).toBe('CR');
    expect(avatarBtn.disabled).toBe(true);
  });

  it('leaves SSR buttons intact on construction when no hint is present', async () => {
    document.body.innerHTML = `
      <div id="test-auth-widget">
        <div>
          <button id="auth-login">Log In</button>
          <button id="auth-signup">Sign Up</button>
        </div>
      </div>
    `;
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    new AuthWidget('test-auth-widget', authModal);

    const container = document.getElementById('test-auth-widget')!;
    expect(container.querySelector('#auth-login')).not.toBeNull();
    expect(container.querySelector('.auth-avatar-btn')).toBeNull();
  });

  it('writes initials hint to localStorage when setUser is called with a user', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser({ email: 'chris@example.com' } as never);

    expect(localStorage.getItem(INITIALS_HINT_KEY)).toBe('CH');
  });

  it('removes initials hint from localStorage when setUser is called with null', async () => {
    localStorage.setItem(INITIALS_HINT_KEY, 'CR');
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser(null);

    expect(localStorage.getItem(INITIALS_HINT_KEY)).toBeNull();
  });

  it('degrades gracefully when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();

    expect(() => new AuthWidget('test-auth-widget', authModal)).not.toThrow();

    vi.restoreAllMocks();
  });
});
