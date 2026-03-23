import { signIn, signUp } from '../api/auth';
import { BaseDialog } from './BaseDialog';

export class AuthModal extends BaseDialog {
  private overlayEl: HTMLElement;
  private form: HTMLFormElement;
  private titleEl: HTMLHeadingElement;
  private emailInput: HTMLInputElement;
  private passwordInput: HTMLInputElement;
  private errorDiv: HTMLDivElement;
  private submitBtn: HTMLButtonElement;
  private submitBtnText: HTMLElement;
  private cancelBtn: HTMLButtonElement;
  private toggleBtn: HTMLButtonElement;
  private toggleBtnText: HTMLElement;
  private isLoginMode: boolean = true;

  constructor() {
    super();

    const overlay = document.getElementById('auth-modal-overlay');
    const form = document.getElementById('auth-form');
    const titleEl = document.getElementById('auth-modal-title');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit');
    const cancelBtn = document.getElementById('auth-cancel');
    const toggleBtn = document.getElementById('auth-toggle');
    const submitBtnText = submitBtn?.querySelector('.btn-text') ?? null;
    const toggleBtnText = toggleBtn?.querySelector('.btn-text') ?? null;

    if (
      !overlay ||
      !form ||
      !titleEl ||
      !emailInput ||
      !passwordInput ||
      !errorDiv ||
      !submitBtn ||
      !cancelBtn ||
      !toggleBtn ||
      !submitBtnText ||
      !toggleBtnText
    ) {
      throw new Error(
        'AuthModal: required elements not found — ensure SiteHeader.astro is rendered',
      );
    }

    this.overlayEl = overlay;
    this.form = form as HTMLFormElement;
    this.titleEl = titleEl as HTMLHeadingElement;
    this.emailInput = emailInput as HTMLInputElement;
    this.passwordInput = passwordInput as HTMLInputElement;
    this.errorDiv = errorDiv as HTMLDivElement;
    this.submitBtn = submitBtn as HTMLButtonElement;
    this.submitBtnText = submitBtnText as HTMLElement;
    this.cancelBtn = cancelBtn as HTMLButtonElement;
    this.toggleBtn = toggleBtn as HTMLButtonElement;
    this.toggleBtnText = toggleBtnText as HTMLElement;

    // Wire listeners once — these never change between show() calls
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.cancelBtn.addEventListener('click', () => this.hide());
    this.toggleBtn.addEventListener('click', () => this.toggleMode());
  }

  public show(mode: 'login' | 'signup' = 'login'): void {
    this.isLoginMode = mode === 'login';
    this.updateModeUI(); // clears error state before reset
    this.form.reset();
    this.openOverlay(this.overlayEl);
  }

  public hide(): void {
    this.closeOverlay();
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const email = this.emailInput.value;
    const password = this.passwordInput.value;

    this.errorDiv.hidden = true;
    this.submitBtn.disabled = true;
    this.submitBtnText.textContent = this.isLoginMode
      ? 'Logging in...'
      : 'Signing up...';

    try {
      const result = this.isLoginMode
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        this.errorDiv.textContent = result.error.message;
        this.errorDiv.hidden = false;
        this.submitBtn.disabled = false;
        this.submitBtnText.textContent = this.isLoginMode
          ? 'Log In'
          : 'Sign Up';
      } else {
        this.hide();
        window.dispatchEvent(
          new CustomEvent('auth-change', { detail: result.user }),
        );
      }
    } catch (error) {
      this.errorDiv.textContent =
        error instanceof Error ? error.message : 'An error occurred';
      this.errorDiv.hidden = false;
      this.submitBtn.disabled = false;
      this.submitBtnText.textContent = this.isLoginMode ? 'Log In' : 'Sign Up';
    }
  }

  private updateModeUI(): void {
    this.errorDiv.hidden = true;

    if (this.isLoginMode) {
      this.titleEl.textContent = 'Log In';
      this.submitBtnText.textContent = 'Log In';
      this.toggleBtnText.textContent = 'Need an account? Sign up';
    } else {
      this.titleEl.textContent = 'Sign Up';
      this.submitBtnText.textContent = 'Sign Up';
      this.toggleBtnText.textContent = 'Already have an account? Log in';
    }
  }

  private toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.updateModeUI();
  }
}
