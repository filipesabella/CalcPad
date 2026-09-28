import { LangError } from './ast';

export type TokenType = 'number' | 'identifier' | 'operator';

export interface Token {
  readonly type: TokenType;
  readonly text: string;
  readonly from: number;
  readonly to: number;
}

// `1`, `1.5`, `1.`, `.5`, `1_000`, `1e3`
const numberRegex =
  /^(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d+)?/;

const identifierRegex = /^[\p{L}_][\p{L}\p{N}_]*/u;

// longest first
const operators = [
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '+',
  '-',
  '*',
  '/',
  '^',
  '%',
  '(',
  ')',
  ',',
  '?',
  ':',
  '=',
  '<',
  '>',
  '!',
];

/**
 * Splits a single line into tokens, dropping whitespace and comments.
 * Throws a `LangError` on characters that are not part of the language.
 */
export function tokenize(line: string): readonly Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < line.length) {
    const rest = line.slice(pos);
    const whitespace = rest.match(/^\s+/);
    const number = rest.match(numberRegex);
    const identifier = rest.match(identifierRegex);
    const operator = operators.find(o => rest.startsWith(o));

    if (whitespace) {
      pos += whitespace[0].length;
    } else if (rest[0] === '#') {
      break;
    } else {
      const [type, text]: [TokenType, string] = number
        ? ['number', number[0]]
        : identifier
        ? ['identifier', identifier[0]]
        : operator
        ? ['operator', operator]
        : unexpected(rest, pos);

      tokens.push({ type, text, from: pos, to: pos + text.length });
      pos += text.length;
    }
  }

  return tokens;
}

function unexpected(rest: string, pos: number): never {
  const char = String.fromCodePoint(rest.codePointAt(0) as number);
  const error: LangError = {
    message: `Unexpected character '${char}'`,
    span: { from: pos, to: pos + char.length },
  };
  throw error;
}
