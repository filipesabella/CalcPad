import { StringStream } from '@codemirror/language';
import * as assert from 'assert';
import {
  describe,
  it,
} from 'vitest';
import { calcpadlang } from '../main/codemirror/calpadlang';

function styles(line: string): (string | null)[] {
  const stream = new StringStream(line, 2, 2);
  const state = calcpadlang.startState();
  const tokens: (string | null)[] = [];
  while (!stream.eol()) {
    tokens.push(calcpadlang.token(stream, state));
    assert.ok(stream.pos > stream.start, `stuck at ${stream.pos}`);
    stream.start = stream.pos;
  }
  return tokens;
}

describe('calcpadlang', () => {
  it('ends unterminated strings at the end of the line', () => {
    assert.deepEqual(styles('a + \''), [
      'variable',
      null,
      null,
      null,
      'string',
    ]);
    assert.deepEqual(styles('"abc'), ['string']);
  });

  it('tokenizes terminated strings', () => {
    assert.deepEqual(styles('\'a\' 1'), ['string', null, 'number']);
  });
});
