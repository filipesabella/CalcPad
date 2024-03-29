import * as assert from 'assert';
import { describe, it } from 'mocha';
import { Preferences } from '../main/components/PreferencesDialog';
import { textToResults } from '../main/lib/evaluator';

const prefs: Preferences = {
  fontSize: 18,
  decimalPlaces: 2,
  theme: 'dark',
  decimalSeparator: '.',
  thousandsSeparator: ',',
};

const externalFunctions = `function sum(a, b) { return a + b; }`;

describe('textToResults', () => {
  it('evaluates assignments', () => {
    assert.deepStrictEqual(
      textToResults('a = 2\na / 2', externalFunctions, prefs),
      ['2', '1']);
    assert.deepStrictEqual(
      textToResults('a = 2\na / 2\na = 4\na / 2', externalFunctions, prefs),
      ['2', '1', '4', '2']);
  });

  it('rounds the results', () => {
    assert.deepStrictEqual(
      textToResults('10 / 3', externalFunctions, prefs),
      ['3.33']);
    assert.deepStrictEqual(
      textToResults('10 / 3', externalFunctions, { ...prefs, decimalPlaces: 3 }),
      ['3.333']);
  });

  it('ignores comments', () => {
    assert.deepStrictEqual(
      textToResults(`1 + 1
                     # test
                    2 + 1`, externalFunctions, prefs),
      ['2', '', '3']);
  });

  it('ignores empty lines', () => {
    assert.deepStrictEqual(
      textToResults(`1 + 1

                     2 + 1`, externalFunctions, prefs),
      ['2', '', '3']);
  });

  it('prepends external functions', () => {
    assert.deepStrictEqual(
      textToResults(`sum(1, 2)`, externalFunctions, prefs),
      ['3']);
  });
});
