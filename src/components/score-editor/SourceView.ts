import type { ScoreDataFormat } from '../../api/scores';

interface SourceViewCallbacks {
  onInput: (source: string) => void;
  onFormatChange: (format: ScoreDataFormat) => void;
}

/**
 * The score editor's source view: the score as stored, as editable text, with
 * the format it is in. Owns only the DOM; the editor owns the source and decides
 * what a change means.
 */
export class SourceView {
  private section: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private validation: HTMLElement;
  private validationMessage: HTMLElement;
  private formatRadios: HTMLInputElement[];

  constructor({ onInput, onFormatChange }: SourceViewCallbacks) {
    this.section = byId('source-view');
    this.textarea = byId<HTMLTextAreaElement>('score-data-input');
    this.validation = byId('validation-error');
    this.validationMessage = byId('validation-message');
    this.formatRadios = [
      ...this.section.querySelectorAll<HTMLInputElement>(
        'input[name="format"]',
      ),
    ];

    this.textarea.addEventListener('input', () => onInput(this.textarea.value));
    for (const radio of this.formatRadios) {
      radio.addEventListener('change', () =>
        onFormatChange(radio.value as ScoreDataFormat),
      );
    }
  }

  get visible(): boolean {
    return !this.section.hidden;
  }

  set visible(visible: boolean) {
    this.section.hidden = !visible;
  }

  setSource(source: string, format: ScoreDataFormat): void {
    this.textarea.value = source;
    for (const radio of this.formatRadios) {
      radio.checked = radio.value === format;
    }
  }

  /** The reason the source can't be read, or null to clear it. Set as text: it can quote the source. */
  showValidation(error: string | null): void {
    this.validationMessage.textContent = error ?? '';
    this.validation.hidden = !error;
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`SourceView: #${id} not found`);
  return el as T;
}
