import { describe, it } from 'mocha';
import assert from 'assert';
import { shouldSkipSearch } from '../src/services/SearchDecision';

describe('SearchDecision.shouldSkipSearch', () => {
  it('should search for acronym+digits like "UFC 317"', () => {
    const d = shouldSkipSearch('UFC 317');
    assert.strictEqual(d.skip, false);
  });

  it('should search for single proper-noun topics (default-search)', () => {
    const d = shouldSkipSearch('Ottawa');
    assert.strictEqual(d.skip, false);
  });

  it('should skip broad domain', () => {
    const d = shouldSkipSearch('geography');
    assert.strictEqual(d.skip, true);
  });

  it('should skip computational prompts', () => {
    const d = shouldSkipSearch('expected value of two dice');
    assert.strictEqual(d.skip, true);
  });

  it('should search when year is present', () => {
    const d = shouldSkipSearch('Oscars 2024');
    assert.strictEqual(d.skip, false);
  });

  it('should search for roman numeral events', () => {
    const d = shouldSkipSearch('Super Bowl LVIII');
    assert.strictEqual(d.skip, false);
  });

  it('should mark ultra-short topics to skip', () => {
    const d = shouldSkipSearch('ab');
    assert.strictEqual(d.skip, true);
  });
});


