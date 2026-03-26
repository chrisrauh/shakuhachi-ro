import { updateScore, getScore } from '../api/scores';
import { getCurrentUser } from '../api/auth';
import { renderIcon, initIcons } from '../utils/icons';
import { ABCParser } from '../web-component/parser/ABCParser';
import { toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { buildSpinnerSVG } from './LoadingSpinner';
import type { ScoreDataFormat } from '../api/scores';
import { STRINGS, STRING_FACTORIES } from '../constants/strings';
import { validateScoreInput } from '../utils/score-validation';
import { EditorAutosave } from '../utils/editor-autosave';
import type { ScoreMetadata } from '../utils/editor-autosave';

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
  private scoreId: string;
  private loadedAt: string = '';
  private hasUnsavedChanges: boolean = false;
  private autosave: EditorAutosave;

  constructor(containerId: string, scoreId: string, slug: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.scoreId = scoreId;
    this.autosave = new EditorAutosave(slug);

    this.showLoadingPlaceholder();
    this.loadExistingScore(scoreId);

    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
      }
    });
  }

  private showLoadingPlaceholder(): void {
    this.container.innerHTML = `
      <div class="score-editor">
        <div class="editor-loading">
          ${buildSpinnerSVG()}
        </div>
      </div>
    `;
  }

  private async loadExistingScore(scoreId: string): Promise<void> {
    const result = await getScore(scoreId);

    if (result.error || !result.score) {
      toast.error(
        result.error?.message
          ? STRINGS.ERRORS.ScoreEditor.loadError(result.error.message)
          : STRINGS.ERRORS.ScoreEditor.loadNotFound,
      );
      // Render empty editor so user can still interact
      this.render();
      return;
    }

    const score = result.score;
    this.loadedAt = score.updated_at;
    this.dataFormat = score.data_format;
    this.metadata = {
      title: score.title,
      composer: score.composer || '',
      description: score.description || '',
    };

    if (this.dataFormat === 'json') {
      this.scoreData = JSON.stringify(score.data, null, 2);
    } else {
      this.scoreData = score.data;
    }

    this.render();
    this.updatePreview();
    this.autosave.checkAndOfferRestore(this.loadedAt, (draft) => {
      this.scoreData = draft.scoreData || '';
      this.dataFormat = draft.dataFormat || 'json';
      this.metadata = draft.metadata || this.metadata;
      this.hasUnsavedChanges = true;
      this.render();
      this.updatePreview();
      this.updateUnsavedIndicator();
    });
  }

  private updateUnsavedIndicator(): void {
    const indicator = document.getElementById('save-status-indicator');
    if (!indicator) return;
    indicator.innerHTML = this.hasUnsavedChanges
      ? '<span class="save-status save-status--unsaved">Unsaved changes</span>'
      : '';
  }

  private handleDataChange(newData: string): void {
    this.hasUnsavedChanges = true;
    this.scoreData = newData;
    const { error } = validateScoreInput(this.scoreData, this.dataFormat);
    this.validationError = error ?? null;
    this.renderValidation();
    this.updatePreview();
    this.autosave.save({
      scoreData: this.scoreData,
      dataFormat: this.dataFormat,
      metadata: this.metadata,
    });
    this.updateUnsavedIndicator();
  }

  private async handleFormatChange(format: ScoreDataFormat): Promise<void> {
    if (this.scoreData.trim() && this.dataFormat !== format) {
      try {
        const { convertFormat } = await import('../utils/format-converter');
        this.scoreData = convertFormat(this.scoreData, this.dataFormat, format);
        this.dataFormat = format;
      } catch {
        const dialog = STRINGS.DIALOGS.ScoreEditor.formatConversionFailed;
        confirmDialog.show({
          title: dialog.title,
          message: dialog.message(this.dataFormat, format),
          confirmText: dialog.confirmText,
          cancelText: dialog.cancelText,
          onConfirm: () => {
            this.scoreData = '';
            this.dataFormat = format;
            this.hasUnsavedChanges = true;
            this.render();
          },
          onCancel: () => {
            const radios = this.container.querySelectorAll(
              'input[name="format"]',
            );
            radios.forEach((radio) => {
              (radio as HTMLInputElement).checked =
                (radio as HTMLInputElement).value === this.dataFormat;
            });
          },
        });
        return;
      }
    } else {
      this.dataFormat = format;
    }

    this.hasUnsavedChanges = true;
    this.render();
    this.autosave.save({
      scoreData: this.scoreData,
      dataFormat: this.dataFormat,
      metadata: this.metadata,
    });
  }

  private handleMetadataChange(
    field: keyof ScoreMetadata,
    value: string,
  ): void {
    this.hasUnsavedChanges = true;
    this.metadata[field] = value;
    this.autosave.save({
      scoreData: this.scoreData,
      dataFormat: this.dataFormat,
      metadata: this.metadata,
    });
    this.updateUnsavedIndicator();
  }

  private async updatePreview(): Promise<void> {
    const externalPreview = document.getElementById('score-preview');

    if (externalPreview && !this.container.contains(externalPreview)) {
      const { valid, error } = validateScoreInput(
        this.scoreData,
        this.dataFormat,
      );
      this.validationError = error ?? null;
      if (!valid) {
        externalPreview.innerHTML = `
          <div class="preview-placeholder">
            <p>Preview will appear here</p>
            <p class="preview-hint">Enter valid ${
              this.dataFormat === 'json'
                ? 'JSON'
                : this.dataFormat === 'abc'
                  ? 'ABC'
                  : 'MusicXML'
            } score data to see the preview</p>
          </div>
        `;
        return;
      }

      try {
        const isMobile = window.innerWidth < 768;

        const { parseScoreText } = await import('../utils/score-data');
        const scoreData = await parseScoreText(this.scoreData, this.dataFormat);

        externalPreview.innerHTML =
          '<shakuhachi-score id="score-renderer"></shakuhachi-score>';
        const container = externalPreview.querySelector(
          'shakuhachi-score',
        ) as HTMLElement;
        if (!container) return;

        container.style.setProperty(
          '--shakuhachi-note-color',
          'var(--color-text-primary)',
        );
        container.style.setProperty(
          '--shakuhachi-note-vertical-spacing',
          isMobile ? '40px' : '44px',
        );

        if (isMobile) {
          container.setAttribute('columns', '1');
          container.style.width = '100%';
        } else {
          container.setAttribute('columns', 'auto');
          container.style.width = '100%';
          container.style.height = '100%';
        }

        container.setAttribute('data-score', JSON.stringify(scoreData));
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

    const previewContainer = this.container.querySelector(
      '#preview-pane',
    ) as HTMLElement;
    if (!previewContainer) return;

    const { valid, error } = validateScoreInput(
      this.scoreData,
      this.dataFormat,
    );
    this.validationError = error ?? null;
    if (!valid) {
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
      const isMobile = window.innerWidth < 768;

      let scoreData;
      const { parseScoreText } = await import('../utils/score-data');
      scoreData = await parseScoreText(this.scoreData, this.dataFormat);

      previewContainer.innerHTML =
        '<shakuhachi-score id="score-renderer"></shakuhachi-score>';
      const container = previewContainer.querySelector(
        'shakuhachi-score',
      ) as HTMLElement;
      if (!container) return;

      container.style.setProperty(
        '--shakuhachi-note-color',
        'var(--color-text-primary)',
      );
      container.style.setProperty(
        '--shakuhachi-note-vertical-spacing',
        isMobile ? '40px' : '44px',
      );

      if (isMobile) {
        container.setAttribute('columns', '1');
        container.style.width = '100%';
      } else {
        container.setAttribute('columns', 'auto');
        container.style.width = '100%';
        container.style.height = '100%';
      }

      container.setAttribute('data-score', JSON.stringify(scoreData));
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
    const { user } = await getCurrentUser();
    if (!user) {
      toast.error(STRINGS.ERRORS.ScoreEditor.saveLoginRequired);
      return;
    }

    if (!this.metadata.title.trim()) {
      this.metadata.title = 'Untitled Score';
    }

    const { valid, error } = validateScoreInput(
      this.scoreData,
      this.dataFormat,
    );
    this.validationError = error ?? null;
    if (!valid) {
      toast.error(STRINGS.ERRORS.ScoreEditor.saveValidationFailed);
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
      let data: unknown;
      let saveFormat: ScoreDataFormat;
      if (this.dataFormat === 'abc') {
        data = ABCParser.parse(this.scoreData);
        saveFormat = 'json';
      } else if (this.dataFormat === 'json') {
        data = JSON.parse(this.scoreData);
        saveFormat = 'json';
      } else {
        data = this.scoreData;
        saveFormat = this.dataFormat;
      }

      const scoreData = {
        title: this.metadata.title,
        composer: this.metadata.composer || undefined,
        description: this.metadata.description || undefined,
        data_format: saveFormat,
        data: data,
      };

      const result = await updateScore(this.scoreId, scoreData);

      if (result.error) {
        toast.error(STRINGS.ERRORS.ScoreEditor.saveError(result.error.message));
      } else {
        this.autosave.clear();
        this.hasUnsavedChanges = false;
        this.updateUnsavedIndicator();
        toast.success(STRINGS.SUCCESS.ScoreEditor.scoreSaved(true));
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(
        STRINGS.ERRORS.ScoreEditor.saveError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Score';
      }
    }
  }

  private render(): void {
    const hasExternalPreview =
      document.getElementById('score-preview') !== null;

    this.container.innerHTML = `
      <div class="score-editor">
        <div class="editor-header">
          <h1>Edit Score</h1>
          <a href="/" class="btn btn-secondary"><span class="btn-text">Cancel</span></a>
        </div>

        <div class="editor-metadata" id="editor-metadata">
          ${this.renderMetadataHTML()}
        </div>

        <div class="editor-main">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <h2>
                Score Data
                <a href="/help/notation-formats" target="_blank" class="help-link" title="Format help">
                  ${renderIcon('circle-help')}
                </a>
              </h2>
              <div class="format-toggle">
                <label>
                  <input type="radio" name="format" value="json" ${this.dataFormat === 'json' ? 'checked' : ''} />
                  JSON
                </label>
                <label>
                  <input type="radio" name="format" value="musicxml" ${this.dataFormat === 'musicxml' ? 'checked' : ''} />
                  MusicXML
                </label>
                <label>
                  <input type="radio" name="format" value="abc" ${this.dataFormat === 'abc' ? 'checked' : ''} />
                  ABC
                </label>
              </div>
            </div>
            <div id="validation-error" class="validation-error"></div>
            <textarea
              id="score-data-input"
              placeholder="Enter ${
                this.dataFormat === 'json'
                  ? 'JSON'
                  : this.dataFormat === 'abc'
                    ? 'ABC'
                    : 'MusicXML'
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

    initIcons();
    this.attachEventListeners();
    this.renderValidation();
    this.updatePreview();
    this.updateUnsavedIndicator();
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

        <div class="metadata-field metadata-field-full">
          <div class="save-bar">
            <div id="save-status-indicator"></div>
            <button id="save-btn" class="btn btn-primary">
              <span class="btn-text">Save Score</span>
            </button>
          </div>
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
    const textarea = this.container.querySelector(
      '#score-data-input',
    ) as HTMLTextAreaElement;
    textarea?.addEventListener('input', (e) => {
      this.handleDataChange((e.target as HTMLTextAreaElement).value);
    });

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

    const saveBtn = this.container.querySelector('#save-btn');
    saveBtn?.addEventListener('click', () => this.handleSave());

    this.attachMetadataListeners();
  }

  private attachMetadataListeners(): void {
    this.container
      .querySelector('#title-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange(
          'title',
          (e.target as HTMLInputElement).value,
        );
      });

    this.container
      .querySelector('#composer-input')
      ?.addEventListener('input', (e) => {
        this.handleMetadataChange(
          'composer',
          (e.target as HTMLInputElement).value,
        );
      });

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

  public destroy(): void {
    // autosave holds a debounce timer; pending saves complete naturally on page unload
  }
}
