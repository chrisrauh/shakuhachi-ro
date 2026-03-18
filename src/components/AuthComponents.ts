import { signOut } from '../api/auth';
import type { User } from '@supabase/supabase-js';
import { STRING_FACTORIES } from '../constants/strings';
import { MenuDropdown } from './MenuDropdown';
import { User as UserIcon, LogOut as LogOutIcon } from 'lucide';
import { getIconHTML } from '../utils/icons';

export interface AuthModalInterface {
  show(mode: 'login' | 'signup'): void;
}

const INITIALS_HINT_KEY = 'shakuhachi-auth-initials';

function readInitialsHint(): string | null {
  try {
    return localStorage.getItem(INITIALS_HINT_KEY);
  } catch {
    return null;
  }
}

function writeInitialsHint(initials: string): void {
  try {
    localStorage.setItem(INITIALS_HINT_KEY, initials);
  } catch {
    /* degrade gracefully — e.g. Safari private browsing */
  }
}

function clearInitialsHint(): void {
  try {
    localStorage.removeItem(INITIALS_HINT_KEY);
  } catch {
    /* degrade gracefully */
  }
}

/** Derives a one- or two-character avatar initial from an email address. */
export function getInitials(email: string): string {
  const local = email.split('@')[0];
  if (local.length === 0) return '?';
  return local.slice(0, 2).toUpperCase();
}

export class AuthWidget {
  private authModal: AuthModalInterface;
  private currentUser: User | null = null;
  private menuDropdown: MenuDropdown;
  private loginBtn: HTMLButtonElement;
  private signupBtn: HTMLButtonElement;
  private avatarBtn: HTMLButtonElement;
  private initialsEl: HTMLElement;

  constructor(containerId: string, authModal: AuthModalInterface) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.authModal = authModal;
    this.menuDropdown = new MenuDropdown();

    // Look up required elements — throw immediately if any are missing
    const loginBtn = document.getElementById('auth-login');
    const signupBtn = document.getElementById('auth-signup');
    const avatarBtn = document.getElementById('auth-avatar');
    const initialsEl = document.getElementById('auth-initials');

    if (!loginBtn || !signupBtn || !avatarBtn || !initialsEl) {
      throw new Error(
        'AuthWidget: required elements (#auth-login, #auth-signup, #auth-avatar, #auth-initials) not found in document',
      );
    }

    this.loginBtn = loginBtn as HTMLButtonElement;
    this.signupBtn = signupBtn as HTMLButtonElement;
    this.avatarBtn = avatarBtn as HTMLButtonElement;
    this.initialsEl = initialsEl as HTMLElement;

    // Login / signup listeners — attached once, never rebuilt
    loginBtn.addEventListener('click', () => this.authModal.show('login'));
    signupBtn.addEventListener('click', () => this.authModal.show('signup'));

    // Avatar click: toggle dropdown
    // e.stopPropagation() is required — without it the document-level click-outside
    // handler fires immediately and closes the dropdown before it can open
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.menuDropdown.isOpen) {
        this.menuDropdown.hide();
        avatarBtn.setAttribute('aria-expanded', 'false');
      } else {
        // email read at click time (not bind time) — this.currentUser is guaranteed
        // non-null here because the avatar is only visible after showLoggedIn() was called
        const email = this.currentUser?.email ?? '';
        this.menuDropdown.show(
          [
            [
              {
                id: 'email',
                label: email,
                nonInteractive: true,
                icon: getIconHTML(UserIcon),
              },
              {
                id: 'logout',
                label: 'Log Out',
                action: () => this.handleLogout(),
                icon: getIconHTML(LogOutIcon),
              },
            ],
          ],
          {
            anchor: avatarBtn,
            onClose: () => avatarBtn.setAttribute('aria-expanded', 'false'),
          },
        );
        avatarBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Speculative display: if a localStorage hint exists, show a disabled avatar
    // immediately so logged-in users don't see a flash of the logged-out state
    // while the auth round-trip is in flight
    const hint = readInitialsHint();
    if (hint) this.showLoggedIn(hint, true);

    // auth-change is dispatched by AuthModal after login and by handleLogout() after logout.
    // Session expiry goes through onAuthReady → setUser(), NOT through this event.
    window.addEventListener('auth-change', ((e: CustomEvent) => {
      if (e.detail !== null) {
        this.currentUser = e.detail;
        const initials = getInitials(e.detail.email ?? '');
        writeInitialsHint(initials);
        this.showLoggedIn(initials);
      } else {
        this.currentUser = null;
        clearInitialsHint(); // no-op when called after handleLogout() — kept for safety
        this.showLoggedOut();
      }
    }) as EventListener);
  }

  private showLoggedIn(initials: string, disabled = false): void {
    this.initialsEl.textContent = initials;
    this.avatarBtn.disabled = disabled; // DOM property (not setAttribute) to avoid "false" string footgun
    this.loginBtn.hidden = true;
    this.signupBtn.hidden = true;
    this.avatarBtn.hidden = false;
  }

  private showLoggedOut(): void {
    // Close dropdown before hiding button — onClose callback resets aria-expanded
    // synchronously (dispatchEvent is sync), so aria state is clean before hidden is set
    this.menuDropdown.hide();
    this.avatarBtn.hidden = true;
    this.loginBtn.hidden = false;
    this.signupBtn.hidden = false;
  }

  public setUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      const initials = getInitials(user.email ?? '');
      writeInitialsHint(initials);
      this.showLoggedIn(initials);
    } else {
      clearInitialsHint();
      this.showLoggedOut();
    }
  }

  private async handleLogout(): Promise<void> {
    await signOut();
    clearInitialsHint();
    this.currentUser = null;
    // auth-change fires synchronously — listener calls showLoggedOut()
    // and notifies other components (e.g. MobileMenu)
    window.dispatchEvent(new CustomEvent('auth-change', { detail: null }));
  }
}
