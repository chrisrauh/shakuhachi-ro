/**
 * The two rights layers on a score (#306). They answer different questions:
 * whether the composition is still in copyright is a fact about the piece; the
 * licence is the terms on which this score's notation may be reused.
 *
 * Values mirror the Postgres enums in database/migrations/add_licensing_to_scores.sql.
 */

export type CopyrightStatus =
  | 'public_domain'
  | 'no_known_copyright'
  | 'in_copyright'
  | 'undetermined'
  | 'not_evaluated'
  | 'original';

export type CopyrightBasis =
  | 'author_died'
  | 'published_anonymous'
  | 'traditional_immemorial';

/** SPDX identifiers. NOASSERTION: nobody has established the terms yet. */
export type ScoreLicense =
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'CC-BY-ND-4.0'
  | 'CC-BY-NC-ND-4.0'
  | 'LicenseRef-AllRightsReserved'
  | 'NOASSERTION';

export const COPYRIGHT_STATUS_LABELS: Record<CopyrightStatus, string> = {
  public_domain: 'Public domain',
  no_known_copyright: 'No known copyright',
  in_copyright: 'In copyright',
  undetermined: 'Copyright undetermined',
  not_evaluated: 'Copyright not evaluated',
  original: 'Original composition',
};

interface LicenseInfo {
  name: string;
  /** The licence deed. CC licences require a link to it wherever the work is shown. */
  url: string | null;
}

export const LICENSES: Record<ScoreLicense, LicenseInfo> = {
  'CC0-1.0': {
    name: 'CC0 1.0',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  'CC-BY-4.0': {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'CC-BY-SA-4.0': {
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  'CC-BY-NC-4.0': {
    name: 'CC BY-NC 4.0',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
  'CC-BY-NC-SA-4.0': {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
  'CC-BY-ND-4.0': {
    name: 'CC BY-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
  },
  'CC-BY-NC-ND-4.0': {
    name: 'CC BY-NC-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  },
  'LicenseRef-AllRightsReserved': { name: 'All rights reserved', url: null },
  NOASSERTION: { name: 'Licence not yet established', url: null },
};
