import { updateScore } from '../../api/scores';
import { purgeScoreCache } from '../../api/purge';
import { getCurrentUser } from '../../api/auth';
import { toast } from '../Toast';
import { ButtonLoadingState } from '../LoadingSpinner';
import { parseScoreText } from '../../utils/score-data';
import { validateScoreInput } from '../../utils/score-validation';
import { EditorAutosave } from '../../utils/editor-autosave';
import type { DraftData, ScoreMetadata } from '../../utils/editor-autosave';
import type { ScoreLicense } from '../../utils/license';
import type {
  Score,
  ScoreContent,
  ScoreDataFormat,
  UpdateScoreData,
} from '../../api/scores';
import type { ScoreData } from '../../web-component/types/ScoreData';
import { STRINGS } from '../../constants/strings';
import { DetailsDialog } from './DetailsDialog';
import { SourceView } from './SourceView';
import { PalettePanel } from './PalettePanel';
import { SelectionView } from './SelectionView';

/**
 * The save status when there are changes to save. One word, so it fits on one
 * line between ⇄ and Save on a phone.
 */
const UNSAVED = 'Unsaved';

/**
 * The score edit page (/score/[slug]/edit). Holds the score being edited — its
 * source text and format, and its details — and saves it. The markup is
 * rendered by edit.astro; the details and the source have their own views.
 */
export class ScoreEditor {
  private readonly scoreId: string;
  private readonly slug: string;
  /** The score as stored: JSON as indented text, MusicXML and ABC as typed. */
  private source: string;
  private format: ScoreDataFormat;
  private metadata: ScoreMetadata;
  /** The licence as saved, so a save only writes it when the owner changed it. */
  private savedLicense: ScoreLicense;
  private hasUnsavedChanges = false;

  private readonly autosave: EditorAutosave;
  private readonly details: DetailsDialog;
  private readonly sourceView: SourceView;
  private readonly palettes: PalettePanel;
  private readonly selection: SelectionView;
  private readonly scoreArea: HTMLElement;
  private readonly renderer: HTMLElement;
  private readonly emptyHint: HTMLElement;
  private readonly sourceToggle: HTMLButtonElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly saveStatus: HTMLElement;

