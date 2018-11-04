import * as assert from 'assert';
import { describe, it } from 'mocha';
import { textToResults } from '../main/evaluator';

describe('textToResults', () => {
  it('evaluates assignments', () => {
    assert.deepEqual(textToResults('a = 2\na / 2'), [2, 1]);
    assert.deepEqual(textToResults('a = 2\na / 2\na = 4\na / 2'), [2, 1, 4, 2]);
  });

  it('rounds the results', () => {
    assert.deepEqual(textToResults('10 / 3'), [3.33]);
    assert.deepEqual(textToResults('10 / 3', 3), [3.333]);
  });

  it('ignores comments', () => {
    assert.deepEqual(textToResults(`1 + 1
      # test
      2 + 1`), [2, '', 3]);
  });

  it('ignores empty lines', () => {
    assert.deepEqual(textToResults(`1 + 1

      2 + 1`), [2, '', 3]);
  });
});
