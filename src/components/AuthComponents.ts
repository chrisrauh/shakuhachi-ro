import { signIn, signUp, signOut } from '../api/auth';
import type { User } from '@supabase/supabase-js';

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
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div class="auth-modal-content" style="
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
      ">
        <h2 id="auth-modal-title">Log In</h2>
        <form id="auth-form">
          <div style="margin: 20px 0;">
            <label style="display: block; margin-bottom: 5px;">Email</label>
            <input
              type="email"
              id="auth-email"
              required
              style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
            />
          </div>
          <div style="margin: 20px 0;">
            <label style="display: block; margin-bottom: 5px;">Password</label>
            <input
              type="password"
              id="auth-password"
              required
              minlength="6"
              style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
            />
          </div>
          <div id="auth-error" style="color: #e74c3c; margin: 10px 0; display: none;"></div>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button
              type="submit"
              id="auth-submit"
              style="flex: 1; padding: 10px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Log In
            </button>
            <button
              type="button"
              id="auth-cancel"
              style="flex: 1; padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Cancel
            </button>
          </div>
          <div style="margin-top: 15px; text-align: center;">
            <button
              type="button"
              id="auth-toggle"
              style="background: none; border: none; color: #3498db; cursor: pointer; text-decoration: underline;"
            >
              Need an account? Sign up
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

    const email = (
      this.modal.querySelector('#auth-email') as HTMLInputElement
    ).value;
    const password = (
      this.modal.querySelector('#auth-password') as HTMLInputElement
    ).value;
    const errorDiv = this.modal.querySelector(
      '#auth-error'
    ) as HTMLDivElement;
    const submitBtn = this.modal.querySelector(
      '#auth-submit'
    ) as HTMLButtonElement;

    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = this.isLoginMode ? 'Logging in...' : 'Signing up...';

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
          new CustomEvent('auth-change', { detail: result.user })
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
      '#auth-modal-title'
    ) as HTMLHeadingElement;
    const submitBtn = this.modal.querySelector(
      '#auth-submit'
    ) as HTMLButtonElement;
    const toggleBtn = this.modal.querySelector(
      '#auth-toggle'
    ) as HTMLButtonElement;
    const errorDiv = this.modal.querySelector(
      '#auth-error'
    ) as HTMLDivElement;

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

    const errorDiv = this.modal.querySelector(
      '#auth-error'
    ) as HTMLDivElement;
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

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.authModal = new AuthModal();
    this.render();

    window.addEventListener('auth-change', ((e: CustomEvent) => {
      this.currentUser = e.detail;
      this.render();
    }) as EventListener);
  }

  private render(): void {
    if (this.currentUser) {
      this.container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span>${this.currentUser.email}</span>
          <button id="auth-logout" style="padding: 5px 10px; cursor: pointer;">
            Log Out
          </button>
        </div>
      `;

      const logoutBtn = this.container.querySelector('#auth-logout');
      logoutBtn?.addEventListener('click', () => this.handleLogout());
    } else {
      this.container.innerHTML = `
        <div style="display: flex; gap: 10px;">
          <button id="auth-login" style="padding: 5px 15px; cursor: pointer;">
            Log In
          </button>
          <button id="auth-signup" style="padding: 5px 15px; cursor: pointer;">
            Sign Up
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
