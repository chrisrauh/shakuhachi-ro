import { signOut } from '../api/auth';
import type { User } from '@supabase/supabase-js';
import { STRING_FACTORIES } from '../constants/strings';
import { MenuDropdown } from './MenuDropdown';
import { createElement, User as UserIcon, LogOut as LogOutIcon } from 'lucide';
import { AuthModal } from './AuthModal';

/** Derives a one- or two-character avatar initial from an email address. */
export function getInitials(email: string): string {
  const local = email.split('@')[0];
  if (local.length === 0) return '?';
  return local.slice(0, 2).toUpperCase();
}

function getIconHTML(
  iconComponent: Parameters<typeof createElement>[0],
): string {
  const icon = createElement(iconComponent);
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('stroke-width', '2');
  return icon.outerHTML;
}

export class AuthWidget {
  private container: HTMLElement;
  private authModal: AuthModal;
  private currentUser: User | null = null;
  private menuDropdown: MenuDropdown;

  constructor(containerId: string, authModal: AuthModal) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.authModal = authModal;
    this.menuDropdown = new MenuDropdown();
    this.render();

    window.addEventListener('auth-change', ((e: CustomEvent) => {
      this.currentUser = e.detail;
      this.render();
    }) as EventListener);
  }

  private render(): void {
    // Close any open dropdown before rebuilding DOM
    this.menuDropdown.hide();

    if (this.currentUser) {
      const initials = getInitials(this.currentUser.email ?? '');
      const email = this.currentUser.email ?? '';

      this.container.innerHTML = `
        <button
          class="btn btn-icon auth-avatar-btn"
          aria-label="Account menu"
          aria-expanded="false"
          aria-haspopup="menu"
          style="
            border-radius: var(--border-radius-circle);
            width: 32px;
            height: 32px;
            background: var(--color-bg-active);
            border-color: var(--color-border);
            color: var(--color-text-primary);
            font-size: var(--font-size-medium);
            font-weight: var(--font-weight-normal);
            line-height: 1;
            user-select: none;
            flex-shrink: 0;
          "
        ><span class="btn-text">${initials}</span></button>
      `;

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
        <div style="display: flex; gap: var(--spacing-small);">
          <button id="auth-login" class="btn btn-small btn-primary">
            <span class="btn-text">Log In</span>
          </button>
          <button id="auth-signup" class="btn btn-small btn-neutral">
            <span class="btn-text">Sign Up</span>
          </button>
        </div>
      `;

      const loginBtn = this.container.querySelector('#auth-login');
      const signupBtn = this.container.querySelector('#auth-signup');

      loginBtn?.addEventListener('click', () => this.authModal.show('login'));
      signupBtn?.addEventListener('click', () => this.authModal.show('signup'));
    }
  }

  private async handleLogout(): Promise<void> {
    await signOut();
    this.currentUser = null;
    this.render();
    window.dispatchEvent(new CustomEvent('auth-change', { detail: null }));
  }

  public setUser(user: User | null): void {
    this.currentUser = user;
    this.render();
  }
}
