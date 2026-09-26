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

/**
 * Copyright status as it reads after "Music by <composer>, …", and on its own
 * when the composer is unknown. The score page names the music and the score in
 * one line, so each half must say which of the two it is about.
 */
const MUSIC_STATUS: Partial<
  Record<CopyrightStatus, { afterComposer: string; alone: string }>
> = {
  public_domain: {
    afterComposer: 'in the public domain',
    alone: 'Music in the public domain',
  },
  in_copyright: { afterComposer: 'in copyright', alone: 'Music in copyright' },
  no_known_copyright: {
    afterComposer: 'no known copyright',
    alone: 'No known copyright on the music',
  },
  undetermined: {
    afterComposer: 'copyright undetermined',
    alone: 'Music copyright undetermined',
  },
};

/** The music half of the score page's credit line; null when nothing is known. */
export function musicCredit(
  status: CopyrightStatus,
  composer: string | null,
): string | null {
  const name = composer?.trim() || null;
  // "Traditional" fills the composer field for pieces with no known author;
  // "Music by Traditional" would read as if it were a name.
  if (name?.toLowerCase() === 'traditional') {
    const phrase = MUSIC_STATUS[status];
    return phrase
      ? `Traditional music, ${phrase.afterComposer}`
      : 'Traditional music';
  }
  if (status === 'original') {
    return name ? `Original composition by ${name}` : 'Original composition';
  }
  const phrase = MUSIC_STATUS[status];
  if (phrase) {
    return name ? `Music by ${name}, ${phrase.afterComposer}` : phrase.alone;
  }
  return name ? `Music by ${name}` : null;
}

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
