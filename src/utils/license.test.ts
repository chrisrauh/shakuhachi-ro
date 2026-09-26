import { describe, expect, it } from 'vitest';
import { musicCredit } from './license';

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
