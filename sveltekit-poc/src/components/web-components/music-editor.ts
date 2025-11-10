import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Interactive Music Editor Web Component
 *
 * A simple editor for shakuhachi notation that demonstrates
 * how an interactive component would work for future features
 * like score editing, forking, etc.
 *
 * Usage:
 *   <music-editor value="d'8 g'8 g'4. a'8"></music-editor>
 *
 * @fires change - Dispatched when the notation changes
 * @fires save - Dispatched when the save button is clicked
 */
@customElement('music-editor')
export class MusicEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1rem;
      background: white;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .editor-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .editor-actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    button:hover {
      background: #f5f5f5;
    }

    button.primary {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    button.primary:hover {
      background: #1d4ed8;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 1rem;
      resize: vertical;
    }

    textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .preview {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .preview-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .preview-notes {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .status {
      font-size: 0.875rem;
      color: #6b7280;
      font-style: italic;
    }
  `;

  /**
   * The musical notation value
   */
  @property({ type: String })
  value = '';

  /**
   * Title of the piece being edited
   */
  @property({ type: String })
  title = 'Untitled Piece';

  /**
   * Whether the editor is in read-only mode
   */
  @property({ type: Boolean, attribute: 'read-only' })
  readOnly = false;

  @state()
  private isDirty = false;

  @state()
  private lastSaved: Date | null = null;

  private handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
    this.isDirty = true;

    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }

  private handleSave() {
    this.lastSaved = new Date();
    this.isDirty = false;

    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        value: this.value,
        title: this.title,
        savedAt: this.lastSaved
      },
      bubbles: true,
      composed: true
    }));
  }

  private handleFork() {
    this.dispatchEvent(new CustomEvent('fork', {
      detail: {
        value: this.value,
        title: this.title
      },
      bubbles: true,
      composed: true
    }));
  }

  private parseNotes() {
    return this.value.split(' ').filter(note => note.length > 0);
  }

  render() {
    const notes = this.parseNotes();

    return html`
      <div class="editor-header">
        <h2 class="editor-title">${this.title}</h2>
        <div class="editor-actions">
          <button @click=${this.handleFork} ?disabled=${this.readOnly}>
            Fork
          </button>
          <button
            class="primary"
            @click=${this.handleSave}
            ?disabled=${!this.isDirty || this.readOnly}
          >
            ${this.isDirty ? 'Save *' : 'Saved'}
          </button>
        </div>
      </div>

      <div class="editor-content">
        <textarea
          .value=${this.value}
          @input=${this.handleInput}
          ?readonly=${this.readOnly}
          placeholder="Enter notation (e.g., d'8 g'8 g'4. a'8)"
          spellcheck="false"
        ></textarea>

        <div class="preview">
          <div class="preview-label">Preview (${notes.length} notes)</div>
          <div class="preview-notes">
            ${notes.map(note => html`
              <music-note note-string="${note}" display-mode="katakana"></music-note>
            `)}
          </div>
        </div>

        ${this.lastSaved ? html`
          <div class="status">
            Last saved: ${this.lastSaved.toLocaleTimeString()}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'music-editor': MusicEditor;
  }
}
