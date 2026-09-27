import { describe, expect, it } from 'vitest';
import { EDITOR_LICENSES, licenseChoices, musicCredit } from './license';
import type { ScoreLicense } from './license';

describe('musicCredit', () => {
  it('names the composer and the status together', () => {
    expect(musicCredit('public_domain', 'Rentaro Taki')).toBe(
      'Music by Rentaro Taki, in the public domain',
    );
  });

  it('says the status is about the music when the composer is unknown', () => {
    expect(musicCredit('public_domain', null)).toBe(
      'Music in the public domain',
    );
    expect(musicCredit('no_known_copyright', '  ')).toBe(
      'No known copyright on the music',
    );
  });

  it('credits an original composition to its composer', () => {
    expect(musicCredit('original', 'A. Composer')).toBe(
      'Original composition by A. Composer',
    );
  });

  it('credits the composer alone when the status is not evaluated', () => {
    expect(musicCredit('not_evaluated', 'Rentaro Taki')).toBe(
      'Music by Rentaro Taki',
    );
  });

  it('does not treat "Traditional" as a composer name', () => {
    expect(musicCredit('public_domain', 'Traditional')).toBe(
      'Traditional music, in the public domain',
    );
    expect(musicCredit('not_evaluated', 'traditional')).toBe(
      'Traditional music',
    );
  });

  it('returns null when neither is known', () => {
    expect(musicCredit('not_evaluated', null)).toBeNull();
  });
});

describe('licenseChoices', () => {
  const OWNER = 'owner';
  const parentBy = (license: ScoreLicense, user_id = 'someone-else') => ({
    license,
    user_id,
  });

  it('offers every editor licence to a score that is not a fork', () => {
    expect(licenseChoices('CC-BY-SA-4.0', OWNER, null)).toEqual({
      locked: false,
      options: [...EDITOR_LICENSES],
      reason: null,
    });
  });

  // A licence binds others, not the person granting it.
  it('does not constrain a fork of your own score', () => {
    const choices = licenseChoices(
      'CC-BY-SA-4.0',
      OWNER,
      parentBy('CC-BY-SA-4.0', OWNER),
    );
    expect(choices).toMatchObject({ locked: false, reason: null });
  });

  it('locks a fork of someone else’s ShareAlike score', () => {
    expect(
      licenseChoices('CC-BY-NC-SA-4.0', OWNER, parentBy('CC-BY-NC-SA-4.0')),
    ).toEqual({ locked: true, reason: 'share_alike' });
  });

  it('locks a fork whose source licence is not established', () => {
    expect(
      licenseChoices('NOASSERTION', OWNER, parentBy('NOASSERTION')),
    ).toEqual({ locked: true, reason: 'unestablished' });
  });

  it('offers only NonCommercial licences to a fork of a NonCommercial score', () => {
    expect(
      licenseChoices('CC-BY-NC-4.0', OWNER, parentBy('CC-BY-NC-4.0')),
    ).toEqual({
      locked: false,
      options: ['CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0'],
      reason: 'non_commercial',
    });
  });

  it('keeps a current licence the editor does not list, so it shows as selected', () => {
    const choices = licenseChoices('CC-BY-ND-4.0', OWNER, null);
    expect(choices.locked === false && choices.options[0]).toBe('CC-BY-ND-4.0');
  });
});
