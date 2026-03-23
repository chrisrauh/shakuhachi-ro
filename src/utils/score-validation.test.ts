import { describe, it, expect } from 'vitest';
import { validateScoreInput } from './score-validation';

describe('validateScoreInput', () => {
  // Empty / whitespace
  it('returns invalid with no error for empty string', () => {
    expect(validateScoreInput('', 'json')).toEqual({ valid: false });
  });
  it('returns invalid with no error for whitespace-only string', () => {
    expect(validateScoreInput('   \n\t', 'json')).toEqual({ valid: false });
  });

  // JSON
  it('returns valid for valid JSON', () => {
    expect(validateScoreInput('{"notes":[]}', 'json')).toEqual({ valid: true });
  });
  it('returns invalid with error for invalid JSON', () => {
    const result = validateScoreInput('{bad', 'json');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  // ABC
  it('returns valid for valid ABC notation', () => {
    expect(
      validateScoreInput('X:1\nT:Test\nM:4/4\nL:1/4\nK:C\nCDEF|', 'abc'),
    ).toEqual({ valid: true });
  });
  it('returns invalid with error for invalid ABC notation', () => {
    const result = validateScoreInput('not valid abc', 'abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  // MusicXML
  it('returns valid for valid MusicXML', () => {
    const xml =
      '<score-partwise version="3.1"><part id="P1"></part></score-partwise>';
    expect(validateScoreInput(xml, 'musicxml')).toEqual({ valid: true });
  });
  it('returns invalid with error for malformed MusicXML', () => {
    const result = validateScoreInput('<unclosed', 'musicxml');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
