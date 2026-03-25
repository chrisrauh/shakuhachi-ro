import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

// Fixture matches the <dialog> markup in Layout.astro
const FIXTURE_HTML = `
  <dialog id="confirm-dialog">
    <h3 id="confirm-dialog-title"></h3>
    <p id="confirm-dialog-message"></p>
    <button id="confirm-dialog-cancel"><span class="btn-text">Cancel</span></button>
    <button id="confirm-dialog-confirm"><span class="btn-text">Confirm</span></button>
  </dialog>
`;

describe('ConfirmDialog', () => {
  let dialog: HTMLDialogElement;

  beforeEach(() => {
    document.body.innerHTML = FIXTURE_HTML;
    // jsdom does not implement showModal/close — stub them
    dialog = document.getElementById('confirm-dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
  });

  it('calls showModal on show()', () => {
    new ConfirmDialog().show({ title: 'T', message: 'M', onConfirm: vi.fn() });
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });

  it('sets title and message text', () => {
    new ConfirmDialog().show({
      title: 'Delete Score',
      message: 'Cannot be undone',
      onConfirm: vi.fn(),
    });
    expect(document.getElementById('confirm-dialog-title')!.textContent).toBe(
      'Delete Score',
    );
    expect(document.getElementById('confirm-dialog-message')!.textContent).toBe(
      'Cannot be undone',
    );
  });

  it('uses default button labels when confirmText/cancelText not provided', () => {
    new ConfirmDialog().show({ title: 'T', message: 'M', onConfirm: vi.fn() });
    expect(
      document.querySelector('#confirm-dialog-confirm .btn-text')!.textContent,
    ).toBe('Confirm');
    expect(
      document.querySelector('#confirm-dialog-cancel .btn-text')!.textContent,
    ).toBe('Cancel');
  });

  it('uses custom confirmText and cancelText', () => {
    new ConfirmDialog().show({
      title: 'T',
      message: 'M',
      confirmText: 'Restore',
      cancelText: 'Discard',
      onConfirm: vi.fn(),
    });
    expect(
      document.querySelector('#confirm-dialog-confirm .btn-text')!.textContent,
    ).toBe('Restore');
    expect(
      document.querySelector('#confirm-dialog-cancel .btn-text')!.textContent,
    ).toBe('Discard');
  });

  it('calls onConfirm and closes on confirm click', () => {
    const onConfirm = vi.fn();
    new ConfirmDialog().show({ title: 'T', message: 'M', onConfirm });
    (
      document.getElementById('confirm-dialog-confirm') as HTMLButtonElement
    ).click();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('calls onCancel and closes on cancel click', () => {
    const onCancel = vi.fn();
    new ConfirmDialog().show({
      title: 'T',
      message: 'M',
      onConfirm: vi.fn(),
      onCancel,
    });
    (
      document.getElementById('confirm-dialog-cancel') as HTMLButtonElement
    ).click();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Escape (cancel event)', () => {
    const onCancel = vi.fn();
    new ConfirmDialog().show({
      title: 'T',
      message: 'M',
      onConfirm: vi.fn(),
      onCancel,
    });
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when confirm button clicked', () => {
    const onCancel = vi.fn();
    new ConfirmDialog().show({
      title: 'T',
      message: 'M',
      onConfirm: vi.fn(),
      onCancel,
    });
    (
      document.getElementById('confirm-dialog-confirm') as HTMLButtonElement
    ).click();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
