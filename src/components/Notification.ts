export type NotificationType = 'success' | 'error' | 'warning' | 'info';

class NotificationManager {
  private container: HTMLElement | null = null;

  constructor() {
    this.addStyles();
  }

  show(message: string, type: NotificationType, duration: number): void {
    this.ensureContainer();

    const el = document.createElement('div');
    el.className = `notification notification--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="notification-message">${this.escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Dismiss">&times;</button>
    `;

    this.container!.appendChild(el);

    const close = () => this.dismiss(el);
    el.querySelector('.notification-close')?.addEventListener('click', close);

    if (duration > 0) {
      setTimeout(close, duration);
    }
  }

  private dismiss(el: HTMLElement): void {
    if (el.classList.contains('notification--dismissing')) return;
    el.classList.add('notification--dismissing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  private ensureContainer(): void {
    if (!this.container) {
      this.container = document.getElementById(
        'notification-container',
      ) as HTMLElement | null;
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
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
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes notification-slide-in {
        from {
          transform: translateX(calc(100% + var(--spacing-medium)));
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes notification-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(calc(100% + var(--spacing-medium)));
          opacity: 0;
        }
      }

      .notification-container {
        position: fixed;
        top: var(--spacing-medium);
        right: var(--spacing-medium);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-x-small);
        pointer-events: none;
        max-width: 320px;
        width: calc(100% - 2 * var(--spacing-medium));
      }

      .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-small);
        padding: var(--spacing-small) var(--spacing-medium);
        border-radius: var(--border-radius-large);
        border: 1px solid transparent;
        box-shadow: var(--shadow-medium);
        font-size: var(--font-size-small);
        pointer-events: auto;
        animation: notification-slide-in var(--transition-medium) ease-out;
      }

      .notification--dismissing {
        animation: notification-slide-out var(--transition-medium) ease-in forwards;
      }

      .notification--success {
        background: var(--color-bg-success);
        color: var(--color-text-success);
      }

      .notification--error {
        background: var(--color-bg-danger);
        color: var(--color-text-danger);
      }

      .notification--warning {
        background: var(--color-bg-warning);
        color: var(--color-text-warning);
      }

      .notification--info {
        background: var(--panel-background-color);
        color: var(--color-text-secondary);
        border-color: var(--panel-border-color);
      }

      .notification-message {
        flex: 1;
        line-height: var(--line-height-normal);
      }

      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        font-size: var(--font-size-medium);
        padding: 0;
        line-height: 1;
        flex-shrink: 0;
      }

      .notification-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
}

let _manager: NotificationManager | null = null;

export function showNotification(
  message: string,
  type: NotificationType = 'info',
  duration = 4000,
): void {
  if (!_manager) _manager = new NotificationManager();
  _manager.show(message, type, duration);
}
