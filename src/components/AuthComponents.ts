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
  private container: HTMLElement;
  private authModal: AuthModalInterface;
  private currentUser: User | null = null;
  private menuDropdown: MenuDropdown;

  constructor(containerId: string, authModal: AuthModalInterface) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.authModal = authModal;
    this.menuDropdown = new MenuDropdown();
    this.attachLoggedOutListeners();

    const hint = readInitialsHint();
    if (hint) this.renderSpeculative(hint);

    window.addEventListener('auth-change', ((e: CustomEvent) => {
      this.currentUser = e.detail;
      if (this.currentUser) {
        writeInitialsHint(getInitials(this.currentUser.email ?? ''));
      } else {
        clearInitialsHint();
      }
      this.render();
    }) as EventListener);
  }

  private attachLoggedOutListeners(): void {
    const loginBtn = this.container.querySelector('#auth-login');
    const signupBtn = this.container.querySelector('#auth-signup');
    loginBtn?.addEventListener('click', () => this.authModal.show('login'));
    signupBtn?.addEventListener('click', () => this.authModal.show('signup'));
  }

  private renderSpeculative(initials: string): void {
    this.container.innerHTML = `
      <button
        class="btn btn-icon auth-avatar-btn"
        aria-label="Account menu"
        disabled
      ><span class="btn-text">${initials}</span></button>
    `;
  }

  private avatarButtonHTML(initials: string): string {
    return `
      <button
        class="btn btn-icon auth-avatar-btn"
        aria-label="Account menu"
        aria-expanded="false"
        aria-haspopup="menu"
      ><span class="btn-text">${initials}</span></button>
    `;
  }

  private render(): void {
    // Close any open dropdown before rebuilding DOM
    this.menuDropdown.hide();

    if (this.currentUser) {
      const initials = getInitials(this.currentUser.email ?? '');
      const email = this.currentUser.email ?? '';

      this.container.innerHTML = this.avatarButtonHTML(initials);

      const avatarBtn = this.container.querySelector(
        '.auth-avatar-btn',
      ) as HTMLButtonElement;

      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.menuDropdown.isOpen) {
          this.menuDropdown.hide();
          avatarBtn.setAttribute('aria-expanded', 'false');
        } else {
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
    } else {
      this.container.innerHTML = `
        <button id="auth-login" class="btn btn-small btn-primary">
          <span class="btn-text">Log In</span>
        </button>
        <button id="auth-signup" class="btn btn-small btn-neutral">
          <span class="btn-text">Sign Up</span>
        </button>
      `;

      const loginBtn = this.container.querySelector('#auth-login');
      const signupBtn = this.container.querySelector('#auth-signup');

      loginBtn?.addEventListener('click', () => this.authModal.show('login'));
      signupBtn?.addEventListener('click', () => this.authModal.show('signup'));
    }
  }

  private async handleLogout(): Promise<void> {
    await signOut();
    clearInitialsHint();
    this.currentUser = null;
    this.render();
    window.dispatchEvent(new CustomEvent('auth-change', { detail: null }));
  }

  public setUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      writeInitialsHint(getInitials(user.email ?? ''));
    } else {
      clearInitialsHint();
    }
    this.render();
  }
}
