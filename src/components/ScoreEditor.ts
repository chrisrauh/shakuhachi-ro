import { ScoreRenderer } from '../renderer/ScoreRenderer';
import { createScore, updateScore, getScore } from '../api/scores';
import { authState } from '../api/authState';
import { renderIcon, initIcons } from '../utils/icons';
import type { ScoreDataFormat } from '../api/scores';

interface ScoreMetadata {
  title: string;
  composer: string;
  description: string;
}

export class ScoreEditor {
  private container: HTMLElement;
  private scoreData: string = '';
  private dataFormat: ScoreDataFormat = 'musicxml';
  private metadata: ScoreMetadata = {
    title: '',
    composer: '',
    description: '',
  };
  private validationError: string | null = null;
  private isEditing: boolean = false;
  private editingScoreId: string | null = null;
  private autoSaveInterval: number | null = null;

  constructor(containerId: string, scoreId?: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    if (scoreId) {
      this.loadExistingScore(scoreId);
    } else {
      this.loadFromLocalStorage();
    }

    this.render();
    this.setupAutoSave();
    this.setupThemeListener();
  }

  private setupThemeListener(): void {
    // Use MutationObserver to watch for theme class changes on <html>
    const observer = new MutationObserver(() => {
      // Re-render preview when theme changes
      this.updatePreview();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private async loadExistingScore(scoreId: string): Promise<void> {
    const result = await getScore(scoreId);

    if (result.error || !result.score) {
      alert(
        `Error loading score: ${result.error?.message || 'Score not found'}`,
      );
      return;
    }

    const score = result.score;
    this.isEditing = true;
    this.editingScoreId = scoreId;
    this.dataFormat = score.data_format;
    this.metadata = {
      title: score.title,
      composer: score.composer || '',
      description: score.description || '',
    };

    // Convert data to string based on format
    if (this.dataFormat === 'json') {
      this.scoreData = JSON.stringify(score.data, null, 2);
    } else {
      this.scoreData = score.data;
    }

    this.render();
    this.updatePreview();
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('shakuhachi-editor-autosave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.scoreData = data.scoreData || '';
        this.dataFormat = data.dataFormat || 'musicxml';
        this.metadata = data.metadata || this.metadata;
      } catch (error) {
        console.error('Failed to load autosave:', error);
      }
    }
  }

  private setupAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = window.setInterval(() => {
      this.saveToLocalStorage();
    }, 30000);
  }

  private saveToLocalStorage(): void {
    const data = {
      scoreData: this.scoreData,
      dataFormat: this.dataFormat,
      metadata: this.metadata,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('shakuhachi-editor-autosave', JSON.stringify(data));
  }

  private validateScoreData(): boolean {
    if (!this.scoreData.trim()) {
      this.validationError = null;
      return false;
    }

    try {
      if (this.dataFormat === 'json') {
        JSON.parse(this.scoreData);
        this.validationError = null;
        return true;
      } else {
        // Basic XML validation
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.scoreData, 'text/xml');
        const parseError = doc.querySelector('parsererror');

        if (parseError) {
          this.validationError = 'Invalid MusicXML format';
          return false;
        }

        this.validationError = null;
        return true;
      }
    } catch (error) {
      this.validationError =
        error instanceof Error ? error.message : 'Invalid format';
      return false;
    }
  }

  private handleDataChange(newData: string): void {
    this.scoreData = newData;
    this.validateScoreData();
    this.renderValidation();
    this.updatePreview();
  }

  private handleFormatChange(format: ScoreDataFormat): void {
    if (this.scoreData.trim() && this.dataFormat !== format) {
      const confirmChange = confirm(
        'Switching formats will clear the current editor content. Continue?',
      );
      if (!confirmChange) return;
      this.scoreData = '';
    }

    this.dataFormat = format;
    this.render();
  }

  private handleMetadataChange(field: keyof ScoreMetadata, value: any): void {
    (this.metadata as any)[field] = value;
    // Don't re-render - just update internal state
  }

  private async updatePreview(): Promise<void> {
    // Check for external preview container (new edit page)
    const externalPreview = document.getElementById('score-preview');

    // If external preview exists, use it directly
    if (externalPreview && !this.container.contains(externalPreview)) {
      // External preview mode (side-by-side edit page)
      if (!this.validateScoreData() || !this.scoreData.trim()) {
        externalPreview.innerHTML = `
          <div class="preview-placeholder">
            <p>Preview will appear here</p>
            <p class="preview-hint">Enter valid ${
              this.dataFormat === 'json' ? 'JSON' : 'MusicXML'
            } score data to see the preview</p>
          </div>
        `;
        return;
      }

      try {
        externalPreview.innerHTML = ''; // Clear existing content

        if (this.dataFormat === 'json') {
          const data = JSON.parse(this.scoreData);

          // Read theme-aware colors from CSS variables
          const noteColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-text-primary')
            .trim();
          const debugLabelColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-text-tertiary')
            .trim();

          const renderer = new ScoreRenderer(externalPreview, {
            noteColor: noteColor || '#000',
            debugLabelColor: debugLabelColor || '#999',
          });

          await renderer.renderFromScoreData(data);
        } else if (this.dataFormat === 'musicxml') {
          // Parse MusicXML to ScoreData using MusicXMLParser
          const { MusicXMLParser } = await import('../parser/MusicXMLParser');
          const scoreData = MusicXMLParser.parse(this.scoreData);

          const noteColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-neutral-700')
            .trim();
          const debugLabelColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-neutral-500')
            .trim();

          const renderer = new ScoreRenderer(externalPreview, {
            noteColor: noteColor || '#000',
            debugLabelColor: debugLabelColor || '#999',
          });

          await renderer.renderFromScoreData(scoreData);
        }
      } catch (error) {
        externalPreview.innerHTML = `
          <div class="preview-error">
            <p>Preview Error</p>
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        `;
      }
      return;
    }

    // Internal preview mode (original /editor page)
    const previewContainer = this.container.querySelector(
      '#preview-pane',
    ) as HTMLElement;

    if (!previewContainer) return;

    if (!this.validateScoreData() || !this.scoreData.trim()) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <p>Preview will appear here</p>
          <p class="preview-hint">Enter valid ${
            this.dataFormat === 'json' ? 'JSON' : 'MusicXML'
          } score data to see the preview</p>
        </div>
      `;
      return;
    }

    try {
      previewContainer.innerHTML = '<div id="score-preview"></div>';
      const scorePreview = document.getElementById('score-preview');

      if (!scorePreview) return;

      if (this.dataFormat === 'json') {
        const data = JSON.parse(this.scoreData);

        // Read theme-aware colors from CSS variables
        const noteColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-primary')
          .trim();
        const debugLabelColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-tertiary')
          .trim();

        const renderer = new ScoreRenderer(scorePreview, {
          noteColor: noteColor || '#000',
          debugLabelColor: debugLabelColor || '#999',
        });

        await renderer.renderFromScoreData(data);
      } else {
        // For MusicXML, we'd need to parse it properly
        // For now, show a placeholder
        previewContainer.innerHTML = `
          <div class="preview-placeholder">
            <p>MusicXML Preview</p>
            <p class="preview-hint">MusicXML rendering will be implemented soon</p>
          </div>
        `;
      }
    } catch (error) {
      previewContainer.innerHTML = `
        <div class="preview-error">
          <p>Preview Error</p>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }

  private async handleSave(): Promise<void> {
    if (!authState.isAuthenticated()) {
      alert('Please log in to save scores');
      return;
    }

    if (!this.metadata.title.trim()) {
      alert('Please enter a title for the score');
      return;
    }

    if (!this.validateScoreData()) {
      alert('Please fix validation errors before saving');
      return;
    }

    const saveBtn = this.container.querySelector(
      '#save-btn',
    ) as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const data =
        this.dataFormat === 'json'
          ? JSON.parse(this.scoreData)
          : this.scoreData;

      const scoreData = {
        title: this.metadata.title,
        composer: this.metadata.composer || undefined,
        description: this.metadata.description || undefined,
        data_format: this.dataFormat,
        data: data,
      };

      let result;
      if (this.isEditing && this.editingScoreId) {
        result = await updateScore(this.editingScoreId, scoreData);
      } else {
        result = await createScore(scoreData);
      }

      if (result.error) {
        alert(`Error saving score: ${result.error.message}`);
      } else {
        // Clear autosave
        localStorage.removeItem('shakuhachi-editor-autosave');

        alert(`Score ${this.isEditing ? 'updated' : 'created'} successfully!`);

        // Redirect to library
        window.location.href = '/';
      }
    } catch (error) {
      alert(
        `Error saving score: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = this.isEditing ? 'Update Score' : 'Save Score';
      }
    }
  }

  private render(): void {
    // Check if external preview exists
    const hasExternalPreview =
      document.getElementById('score-preview') !== null;

    this.container.innerHTML = `
      <div class="score-editor">
        <div class="editor-header">
          <h1>${this.isEditing ? 'Edit Score' : 'Create New Score'}</h1>
          <div class="editor-actions">
            <button id="save-btn" class="btn btn-primary">
              ${this.isEditing ? 'Update Score' : 'Save Score'}
            </button>
            <a href="/" class="btn btn-secondary">Cancel</a>
          </div>
        </div>

        <div class="editor-metadata" id="editor-metadata">
          ${this.renderMetadataHTML()}
        </div>

        <div class="editor-main">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <h2>Score Data</h2>
              <div class="format-toggle">
                <label>
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    ${this.dataFormat === 'json' ? 'checked' : ''}
                  />
                  JSON
                </label>
                <label>
                  <input
                    type="radio"
                    name="format"
                    value="musicxml"
                    ${this.dataFormat === 'musicxml' ? 'checked' : ''}
                  />
                  MusicXML
                </label>
              </div>
            </div>
            <div id="validation-error" class="validation-error"></div>
            <textarea
              id="score-data-input"
              placeholder="Enter ${
                this.dataFormat === 'json' ? 'JSON' : 'MusicXML'
              } score data here..."
            >${this.scoreData}</textarea>
          </div>

          ${
            !hasExternalPreview
              ? `<div class="preview-pane" id="preview-pane">
            <div class="preview-placeholder">
              <p>Preview will appear here</p>
              <p class="preview-hint">Enter valid score data to see the preview</p>
            </div>
          </div>`
              : ''
          }
        </div>
      </div>
    `;

    this.addStyles();
    this.attachEventListeners();
    this.renderValidation();
    this.updatePreview();
  }

  private renderMetadataHTML(): string {
    return `
      <div class="metadata-grid">
        <div class="metadata-field">
          <label for="title-input">Title *</label>
          <input
            type="text"
            id="title-input"
            value="${this.escapeHtml(this.metadata.title)}"
            placeholder="Score title"
            required
          />
        </div>

        <div class="metadata-field">
          <label for="composer-input">Composer</label>
          <input
            type="text"
            id="composer-input"
            value="${this.escapeHtml(this.metadata.composer)}"
            placeholder="Composer name"
          />
        </div>

        <div class="metadata-field metadata-field-full">
          <label for="description-input">Description</label>
          <textarea
            id="description-input"
            placeholder="Brief description of the score"
            rows="3"
          >${this.escapeHtml(this.metadata.description)}</textarea>
        </div>
      </div>
    `;
  }

  private renderValidation(): void {
    const validationDiv = this.container.querySelector('#validation-error');
    if (validationDiv) {
      if (this.validationError) {
        validationDiv.innerHTML = `${renderIcon('alert-circle')} ${
          this.validationError
        }`;
        validationDiv.classList.add('show');
        initIcons();
      } else {
        validationDiv.textContent = '';
        validationDiv.classList.remove('show');
      }
    }
  }

  private attachEventListeners(): void {
    // Score data input
    const textarea = this.container.querySelector(
      '#score-data-input',
    ) as HTMLTextAreaElement;
    textarea?.addEventListener('input', (e) => {
      this.handleDataChange((e.target as HTMLTextAreaElement).value);
    });

    // Format toggle
    const formatRadios = this.container.querySelectorAll(
      'input[name="format"]',
    );
    formatRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.handleFormatChange(
          (e.target as HTMLInputElement).value as ScoreDataFormat,
        );
      });
    });

    // Save button
    const saveBtn = this.container.querySelector('#save-btn');
    saveBtn?.addEventListener('click', () => this.handleSave());

    this.attachMetadataListeners();
  }

  private attachMetadataListeners(): void {
    // Title
    this.container
      .querySelector('#title-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange(
          'title',
          (e.target as HTMLInputElement).value,
        );
      });

    // Composer
    this.container
      .querySelector('#composer-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange(
          'composer',
          (e.target as HTMLInputElement).value,
        );
      });

    // Description
    this.container
      .querySelector('#description-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange(
          'description',
          (e.target as HTMLTextAreaElement).value,
        );
      });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private addStyles(): void {
    if (document.getElementById('score-editor-styles')) return;

    const style = document.createElement('style');
    style.id = 'score-editor-styles';

    // Check if we're in external preview mode
    const hasExternalPreview =
      document.getElementById('score-preview') !== null;

    style.textContent = `
      .score-editor {
        ${hasExternalPreview ? '' : 'max-width: 1600px; margin: 0 auto;'}
        padding: ${hasExternalPreview ? '0' : 'var(--spacing-large)'};
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .editor-header {
        display: ${hasExternalPreview ? 'none' : 'flex'};
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-x-large);
        padding-bottom: var(--spacing-large);
        border-bottom: 2px solid var(--color-border);
      }

      .editor-header h1 {
        margin: 0;
        font-size: var(--font-size-2x-large);
        font-weight: var(--font-weight-light);
        color: var(--color-text-primary);
      }

      .editor-actions {
        display: flex;
        gap: var(--spacing-small);
      }

      .btn {
        padding: var(--spacing-x-small) var(--spacing-small);
        border-radius: var(--border-radius-medium);
        cursor: pointer;
        font-size: var(--font-size-small);
        text-decoration: none;
        display: inline-block;
        transition: background var(--transition-fast);
      }

      .btn-primary {
        background: var(--color-primary-600);
        color: var(--color-text-on-dark);
        border: none;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--color-primary-700);
      }

      .btn-primary:disabled {
        background: var(--color-text-disabled);
        cursor: not-allowed;
      }

      .btn-secondary {
        background: var(--color-bg-active);
        color: var(--color-text-primary);
        border: var(--input-border-width) solid var(--color-border);
      }

      .btn-secondary:hover {
        background: var(--color-neutral-300);
      }

      .editor-metadata {
        background: var(--panel-background-color);
        padding: var(--spacing-large);
        border-radius: var(--border-radius-large);
        margin-bottom: var(--spacing-large);
        border: var(--panel-border-width) solid var(--panel-border-color);
        flex-shrink: 0;
      }

      .metadata-grid {
        display: grid;
        grid-template-columns: ${hasExternalPreview ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))'};
        gap: var(--spacing-medium);
      }

