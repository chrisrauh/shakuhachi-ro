import { ConfirmDialog } from '../components/ConfirmDialog';
import { debounce } from './debounce';
import type { ScoreDataFormat } from '../api/scores';

const DEBOUNCE_MS = 2_000;
const MAX_WAIT_MS = 60_000;

export interface ScoreMetadata {
  title: string;
  composer: string;
  description: string;
}

export interface DraftData {
  scoreData: string;
  dataFormat: ScoreDataFormat;
  metadata: ScoreMetadata;
  savedAt: string;
}

export class EditorAutosave {
  private key: string;
  private debouncedFlush: () => void;
  private pendingData: Omit<DraftData, 'savedAt'> | null = null;

  constructor(slug: string) {
    this.key = `shakuhachi-editor-${slug}`;
    this.debouncedFlush = debounce(
      () => this.flush(),
      DEBOUNCE_MS,
      MAX_WAIT_MS,
    );
  }

  save(data: Omit<DraftData, 'savedAt'>): void {
    this.pendingData = data;
    this.debouncedFlush();
  }

  private flush(): void {
    if (!this.pendingData) return;
    const draft: DraftData = {
      ...this.pendingData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(this.key, JSON.stringify(draft));
  }

  checkAndOfferRestore(
    loadedAt: string,
    onRestore: (draft: DraftData) => void,
  ): void {
    const saved = localStorage.getItem(this.key);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as DraftData;
      if (!draft.savedAt || !loadedAt) return;
      if (draft.savedAt <= loadedAt) return;

      new ConfirmDialog().show({
        title: 'Unsaved changes',
        message:
          'You have unsaved changes from a previous session. Restore them?',
        confirmText: 'Restore',
        cancelText: 'Discard',
        onConfirm: () => onRestore(draft),
        onCancel: () => this.clear(),
      });
    } catch {
      this.clear();
    }
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}
