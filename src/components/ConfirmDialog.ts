export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmDialog {
  private dialogEl: HTMLDialogElement;
  private confirmBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private currentOnDismiss: (() => void) | undefined;

  constructor() {
    const dialog = document.getElementById('confirm-dialog');
    const confirmBtn = document.getElementById('confirm-dialog-confirm');
    const cancelBtn = document.getElementById('confirm-dialog-cancel');

    if (!dialog || !confirmBtn || !cancelBtn) {
      throw new Error(
        'ConfirmDialog: required elements (#confirm-dialog, #confirm-dialog-confirm, #confirm-dialog-cancel) not found',
      );
    }

    this.dialogEl = dialog as HTMLDialogElement;
    this.confirmBtn = confirmBtn as HTMLButtonElement;
    this.cancelBtn = cancelBtn as HTMLButtonElement;

    // Register cancel handler once — handles Escape key via native <dialog> cancel event.
    this.dialogEl.addEventListener('cancel', (e) => {
      // Suppress the browser's automatic close so we control the sequence explicitly.
      e.preventDefault();
      this.currentOnDismiss?.();
      this.dialogEl.close();
    });
  }

  public show(options: ConfirmDialogOptions): void {
    this.currentOnDismiss = options.onCancel;

    // Populate dynamic content — textContent is XSS-safe
    const titleEl = document.getElementById('confirm-dialog-title');
    const messageEl = document.getElementById('confirm-dialog-message');
    if (titleEl) titleEl.textContent = options.title;
    if (messageEl) messageEl.textContent = options.message;

    // Update button labels — target .btn-text span to preserve text-box-trim wrapper
    const confirmText = this.confirmBtn.querySelector('.btn-text');
    const cancelText = this.cancelBtn.querySelector('.btn-text');
    if (confirmText) confirmText.textContent = options.confirmText ?? 'Confirm';
    if (cancelText) cancelText.textContent = options.cancelText ?? 'Cancel';

    // Wire per-call callbacks via .onclick (replaces previous handler, no accumulation)
    this.confirmBtn.onclick = () => {
      options.onConfirm();
      this.dialogEl.close();
    };
    this.cancelBtn.onclick = () => {
      options.onCancel?.();
      this.dialogEl.close();
    };

    this.dialogEl.showModal();
  }
}
