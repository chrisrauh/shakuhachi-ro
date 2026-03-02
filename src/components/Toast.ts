/**
 * Toast Notification System
 *
 * Inspired by Sonner toast library by Emil Kowalski
 * https://github.com/emilkowalski/sonner
 *
 * Design decisions based on Sonner's implementation:
 * - Standard "toast" terminology (not "notification")
 * - Clean API: toast.error(), toast.success(), etc.
 * - duration: Infinity for persistent toasts (more intuitive than 0)
 * - Consistent shadow across themes for better depth perception
 * - Mobile: vertical slide animation (down from top)
 * - Desktop: horizontal slide animation (in from right)
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number; // Default: 4000, use Infinity for no auto-dismiss
}

class ToastManager {
  private container: HTMLElement | null = null;

  constructor() {
    this.addStyles();
  }

  show(message: string, type: ToastType, duration: number): void {
    this.ensureContainer();

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    this.container!.appendChild(el);

    const close = () => this.dismiss(el);
    el.querySelector('.toast-close')?.addEventListener('click', close);

    // Only auto-dismiss if duration is positive and not Infinity
    if (duration > 0 && duration !== Infinity) {
      setTimeout(close, duration);
    }
  }

  private dismiss(el: HTMLElement): void {
    if (el.classList.contains('toast--dismissing')) return;
    el.classList.add('toast--dismissing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  private ensureContainer(): void {
    if (!this.container) {
      this.container = document.getElementById(
        'toast-container',
      ) as HTMLElement | null;
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(this.container);
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private addStyles(): void {
    if (document.getElementById('toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      /* Desktop animations - slide in from right */
      @keyframes toast-slide-in {
        from {
          transform: translateX(calc(100% + 24px));
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toast-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(calc(100% + 24px));
          opacity: 0;
        }
      }

      /* Mobile animations - slide down from top */
      @media (max-width: 600px) {
        @keyframes toast-slide-in {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes toast-slide-out {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      }

      .toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 14px;
        pointer-events: none;
        max-width: 356px;
        width: calc(100% - 48px);
      }

      /* Mobile responsive */
      @media (max-width: 600px) {
        .toast-container {
          top: 16px;
          right: 16px;
          left: 16px;
          max-width: none;
          width: auto;
        }
      }

      .toast {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 14px;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        line-height: 1.4;
        font-weight: 500;
        pointer-events: auto;
        animation: toast-slide-in 250ms ease-out;
      }

      /* Focus state for accessibility */
      .toast:focus-visible {
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1),
                    0 0 0 2px rgba(0, 0, 0, 0.2);
        outline: none;
      }

      .toast--dismissing {
        animation: toast-slide-out 250ms ease-in forwards;
      }

      /* Success variant */
      .toast--success {
        background: var(--color-bg-success);
        color: var(--color-text-success);
        border-color: var(--color-border-success);
      }

      /* Error variant */
      .toast--error {
        background: var(--color-bg-danger);
        color: var(--color-text-danger);
        border-color: var(--color-border-danger);
      }

      /* Warning variant */
      .toast--warning {
        background: var(--color-bg-warning);
        color: var(--color-text-warning);
        border-color: var(--color-border-warning);
      }

      /* Info variant */
      .toast--info {
        background: var(--panel-background-color);
        color: var(--color-text-secondary);
        border-color: var(--panel-border-color);
      }

      .toast-message {
        flex: 1;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        font-size: 16px;
        padding: 0;
        line-height: 1;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-close:hover {
        opacity: 1;
      }

      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .toast {
          animation: none;
        }
        .toast--dismissing {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

let _manager: ToastManager | null = null;

function ensureManager(): ToastManager {
  if (!_manager) _manager = new ToastManager();
  return _manager;
}

// Sonner-inspired toast API with variant methods
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 4000;
    ensureManager().show(message, 'success', duration);
  },
  error: (message: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 4000;
    ensureManager().show(message, 'error', duration);
  },
  warning: (message: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 4000;
    ensureManager().show(message, 'warning', duration);
  },
  info: (message: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 4000;
    ensureManager().show(message, 'info', duration);
  },
};
