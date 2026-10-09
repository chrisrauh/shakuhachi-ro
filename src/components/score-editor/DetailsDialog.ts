import type { ScoreMetadata } from '../../utils/editor-autosave';
import type { ScoreLicense } from '../../utils/license';
import type { School } from '../../utils/school';
import { licenseDescriptionHTML } from './license-description';

type MetadataChange = <K extends keyof ScoreMetadata>(
  field: K,
  value: ScoreMetadata[K],
) => void;

/**
 * Wires up the details dialog rendered by DetailsDialog.astro. Every edit is
 * reported as it happens; closing the dialog keeps them, for Save.
 */
export class DetailsDialog {
  private dialog: HTMLDialogElement;
  private title: HTMLInputElement;
  private composer: HTMLInputElement;
  private school: HTMLSelectElement;
  private description: HTMLTextAreaElement;
  private licenseSelect: HTMLSelectElement | null;

  constructor(onChange: MetadataChange) {
    this.dialog = byId<HTMLDialogElement>('details-dialog');
    this.title = byId<HTMLInputElement>('title-input');
    this.composer = byId<HTMLInputElement>('composer-input');
    this.school = byId<HTMLSelectElement>('school-select');
    this.description = byId<HTMLTextAreaElement>('description-input');
    // Absent when the licence is fixed by the score this was forked from
    this.licenseSelect = document.getElementById(
      'license-select',
    ) as HTMLSelectElement | null;

    this.title.addEventListener('input', () =>
      onChange('title', this.title.value),
    );
    this.composer.addEventListener('input', () =>
      onChange('composer', this.composer.value),
    );
    this.school.addEventListener('change', () =>
      onChange('school', (this.school.value as School) || null),
    );
    this.description.addEventListener('input', () =>
      onChange('description', this.description.value),
    );

    document.getElementById('license-change')?.addEventListener('click', () => {
      this.revealLicenseSelect();
      this.licenseSelect!.focus();
    });

    this.licenseSelect?.addEventListener('change', () => {
      const license = this.licenseSelect!.value as ScoreLicense;
      this.showLicenseDescription(license);
      onChange('license', license);
    });
  }

  open(): void {
    this.dialog.showModal();
  }

  /** Puts restored values in the fields, without reporting them as edits. */
  setMetadata(metadata: ScoreMetadata): void {
    this.title.value = metadata.title;
    this.composer.value = metadata.composer;
    this.school.value = metadata.school ?? '';
    this.description.value = metadata.description;
    if (this.licenseSelect && this.licenseSelect.value !== metadata.license) {
      this.licenseSelect.value = metadata.license;
      this.revealLicenseSelect();
      this.showLicenseDescription(metadata.license);
    }
  }

  private revealLicenseSelect(): void {
    document.getElementById('license-summary')?.remove();
    this.licenseSelect!.hidden = false;
  }

  private showLicenseDescription(license: ScoreLicense): void {
    byId('license-description').innerHTML = licenseDescriptionHTML(license);
  }
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`DetailsDialog: #${id} not found`);
  return el as T;
}
