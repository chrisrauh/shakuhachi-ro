export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmDialog {
  private overlay: HTMLElement | null = null;
  private dialog: HTMLElement | null = null;

  constructor() {
    this.addStyles();
  }

  public show(options: ConfirmDialogOptions): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'confirm-dialog-overlay';

    // Create dialog
    this.dialog = document.createElement('div');
    this.dialog.className = 'confirm-dialog';
    this.dialog.innerHTML = `
      <div class="confirm-dialog-header">
        <h3 class="confirm-dialog-title">${this.escapeHtml(options.title)}</h3>
      </div>
      <div class="confirm-dialog-body">
        <p class="confirm-dialog-message">${this.escapeHtml(options.message)}</p>
      </div>
      <div class="confirm-dialog-footer">
        <button class="btn btn-secondary confirm-dialog-cancel">
          ${this.escapeHtml(options.cancelText || 'Cancel')}
        </button>
        <button class="btn btn-primary confirm-dialog-confirm">
          ${this.escapeHtml(options.confirmText || 'Confirm')}
        </button>
      </div>
    `;

    // Attach to DOM
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    // Setup event listeners
    const confirmBtn = this.dialog.querySelector(
      '.confirm-dialog-confirm',
    ) as HTMLButtonElement;
    const cancelBtn = this.dialog.querySelector(
      '.confirm-dialog-cancel',
    ) as HTMLButtonElement;

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        options.onConfirm();
        this.close();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (options.onCancel) {
          options.onCancel();
        }
        this.close();
      });
    }

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        if (options.onCancel) {
          options.onCancel();
        }
        this.close();
      }
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (options.onCancel) {
          options.onCancel();
        }
        this.close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.dialog = null;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private addStyles(): void {
    if (document.getElementById('confirm-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'confirm-dialog-styles';
    style.textContent = `
      @keyframes confirm-dialog-appear {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .confirm-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-large);
        animation: 0.15s ease-out confirm-dialog-appear;
      }

      .confirm-dialog {
        background: var(--page-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: var(--border-radius-large);
        box-shadow: var(--shadow-x-large);
        max-width: 400px;
        width: 100%;
        animation: 0.2s cubic-bezier(0.33, 1, 0.68, 1) confirm-dialog-appear;
      }

      .confirm-dialog-header {
        padding: 0 var(--spacing-large) var(--spacing-large);
        border-bottom: 1px solid var(--color-border);
      }

      .confirm-dialog-title {
        margin: 0;
        font-size: var(--font-size-medium);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .confirm-dialog-body {
        padding: var(--spacing-large);
      }

      .confirm-dialog-message {
        margin: 0;
        font-size: var(--font-size-base);
        color: var(--color-text-secondary);
        line-height: var(--line-height-normal);
      }

      .confirm-dialog-footer {
        padding: var(--spacing-large);
        border-top: 1px solid var(--color-border);
        display: flex;
        gap: var(--spacing-small);
        justify-content: flex-end;
      }

      .confirm-dialog-cancel,
      .confirm-dialog-confirm {
        min-width: 80px;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .confirm-dialog {
          max-width: 100%;
        }

        .confirm-dialog-header,
        .confirm-dialog-body,
        .confirm-dialog-footer {
          padding: var(--spacing-medium);
        }

        .confirm-dialog-footer {
          flex-direction: column-reverse;
        }

        .confirm-dialog-cancel,
        .confirm-dialog-confirm {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
