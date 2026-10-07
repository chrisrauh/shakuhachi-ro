import { LICENSES, NON_COMMERCIAL_CLAUSE } from '../../utils/license';
import type { ScoreLicense } from '../../utils/license';

/**
 * What the licence lets others do, with the NonCommercial restriction in bold
 * so an author cannot miss it. The descriptions are constants, not user input,
 * so the result is safe to set as HTML.
 */
export function licenseDescriptionHTML(license: ScoreLicense): string {
  return LICENSES[license].description.replace(
    NON_COMMERCIAL_CLAUSE,
    `<strong>${NON_COMMERCIAL_CLAUSE}</strong>`,
  );
}
