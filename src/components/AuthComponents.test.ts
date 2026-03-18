import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
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
  const FIXTURE_HTML = `
    <div id="test-auth-widget">
      <button id="auth-login" class="btn btn-small btn-primary">
        <span class="btn-text">Log In</span>
      </button>
      <button id="auth-signup" class="btn btn-small btn-neutral">
        <span class="btn-text">Sign Up</span>
      </button>
      <button id="auth-avatar" class="btn btn-icon auth-avatar-btn" hidden
        aria-label="Account menu" aria-expanded="false" aria-haspopup="menu">
        <span class="btn-text" id="auth-initials"></span>
      </button>
    </div>
  `;

  beforeEach(() => {
    document.body.innerHTML = FIXTURE_HTML;
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
    widget.setUser({ email: 'chris@example.com' } as unknown as User);

    const avatarBtn = document.getElementById(
      'auth-avatar',
    ) as HTMLButtonElement;
    const loginBtn = document.getElementById('auth-login') as HTMLButtonElement;
    const signupBtn = document.getElementById(
      'auth-signup',
    ) as HTMLButtonElement;
    expect(avatarBtn.hidden).toBe(false);
    expect(loginBtn.hidden).toBe(true);
    expect(signupBtn.hidden).toBe(true);
    expect(document.getElementById('auth-initials')!.textContent).toBe('CH');
  });

  it('does not render avatar button when no user is set', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser(null);

    const avatarBtn = document.getElementById(
      'auth-avatar',
    ) as HTMLButtonElement;
    const loginBtn = document.getElementById('auth-login') as HTMLButtonElement;
    const signupBtn = document.getElementById(
      'auth-signup',
    ) as HTMLButtonElement;
    expect(avatarBtn.hidden).toBe(true);
    expect(loginBtn.hidden).toBe(false);
    expect(signupBtn.hidden).toBe(false);
  });

  it('renders speculative disabled avatar on construction when hint is present', async () => {
    localStorage.setItem(INITIALS_HINT_KEY, 'CR');
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    new AuthWidget('test-auth-widget', authModal);

    const avatarBtn = document.getElementById(
      'auth-avatar',
    ) as HTMLButtonElement;
    expect(avatarBtn.hidden).toBe(false);
    expect(avatarBtn.disabled).toBe(true);
    expect(document.getElementById('auth-initials')!.textContent).toBe('CR');
  });

  it('leaves SSR buttons intact on construction when no hint is present', async () => {
    document.body.innerHTML = FIXTURE_HTML;

    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    new AuthWidget('test-auth-widget', authModal);

    const avatarBtn = document.getElementById(
      'auth-avatar',
    ) as HTMLButtonElement;
    const loginBtn = document.getElementById('auth-login') as HTMLButtonElement;
    const signupBtn = document.getElementById(
      'auth-signup',
    ) as HTMLButtonElement;
    expect(loginBtn.hidden).toBe(false);
    expect(signupBtn.hidden).toBe(false);
    expect(avatarBtn.hidden).toBe(true);
  });

  it('shows avatar when auth-change event fires with a user', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    new AuthWidget('test-auth-widget', authModal);

    window.dispatchEvent(
      new CustomEvent('auth-change', {
        detail: { email: 'chris@example.com' },
      }),
    );

    const avatarBtn = document.getElementById(
      'auth-avatar',
    ) as HTMLButtonElement;
    const loginBtn = document.getElementById('auth-login') as HTMLButtonElement;
    const signupBtn = document.getElementById(
      'auth-signup',
    ) as HTMLButtonElement;
    expect(avatarBtn.hidden).toBe(false);
    expect(loginBtn.hidden).toBe(true);
    expect(signupBtn.hidden).toBe(true);
    expect(document.getElementById('auth-initials')!.textContent).toBe('CH');
  });

  it('writes initials hint to localStorage when setUser is called with a user', async () => {
    const { AuthWidget } = await import('./AuthComponents');
    const { AuthModal } = await import('./AuthModal');
    const authModal = new AuthModal();
    const widget = new AuthWidget('test-auth-widget', authModal);
    widget.setUser({ email: 'chris@example.com' } as unknown as User);

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
