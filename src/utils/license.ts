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

/**
 * "Traditional" fills the composer field for pieces with no known author. It
 * is not a name, so it must not read as one ("Music by Traditional").
 */
export function isTraditional(composer: string | null): boolean {
  return composer?.trim().toLowerCase() === 'traditional';
}

/** The music half of the score page's credit line; null when nothing is known. */
export function musicCredit(
  status: CopyrightStatus,
  composer: string | null,
): string | null {
  const name = composer?.trim() || null;
  if (isTraditional(name)) {
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

/**
 * The clause NonCommercial licences add, shared by their descriptions so the
 * editor can emphasise it: it is the restriction authors most need to notice.
 */
export const NON_COMMERCIAL_CLAUSE = 'not commercially';

interface LicenseInfo {
  name: string;
  /** The licence deed. CC licences require a link to it wherever the work is shown. */
  url: string | null;
  /** What the licence lets others do, in the editor's words. */
  description: string;
}

export const LICENSES: Record<ScoreLicense, LicenseInfo> = {
  'CC0-1.0': {
    name: 'CC0 1.0',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description:
      'No conditions. Anyone may use your notation for anything, without credit.',
  },
  'CC-BY-4.0': {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    description:
      'Anyone may copy, adapt and share your notation, even commercially, if they credit you.',
  },
  'CC-BY-SA-4.0': {
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description:
      'Anyone may copy, adapt and share your notation, even commercially, if they credit you and share adaptations under the same licence.',
  },
  'CC-BY-NC-4.0': {
    name: 'CC BY-NC 4.0',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    description: `Anyone may copy, adapt and share your notation, but ${NON_COMMERCIAL_CLAUSE}, if they credit you.`,
  },
  'CC-BY-NC-SA-4.0': {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    description: `Anyone may copy, adapt and share your notation, but ${NON_COMMERCIAL_CLAUSE}, if they credit you and share adaptations under the same licence.`,
  },
  'CC-BY-ND-4.0': {
    name: 'CC BY-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    description:
      'Anyone may share your notation unchanged, even commercially, if they credit you. Nobody else can fork it.',
  },
  'CC-BY-NC-ND-4.0': {
    name: 'CC BY-NC-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    description: `Anyone may share your notation unchanged, but ${NON_COMMERCIAL_CLAUSE}, if they credit you. Nobody else can fork it.`,
  },
  'LicenseRef-AllRightsReserved': {
    name: 'All rights reserved',
    url: null,
    description:
      'Others may view your notation here but not copy or adapt it. Nobody else can fork it.',
  },
  NOASSERTION: {
    name: 'Licence not yet established',
    url: null,
    description: 'Nobody has set the terms for this score yet.',
  },
};

/**
 * The licences the editor offers, in menu order (#263). CC BY-NC-SA 4.0, the
 * default for new scores, comes first. The ND licences are left out: this
 * platform exists to fork, and they forbid it.
 */
export const EDITOR_LICENSES: readonly ScoreLicense[] = [
  'CC-BY-NC-SA-4.0',
  'CC-BY-SA-4.0',
  'CC-BY-4.0',
  'CC-BY-NC-4.0',
  'CC0-1.0',
  'LicenseRef-AllRightsReserved',
];

/** What the owner may pick, and why it is narrowed when it is. */
export type LicenseChoices =
  | { locked: true; reason: 'share_alike' | 'unestablished' }
  | {
      locked: false;
      options: ScoreLicense[];
      reason: 'non_commercial' | null;
    };

/**
 * Which licences a score's owner may switch to, mirroring the database trigger
 * `enforce_fork_license` (add_licensing_to_scores.sql) for an existing score.
 * The trigger is the rule; this only keeps the editor from offering a choice
 * the save would reject.
 *
 * `current` is always offered, so a score already under a licence the editor
 * does not list (an ND licence, NOASSERTION) still shows it as selected.
 */
export function licenseChoices(
  current: ScoreLicense,
  ownerId: string,
  parent: { license: ScoreLicense; user_id: string } | null,
): LicenseChoices {
  // A licence binds others, not the person granting it.
  const constrained = parent !== null && parent.user_id !== ownerId;

  if (constrained && parent.license === 'NOASSERTION') {
    return { locked: true, reason: 'unestablished' };
  }
  if (constrained && parent.license.includes('-SA-')) {
    return { locked: true, reason: 'share_alike' };
  }

  const nonCommercial = constrained && parent.license.includes('-NC-');
  const offered = nonCommercial
    ? EDITOR_LICENSES.filter((id) => id.includes('-NC-'))
    : EDITOR_LICENSES;
  return {
    locked: false,
    options: offered.includes(current) ? [...offered] : [current, ...offered],
    reason: nonCommercial ? 'non_commercial' : null,
  };
}
