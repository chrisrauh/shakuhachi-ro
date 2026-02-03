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
    description: ''
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
  }

  private async loadExistingScore(scoreId: string): Promise<void> {
    const result = await getScore(scoreId);

    if (result.error || !result.score) {
      alert(`Error loading score: ${result.error?.message || 'Score not found'}`);
      return;
    }

    const score = result.score;
    this.isEditing = true;
    this.editingScoreId = scoreId;
    this.dataFormat = score.data_format;
    this.metadata = {
      title: score.title,
      composer: score.composer || '',
      description: score.description || ''
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
      timestamp: new Date().toISOString()
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
        'Switching formats will clear the current editor content. Continue?'
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

  private updatePreview(): void {
    const previewContainer = this.container.querySelector(
      '#preview-pane'
    ) as HTMLElement;

    if (!previewContainer) return;

    if (!this.validateScoreData() || !this.scoreData.trim()) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <p>Preview will appear here</p>
          <p class="preview-hint">Enter valid ${this.dataFormat === 'json' ? 'JSON' : 'MusicXML'} score data to see the preview</p>
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
        new ScoreRenderer(scorePreview, data);
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
      '#save-btn'
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
        data: data
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

        alert(
          `Score ${this.isEditing ? 'updated' : 'created'} successfully!`
        );

        // Redirect to library
        window.location.href = '/';
      }
    } catch (error) {
      alert(
        `Error saving score: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = this.isEditing ? 'Update Score' : 'Save Score';
      }
    }
  }

  private render(): void {
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
              placeholder="Enter ${this.dataFormat === 'json' ? 'JSON' : 'MusicXML'} score data here..."
            >${this.scoreData}</textarea>
          </div>

          <div class="preview-pane" id="preview-pane">
            <div class="preview-placeholder">
              <p>Preview will appear here</p>
              <p class="preview-hint">Enter valid score data to see the preview</p>
            </div>
          </div>
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
        validationDiv.innerHTML = `${renderIcon('alert-circle')} ${this.validationError}`;
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
      '#score-data-input'
    ) as HTMLTextAreaElement;
    textarea?.addEventListener('input', (e) => {
      this.handleDataChange((e.target as HTMLTextAreaElement).value);
    });

    // Format toggle
    const formatRadios = this.container.querySelectorAll(
      'input[name="format"]'
    );
    formatRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.handleFormatChange(
          (e.target as HTMLInputElement).value as ScoreDataFormat
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
    this.container.querySelector('#title-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange('title', (e.target as HTMLInputElement).value);
      });

    // Composer
    this.container.querySelector('#composer-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange('composer', (e.target as HTMLInputElement).value);
      });

    // Description
    this.container.querySelector('#description-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange('description', (e.target as HTMLTextAreaElement).value);
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
    style.textContent = `
      .score-editor {
        max-width: 1600px;
        margin: 0 auto;
        padding: 20px;
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e0e0e0;
      }

      .editor-header h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 300;
      }

      .editor-actions {
        display: flex;
        gap: 10px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        text-decoration: none;
        display: inline-block;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #2196f3;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #1976d2;
      }

      .btn-primary:disabled {
        background: #bdbdbd;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }

      .btn-secondary:hover {
        background: #e0e0e0;
      }

      .editor-metadata {
        background: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }

      .metadata-field-full {
        grid-column: 1 / -1;
      }

      .metadata-field label {
        display: block;
        font-weight: 600;
        margin-bottom: 5px;
        color: #333;
      }

      .metadata-field input,
      .metadata-field select,
      .metadata-field textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
      }

      .metadata-field textarea {
        resize: vertical;
      }

      .editor-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        height: calc(100vh - 400px);
        min-height: 500px;
      }

      .editor-pane {
        display: flex;
        flex-direction: column;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }

      .editor-pane-header {
        background: #f5f5f5;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
      }

      .editor-pane-header h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
      }

      .format-toggle {
        display: flex;
        gap: 15px;
      }

      .format-toggle label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
      }

      .validation-error {
        background: #ffebee;
        color: #c62828;
        padding: 0;
        margin: 0;
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s;
      }

      .validation-error.show {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        max-height: 100px;
      }

      .validation-error svg {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }

      #score-data-input {
        flex: 1;
        padding: 20px;
        border: none;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        resize: none;
        outline: none;
      }

      .preview-pane {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: auto;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-placeholder,
      .preview-error {
        text-align: center;
        color: #999;
        padding: 40px;
      }

      .preview-placeholder p:first-child,
      .preview-error p:first-child {
        font-size: 1.2rem;
        margin-bottom: 10px;
        color: #666;
      }

      .preview-hint {
        font-size: 0.9rem;
      }

      .preview-error {
        color: #f44336;
      }

      #score-preview {
        padding: 20px;
        width: 100%;
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
          gap: 15px;
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
