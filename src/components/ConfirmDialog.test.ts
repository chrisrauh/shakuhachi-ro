import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

// Minimal DOM fixture matching the markup in Layout.astro
const FIXTURE_HTML = `
  <div id="confirm-dialog-overlay" hidden>
    <div class="confirm-dialog" role="dialog" tabindex="-1">
      <h3 id="confirm-dialog-title"></h3>
      <p id="confirm-dialog-message"></p>
      <button id="confirm-dialog-cancel"><span class="btn-text">Cancel</span></button>
      <button id="confirm-dialog-confirm"><span class="btn-text">Confirm</span></button>
    </div>
  </div>
`;

describe('ConfirmDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = FIXTURE_HTML;
  });

  it('shows overlay on show()', () => {
    new ConfirmDialog().show({ title: 'T', message: 'M', onConfirm: vi.fn() });
    expect(document.getElementById('confirm-dialog-overlay')!.hidden).toBe(
      false,
    );
  });

  it('sets title and message text', () => {
    new ConfirmDialog().show({
      title: 'Delete Score',
      message: 'This cannot be undone',
      onConfirm: vi.fn(),
    });
    expect(document.getElementById('confirm-dialog-title')!.textContent).toBe(
      'Delete Score',
    );
    expect(document.getElementById('confirm-dialog-message')!.textContent).toBe(
      'This cannot be undone',
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
    expect(document.getElementById('confirm-dialog-overlay')!.hidden).toBe(
      true,
    );
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
    expect(document.getElementById('confirm-dialog-overlay')!.hidden).toBe(
      true,
    );
  });

  it('calls onCancel on Escape', () => {
    const onCancel = vi.fn();
    new ConfirmDialog().show({
      title: 'T',
      message: 'M',
      onConfirm: vi.fn(),
      onCancel,
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not leak Escape handler after confirm click', () => {
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
    // Escape after close — onCancel must NOT fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
