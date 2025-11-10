import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Shakuhachi Music Note Web Component
 *
 * Displays a shakuhachi note in multiple formats:
 * - Romanized name (Ro, Tsu, Re, Chi, Ri)
 * - Japanese Katakana (ロ, ツ, レ, チ, リ)
 * - Hand-written style SVG (optional)
 *
 * Usage:
 *   <music-note pitch="d" display-mode="all"></music-note>
 *   <music-note pitch="g" display-mode="name"></music-note>
 *
 * @fires note-click - Dispatched when the note is clicked
 */
@customElement('music-note')
export class MusicNote extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    :host(:hover) {
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .romanized {
      font-weight: 600;
      font-size: 1rem;
      color: #333;
    }

    .katakana {
      font-size: 1.5rem;
      color: #666;
    }

    .svg-container {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .svg-container svg {
      max-width: 100%;
      max-height: 100%;
    }

    .hidden {
      display: none;
    }
  `;

  /**
   * The Western pitch notation (d, f, g, a, c)
   */
  @property({ type: String })
  pitch = '';

  /**
   * Display mode: 'all', 'name', 'katakana', 'svg'
   */
  @property({ type: String, attribute: 'display-mode' })
  displayMode: 'all' | 'name' | 'katakana' | 'svg' = 'all';

  /**
   * Optional note string with duration (e.g., "d'8")
   */
  @property({ type: String, attribute: 'note-string' })
  noteString = '';

  private getNoteInfo() {
    const p = this.noteString ? this.noteString.substring(0, 1) : this.pitch;

    const noteMap: Record<string, { name: string; katakana: string; svgPath?: string }> = {
      'd': { name: 'Ro', katakana: 'ロ', svgPath: '/svgs/Japanese_Katakana_kyokashotai_RO.svg' },
      'f': { name: 'Tsu', katakana: 'ツ', svgPath: '/svgs/Japanese_Katakana_kyokashotai_TU.svg' },
      'g': { name: 'Re', katakana: 'レ', svgPath: '/svgs/Japanese_Katakana_kyokashotai_RE.svg' },
      'a': { name: 'Chi', katakana: 'チ', svgPath: '/svgs/Japanese_Katakana_kyokashotai_TI.svg' },
      'c': { name: 'Ri', katakana: 'リ', svgPath: '/svgs/Japanese_Katakana_kyokashotai_RI.svg' }
    };

    return noteMap[p] || { name: p, katakana: p };
  }

  private handleClick() {
    this.dispatchEvent(new CustomEvent('note-click', {
      detail: {
        pitch: this.pitch,
        noteString: this.noteString,
        ...this.getNoteInfo()
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const note = this.getNoteInfo();
    const showName = this.displayMode === 'all' || this.displayMode === 'name';
    const showKatakana = this.displayMode === 'all' || this.displayMode === 'katakana';
    const showSvg = this.displayMode === 'all' || this.displayMode === 'svg';

    return html`
      <div @click=${this.handleClick}>
        <div class="${showName ? 'romanized' : 'hidden'}">
          ${note.name}
        </div>
        <div class="${showKatakana ? 'katakana' : 'hidden'}">
          ${note.katakana}
        </div>
        ${showSvg && note.svgPath ? html`
          <div class="svg-container">
            <img src="${note.svgPath}" alt="${note.name}" />
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'music-note': MusicNote;
  }
}