  constructor(score: Score) {
    this.scoreId = score.id;
    this.slug = score.slug;
    this.format = score.data_format;
    this.source =
      score.data_format === 'json'
        ? JSON.stringify(score.data, null, 2)
        : score.data;
    this.metadata = {
      title: score.title,
      composer: score.composer ?? '',
      school: score.school,
      description: score.description ?? '',
      license: score.license,
    };
    this.savedLicense = score.license;

    this.scoreArea = byId('score-area');
    this.renderer = byId('score-renderer');
    this.emptyHint = byId('score-empty-hint');
    this.sourceToggle = byId<HTMLButtonElement>('source-toggle');
    this.saveButton = byId<HTMLButtonElement>('save-btn');
    this.saveStatus = byId('save-status');

    this.autosave = new EditorAutosave(this.slug);
    this.details = new DetailsDialog((field, value) => {
      this.metadata[field] = value;
      this.markChanged();
    });
    this.sourceView = new SourceView({
      onInput: (source) => this.handleSourceInput(source),
      onFormatChange: (format) => this.handleFormatChange(format),
    });
    this.sourceView.setSource(this.source, this.format);
    this.palettes = new PalettePanel();
    this.selection = new SelectionView();

    byId('details-btn').addEventListener('click', () => this.details.open());
    this.sourceToggle.addEventListener('click', () =>
      this.showSource(!this.sourceView.visible),
    );
    this.saveButton.addEventListener('click', () => this.save());
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) e.preventDefault();
    });

    this.renderer.style.setProperty(
      '--shakuhachi-note-color',
      'var(--color-text-primary)',
    );
    this.renderer.setAttribute(
      'notation-font',
      document.documentElement.dataset.notationFont ?? 'sans',
    );
    // A score that can't be read opens on its source, where the reason is shown
    if (!this.renderScore()) this.showSource(true);

    this.autosave.checkAndOfferRestore(score.updated_at, (draft) =>
      this.restoreDraft(draft),
    );
  }

  /**
   * Draws the source in the score area. An unreadable source leaves the last
   * score that could be read in place. Returns whether the source could be read.
   */
  private renderScore(): boolean {
    const { data, error } = this.readSource();
    this.sourceView.showValidation(error ?? null);
    if (!data) return false;

    this.renderer.setAttribute('data-score', JSON.stringify(data));
    this.emptyHint.hidden = data.notes.length > 0;
    this.selection.show(data.notes);
    return true;
  }

  private readSource(): { data?: ScoreData; error?: string } {
    const { valid, error } = validateScoreInput(this.source, this.format);
    if (!valid) return { error };
    try {
      return { data: parseScoreText(this.source, this.format) };
    } catch (thrown) {
      return {
        error:
          thrown instanceof Error
            ? thrown.message
            : STRINGS.VALIDATION.scoreInput.invalidFormat,
      };
    }
  }

  /** Switches the score area between the score and its source. */
  private showSource(visible: boolean): void {
    this.sourceView.visible = visible;
    this.scoreArea.hidden = visible;
    this.palettes.visible = !visible;
    this.selection.visible = !visible;
    this.sourceToggle.querySelector('.btn-text')!.textContent = visible
      ? 'Score'
      : 'Source';
    if (!visible) this.renderScore();
  }

  private handleSourceInput(source: string): void {
    this.source = source;
    this.sourceView.showValidation(this.readSource().error ?? null);
    this.markChanged();
  }

  private async handleFormatChange(format: ScoreDataFormat): Promise<void> {
    if (format === this.format) return;

    if (this.source.trim()) {
      try {
        const { convertFormat } = await import('../../utils/format-converter');
        this.source = convertFormat(this.source, this.format, format);
      } catch (error) {
        // The source stays as it is, so the radio goes back to its format and
        // the validation line says why. The next edit shows the source's own
        // state again.
        this.sourceView.setSource(this.source, this.format);
        this.sourceView.showValidation(
          STRINGS.VALIDATION.scoreInput.formatSwitchFailed(
            format,
            error instanceof Error ? error.message : '',
          ),
        );
        return;
      }
    }
    this.setFormat(format);
  }

  private setFormat(format: ScoreDataFormat): void {
    this.format = format;
    this.sourceView.setSource(this.source, this.format);
    this.sourceView.showValidation(this.readSource().error ?? null);
    this.markChanged();
  }

  private restoreDraft(draft: DraftData): void {
    this.source = draft.scoreData || '';
    this.format = draft.dataFormat || 'json';
    // Spread over the loaded values: drafts saved before a field existed
    // (the licence, #263) lack it.
    this.metadata = { ...this.metadata, ...draft.metadata };
    this.details.setMetadata(this.metadata);
    this.sourceView.setSource(this.source, this.format);
    if (!this.renderScore()) this.showSource(true);
    this.hasUnsavedChanges = true;
    this.showSaveStatus(UNSAVED);
  }

  private markChanged(): void {
    this.hasUnsavedChanges = true;
    this.autosave.save({
      scoreData: this.source,
      dataFormat: this.format,
      metadata: this.metadata,
    });
    this.showSaveStatus(UNSAVED);
  }

  private showSaveStatus(text: string): void {
    this.saveStatus.textContent = text;
  }

  private async save(): Promise<void> {
    const { user } = await getCurrentUser();
    if (!user) {
      toast.error(STRINGS.ERRORS.ScoreEditor.saveLoginRequired);
      return;
    }

    if (!this.metadata.title.trim()) {
      this.metadata.title = 'Untitled Score';
    }

    if (!this.readSource().data) {
      toast.error(STRINGS.ERRORS.ScoreEditor.saveValidationFailed);
      this.showSource(true);
      return;
    }

    const saveLoading = new ButtonLoadingState(this.saveButton);
    saveLoading.show();

    try {
      // Text formats are stored as typed, so reopening the editor gives the
      // author back their own source, not a conversion of it.
      const content: ScoreContent =
        this.format === 'json'
          ? { data_format: 'json', data: JSON.parse(this.source) }
          : { data_format: this.format, data: this.source };

      const update: UpdateScoreData = {
        ...content,
        title: this.metadata.title,
        composer: this.metadata.composer || undefined,
        school: this.metadata.school,
        description: this.metadata.description || undefined,
      };
      // Only when changed. Naming the column at all fires the fork-licence
      // trigger, which would reject an unrelated save if the parent's licence
      // has moved since this fork was made.
      if (this.metadata.license !== this.savedLicense) {
        update.license = this.metadata.license;
      }

      const result = await updateScore(this.scoreId, update);
      if (result.error) {
        toast.error(STRINGS.ERRORS.ScoreEditor.saveError(result.error.message));
        return;
      }

      this.autosave.clear();
      this.savedLicense = this.metadata.license;
      this.hasUnsavedChanges = false;
      this.showSaveStatus('Saved');
      // The score page is cached at the edge; drop it so the edit shows.
      await purgeScoreCache(this.slug);
    } catch (error) {
      toast.error(
        STRINGS.ERRORS.ScoreEditor.saveError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    } finally {
      saveLoading.hide();
    }
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`ScoreEditor: #${id} not found`);
  return el as T;
}