      .metadata-field-full {
        grid-column: 1 / -1;
      }

      .metadata-field label {
        display: block;
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-x-small);
        color: var(--color-text-primary);
      }

      .metadata-field input,
      .metadata-field select,
      .metadata-field textarea {
        width: 100%;
        padding: var(--input-spacing-small);
        border: var(--input-border-width) solid var(--input-border-color);
        border-radius: var(--input-border-radius-medium);
        font-size: var(--input-font-size-medium);
        background: var(--input-background-color);
        color: var(--input-color);
      }

      .metadata-field textarea {
        min-height: 80px;
        resize: vertical;
      }

      .editor-main {
        display: grid;
        grid-template-columns: ${hasExternalPreview ? '1fr' : '1fr 1fr'};
        gap: var(--spacing-large);
        ${hasExternalPreview ? 'flex: 1; min-height: 0;' : 'height: calc(100vh - 400px); min-height: 500px;'}
      }

      .editor-pane {
        display: flex;
        flex-direction: column;
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: var(--border-radius-large);
        overflow: hidden;
        background: var(--panel-background-color);
        ${hasExternalPreview ? 'min-height: 0;' : ''}
      }

      .editor-pane-header {
        background: var(--color-bg-hover);
        padding: var(--spacing-medium) var(--spacing-large);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: var(--panel-border-width) solid var(--panel-border-color);
        flex-shrink: 0;
      }

      .editor-pane-header h2 {
        margin: 0;
        font-size: var(--font-size-large);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .format-toggle {
        display: flex;
        gap: var(--spacing-medium);
      }

      .format-toggle label {
        display: flex;
        align-items: center;
        gap: var(--spacing-x-small);
        cursor: pointer;
        color: var(--color-text-primary);
      }

      .validation-error {
        background: var(--color-bg-danger);
        color: var(--color-text-danger);
        padding: 0;
        margin: 0;
        max-height: 0;
        overflow: hidden;
        transition: all var(--transition-medium);
        flex-shrink: 0;
      }

      .validation-error.show {
        display: flex;
        align-items: center;
        gap: var(--spacing-x-small);
        padding: var(--spacing-small) var(--spacing-large);
        max-height: 100px;
      }

      .validation-error svg {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }

      #score-data-input {
        flex: 1;
        padding: var(--spacing-large);
        border: none;
        font-family: var(--font-mono);
        font-size: var(--font-size-small);
        resize: none;
        outline: none;
        background: var(--input-background-color);
        color: var(--input-color);
        min-height: 0;
        width: 100%;
      }

      .preview-pane {
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: var(--border-radius-large);
        overflow: auto;
        background: var(--panel-background-color);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-placeholder,
      .preview-error {
        text-align: center;
        color: var(--color-text-tertiary);
        padding: var(--spacing-3x-large);
      }

      .preview-placeholder p:first-child,
      .preview-error p:first-child {
        font-size: var(--font-size-large);
        margin-bottom: var(--spacing-small);
        color: var(--color-text-secondary);
      }

      .preview-hint {
        font-size: var(--font-size-small);
      }

      .preview-error {
        color: var(--color-text-danger);
      }

      #score-preview {
        padding: var(--spacing-large);
        width: 100%;
        height: 100%;
      }

      @media (max-width: 1024px) {
        .editor-main {
          grid-template-columns: 1fr;
          height: auto;
        }

        .editor-pane,
        .preview-pane {
          min-height: 400px;
        }
      }

      @media (max-width: 768px) {
        .editor-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-medium);
        }

        .metadata-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  public destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    // Event listeners auto-cleaned when element is removed
  }
}
