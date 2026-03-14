import { signIn, signUp, signOut } from '../api/auth';
import type { User } from '@supabase/supabase-js';
import { STRING_FACTORIES } from '../constants/strings';

/** Derives a one-character avatar initial from an email address. */
export function getInitials(email: string): string {
  const local = email.split('@')[0];
  return local.length > 0 ? local[0].toUpperCase() : '?';
}

export class AuthModal {
  private modal: HTMLElement;
  private isLoginMode: boolean = true;

  constructor() {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--overlay-background-color);
      z-index: var(--z-index-dialog);
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div class="auth-modal-content" style="
        background: var(--panel-background-color);
        padding: var(--spacing-x-large);
        border-radius: var(--border-radius-large);
        max-width: 400px;
        width: 90%;
      ">
        <h2 id="auth-modal-title" style="margin-top: 0;">Log In</h2>
        <form id="auth-form">
          <div style="margin: var(--spacing-large) 0;">
            <label style="display: block; margin-bottom: var(--spacing-x-small);">Email</label>
            <input
              type="email"
              id="auth-email"
              required
              style="width: 100%; padding: var(--input-spacing-small); border: var(--input-border-width) solid var(--input-border-color); border-radius: var(--input-border-radius-medium); background: var(--input-background-color); color: var(--input-color); font-size: var(--input-font-size-medium); box-sizing: border-box;"
            />
          </div>
          <div style="margin: var(--spacing-large) 0;">
            <label style="display: block; margin-bottom: var(--spacing-x-small);">Password</label>
            <input
              type="password"
              id="auth-password"
              required
              minlength="6"
              style="width: 100%; padding: var(--input-spacing-small); border: var(--input-border-width) solid var(--input-border-color); border-radius: var(--input-border-radius-medium); background: var(--input-background-color); color: var(--input-color); font-size: var(--input-font-size-medium); box-sizing: border-box;"
            />
          </div>
          <div id="auth-error" style="color: var(--color-text-danger); margin: var(--spacing-small) 0; display: none;"></div>
          <div style="display: flex; gap: var(--spacing-small); margin: var(--spacing-large) 0;">
            <button
              type="button"
              id="auth-cancel"
              class="btn btn-secondary"
              style="flex: 1;"
            >
              <span class="btn-text">Cancel</span>
            </button>
            <button
              type="submit"
              id="auth-submit"
              class="btn btn-primary"
              style="flex: 1;"
            >
              <span class="btn-text">Log In</span>
            </button>
          </div>
          <div style="margin-top: var(--spacing-medium); text-align: center;">
            <button
              type="button"
              id="auth-toggle"
              class="btn btn-ghost"
            >
              <span class="btn-text">Need an account? Sign up</span>
            </button>
          </div>
        </form>
      </div>
    `;

    this.setupEventListeners(modal);
    return modal;
  }

  private setupEventListeners(modal: HTMLElement): void {
    const form = modal.querySelector('#auth-form') as HTMLFormElement;
    const toggleBtn = modal.querySelector('#auth-toggle') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#auth-cancel') as HTMLButtonElement;

    form.addEventListener('submit', (e) => this.handleSubmit(e));
    toggleBtn.addEventListener('click', () => this.toggleMode());
    cancelBtn.addEventListener('click', () => this.hide());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const email = (this.modal.querySelector('#auth-email') as HTMLInputElement)
      .value;
    const password = (
      this.modal.querySelector('#auth-password') as HTMLInputElement
    ).value;
    const errorDiv = this.modal.querySelector('#auth-error') as HTMLDivElement;
    const submitBtn = this.modal.querySelector(
      '#auth-submit',
    ) as HTMLButtonElement;

    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = this.isLoginMode
      ? 'Logging in...'
      : 'Signing up...';

    try {
      const result = this.isLoginMode
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        errorDiv.textContent = result.error.message;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = this.isLoginMode ? 'Log In' : 'Sign Up';
      } else {
        this.hide();
        window.dispatchEvent(
          new CustomEvent('auth-change', { detail: result.user }),
        );
      }
    } catch (error) {
      errorDiv.textContent =
        error instanceof Error ? error.message : 'An error occurred';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = this.isLoginMode ? 'Log In' : 'Sign Up';
    }
  }

  private toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;

    const title = this.modal.querySelector(
      '#auth-modal-title',
    ) as HTMLHeadingElement;
    const submitBtn = this.modal.querySelector(
      '#auth-submit',
    ) as HTMLButtonElement;
    const toggleBtn = this.modal.querySelector(
      '#auth-toggle',
    ) as HTMLButtonElement;
    const errorDiv = this.modal.querySelector('#auth-error') as HTMLDivElement;

    errorDiv.style.display = 'none';

    if (this.isLoginMode) {
      title.textContent = 'Log In';
      submitBtn.textContent = 'Log In';
      toggleBtn.textContent = 'Need an account? Sign up';
    } else {
      title.textContent = 'Sign Up';
      submitBtn.textContent = 'Sign Up';
      toggleBtn.textContent = 'Already have an account? Log in';
    }
  }

  public show(mode: 'login' | 'signup' = 'login'): void {
    this.isLoginMode = mode === 'login';
    this.toggleMode();
    this.toggleMode();
    this.modal.style.display = 'flex';

    const form = this.modal.querySelector('#auth-form') as HTMLFormElement;
    form.reset();

    const errorDiv = this.modal.querySelector('#auth-error') as HTMLDivElement;
    errorDiv.style.display = 'none';
  }

  public hide(): void {
    this.modal.style.display = 'none';
  }

  public destroy(): void {
    this.modal.remove();
  }
}

export class AuthWidget {
  private container: HTMLElement;
  private authModal: AuthModal;
  private currentUser: User | null = null;
  private outsideClickListener: ((e: MouseEvent) => void) | null = null;
  private escapeListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.authModal = new AuthModal();
    this.render();

    window.addEventListener('auth-change', ((e: CustomEvent) => {
      this.currentUser = e.detail;
      this.render();
    }) as EventListener);
  }

  // Expose authModal for mobile menu
  public getAuthModal(): AuthModal {
    return this.authModal;
  }

  private render(): void {
    if (this.currentUser) {
      // Clean up any open dropdown listeners before re-rendering
      if (this.outsideClickListener) {
        document.removeEventListener('click', this.outsideClickListener);
        this.outsideClickListener = null;
      }
      if (this.escapeListener) {
        document.removeEventListener('keydown', this.escapeListener);
        this.escapeListener = null;
      }

      const initials = getInitials(this.currentUser.email ?? '');
      const email = this.currentUser.email ?? '';

      this.container.innerHTML = `
        <div class="auth-avatar-wrapper" style="position: relative;">
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
          >${initials}</button>
          <div
            class="auth-avatar-dropdown"
            role="menu"
            style="
              display: none;
              position: absolute;
              top: calc(100% + var(--spacing-x-small));
              right: 0;
              min-width: 180px;
              background: var(--panel-background-color);
              border: var(--panel-border-width) solid var(--panel-border-color);
              border-radius: var(--border-radius-large);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              z-index: var(--z-index-dropdown);
              overflow: hidden;
            "
          >
            <div
              class="auth-email-display"
              style="
                padding: var(--spacing-small) var(--spacing-medium);
                font-size: var(--font-size-x-small);
                color: var(--color-text-secondary);
                border-bottom: 1px solid var(--panel-border-color);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 180px;
                box-sizing: border-box;
              "
            ></div>
            <div style="padding: var(--spacing-x-small);">
              <button
                id="auth-logout"
                class="btn btn-small btn-neutral"
                role="menuitem"
                style="width: 100%; justify-content: flex-start;"
              >
                <span class="btn-text">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const avatarBtn = this.container.querySelector(
        '.auth-avatar-btn',
      ) as HTMLButtonElement;
      const dropdown = this.container.querySelector(
        '.auth-avatar-dropdown',
      ) as HTMLElement;
      const emailDisplay = this.container.querySelector(
        '.auth-email-display',
      ) as HTMLElement;
      const logoutBtn = this.container.querySelector(
        '#auth-logout',
      ) as HTMLButtonElement;

      // Set email via textContent to avoid XSS from user-controlled input
      emailDisplay.textContent = email;

      // Toggle dropdown on avatar click
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display !== 'none';
        if (isOpen) {
          this.closeDropdown(avatarBtn, dropdown);
        } else {
          this.openDropdown(avatarBtn, dropdown);
        }
      });

      logoutBtn.addEventListener('click', () => this.handleLogout());
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

  private openDropdown(btn: HTMLButtonElement, dropdown: HTMLElement): void {
    dropdown.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');

    this.outsideClickListener = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node)) {
        this.closeDropdown(btn, dropdown);
      }
    };
    document.addEventListener('click', this.outsideClickListener);

    // Close on Escape — stored as field so it can be removed if render() fires while open
    this.escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDropdown(btn, dropdown);
      }
    };
    document.addEventListener('keydown', this.escapeListener);
  }

  private closeDropdown(btn: HTMLButtonElement, dropdown: HTMLElement): void {
    dropdown.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
    if (this.outsideClickListener) {
      document.removeEventListener('click', this.outsideClickListener);
      this.outsideClickListener = null;
    }
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }
  }

  public setUser(user: User | null): void {
    this.currentUser = user;
    this.render();
  }
}
