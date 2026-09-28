import {
  BinaryOperator,
  Expr,
  isLangError,
  LangError,
  Line,
  PercentageOperator,
  Program,
  Span,
} from './ast';
import { multipliers } from './builtins';
import {
  Token,
  tokenize,
} from './lexer';
import { resolveUnit } from './units';

/**
 * A parsed node and the position of the token right after it.
 */
interface Parsed<T> {
  readonly node: T;
  readonly pos: number;
}

type Infix =
  | { kind: 'binary', operator: BinaryOperator, precedence: number }
  | { kind: 'percentage', operator: PercentageOperator, precedence: number };

// `^` and unary operators bind tighter than all of these,
// see `parseUnary` and `parsePower`
const precedences: { readonly [operator: string]: number } = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  'mod': 6,
};

// `10% of 14 + 5% of 20` is `(10% of 14) + (5% of 20)`
const percentagePrecedence = precedences['*'];

const percentageOperators = ['of', 'on', 'off'];

const conversionKeywords = ['in', 'to'];

const billion = 1e9;

export function parseProgram(text: string): Program {
  return text.split('\n').map(parseLine);
}

/**
 * Never throws, errors are returned as an `error` line.
 */
export function parseLine(line: string): Line {
  try {
    const tokens = tokenize(line);
    return tokens.length === 0 ? { kind: 'empty' } : parseStatement(tokens);
  } catch (e) {
    if (isLangError(e)) {
      return { kind: 'error', message: e.message, span: e.span };
    }
    throw e;
  }
}

const span = (start: Span, end: Span = start): Span => ({
  from: start.from,
  to: end.to,
});

const error = (message: string, where: Span): LangError => ({
  message,
  span: span(where),
});

function parseStatement(tokens: readonly Token[]): Line {
  const at = (pos: number): Token | undefined => tokens[pos];

  const is = (pos: number, text: string) => {
    const token = at(pos);
    return !!token && token.text === text;
  };

  const isOneOf = (pos: number, texts: string[]) => {
    const token = at(pos);
    return !!token && token.type === 'identifier'
      && texts.indexOf(token.text) !== -1;
  };

  const unexpected = (pos: number): never => {
    const token = at(pos);
    throw token
      ? error(`Unexpected '${token.text}'`, token)
      : error('Unexpected end of line', tokens[tokens.length - 1]);
  };

  const expect = (pos: number, text: string): void => {
    if (!is(pos, text)) {
      throw error(`Expected '${text}'`, at(pos) || tokens[tokens.length - 1]);
    }
  };

  const parseAll = (pos: number): Expr => {
    const expression = parseConditional(pos);
    return expression.pos < tokens.length
      ? unexpected(expression.pos)
      : expression.node;
  };

  const parseConditional = (pos: number): Parsed<Expr> => {
    const test = parseBinary(1)(pos);
    if (!is(test.pos, '?')) {
      return test;
    }
    const consequent = parseConditional(test.pos + 1);
    expect(consequent.pos, ':');
    const alternate = parseConditional(consequent.pos + 1);
    return {
      node: {
        kind: 'conditional',
        test: test.node,
        consequent: consequent.node,
        alternate: alternate.node,
        span: span(test.node.span, alternate.node.span),
      },
      pos: alternate.pos,
    };
  };

  const infixAt = (pos: number): Infix | undefined => {
    const token = at(pos);
    if (!token) {
      return undefined;
    } else if (token.text === '%') {
      if (!isOneOf(pos + 1, percentageOperators)) {
        throw error('Expected \'of\', \'on\' or \'off\' after \'%\'', token);
      }
      return {
        kind: 'percentage',
        operator: (at(pos + 1) as Token).text as PercentageOperator,
        precedence: percentagePrecedence,
      };
    } else {
      const isOperator = token.type === 'operator' || token.text === 'mod';
      return isOperator && precedences.hasOwnProperty(token.text)
        ? {
          kind: 'binary',
          operator: token.text as BinaryOperator,
          precedence: precedences[token.text],
        }
        : undefined;
    }
  };

  const parseBinary = (minPrecedence: number) => (pos: number) =>
    continueBinary(minPrecedence, parseUnary(pos));

  const continueBinary = (
    minPrecedence: number,
    left: Parsed<Expr>,
  ): Parsed<Expr> => {
    const infix = infixAt(left.pos);
    if (!infix || infix.precedence < minPrecedence) {
      return left;
    } else if (infix.kind === 'percentage') {
      const base = parseUnary(left.pos + 2);
      return continueBinary(minPrecedence, {
        node: {
          kind: 'percentage',
          operator: infix.operator,
          percentage: left.node,
          base: base.node,
          span: span(left.node.span, base.node.span),
        },
        pos: base.pos,
      });
    } else {
      const right = parseBinary(infix.precedence + 1)(left.pos + 1);
      return continueBinary(minPrecedence, {
        node: {
          kind: 'binary',
          operator: infix.operator,
          left: left.node,
          right: right.node,
          span: span(left.node.span, right.node.span),
        },
        pos: right.pos,
      });
    }
  };

  // -2 ^ 2 is -(2 ^ 2)
  const parseUnary = (pos: number): Parsed<Expr> => {
    const token = at(pos);
    if (
      token && token.type === 'operator'
      && (token.text === '-' || token.text === '+' || token.text === '!')
    ) {
      const operand = parseUnary(pos + 1);
      return {
        node: {
          kind: 'unary',
          operator: token.text,
          operand: operand.node,
          span: span(token, operand.node.span),
        },
        pos: operand.pos,
      };
    }
    return parsePower(pos);
  };

  // right associative, 2 ^ 3 ^ 2 is 2 ^ (3 ^ 2)
  const parsePower = (pos: number): Parsed<Expr> => {
    const base = parseConversion(pos);
    if (!is(base.pos, '^')) {
      return base;
    }
    const exponent = parseUnary(base.pos + 1);
    return {
      node: {
        kind: 'binary',
        operator: '^',
        left: base.node,
        right: exponent.node,
        span: span(base.node.span, exponent.node.span),
      },
      pos: exponent.pos,
    };
  };

  // `1 m in cm`, `x ft to m`, `(1 + 1) km/h in m/s`
  const parseConversion = (pos: number): Parsed<Expr> => {
    const value = parsePostfix(pos);
    const from = unitAt(value.pos);
    if (!from || !isOneOf(from.pos, conversionKeywords)) {
      return value;
    }
    const to = unitAt(from.pos + 1) || unexpected(from.pos + 1);
    return {
      node: {
        kind: 'conversion',
        value: value.node,
        from: resolve(from.node),
        to: resolve(to.node),
        span: span(value.node.span, to.node),
      },
      pos: to.pos,
    };
  };

  // units are identifiers, optionally joined by `/` or `-`: `km/h`, `fl-oz`
  const unitAt = (pos: number): Parsed<Token> | undefined => {
    const token = at(pos);
    return token && token.type === 'identifier'
      ? continueUnit({ node: token, pos: pos + 1 })
      : undefined;
  };

  const continueUnit = (unit: Parsed<Token>): Parsed<Token> => {
    const separator = at(unit.pos);
    const next = at(unit.pos + 1);
    const isJoined = !!separator && !!next
      && (separator.text === '/' || separator.text === '-')
      && next.type === 'identifier'
      && separator.from === unit.node.to
      && next.from === separator.to;
    return isJoined
      ? continueUnit({
        node: {
          type: 'identifier',
          text: unit.node.text + (separator as Token).text
            + (next as Token).text,
          from: unit.node.from,
          to: (next as Token).to,
        },
        pos: unit.pos + 2,
      })
      : unit;
  };

  const resolve = (unit: Token): string => {
    const resolved = resolveUnit(unit.text);
    if (resolved === undefined) {
      throw error(`Unknown unit '${unit.text}'`, unit);
    }
    return resolved;
  };

  // `1k`, `1.5M`, `1 billion`
  const parsePostfix = (pos: number): Parsed<Expr> => {
    const primary = parsePrimary(pos);
    const literal = at(pos) as Token;
    const suffix = at(primary.pos);
    if (
      primary.node.kind !== 'number' || literal.type !== 'number'
      || !suffix || suffix.type !== 'identifier'
    ) {
      return primary;
    }

    // `273K in C` is kelvin, `1K m in cm` is a thousand meters
    const multiplier = suffix.text.toLowerCase() === 'billion'
      ? billion
      : multipliers.hasOwnProperty(suffix.text)
          && suffix.from === literal.to
          && !isOneOf(primary.pos + 1, conversionKeywords)
      ? multipliers[suffix.text]
      : undefined;

    return multiplier === undefined ? primary : {
      node: {
        kind: 'number',
        value: primary.node.value * multiplier,
        span: span(literal, suffix),
      },
      pos: primary.pos + 1,
    };
  };

  const parsePrimary = (pos: number): Parsed<Expr> => {
    const token = at(pos);
    if (!token) {
      return unexpected(pos);
    } else if (token.type === 'number') {
      return {
        node: {
          kind: 'number',
          value: Number(token.text.replace(/_/g, '')),
          span: span(token),
        },
        pos: pos + 1,
      };
    } else if (token.type === 'identifier') {
      return is(pos + 1, '(')
        ? parseCall(pos)
        : {
          node: { kind: 'identifier', name: token.text, span: span(token) },
          pos: pos + 1,
        };
    } else if (token.text === '(') {
      const inner = parseConditional(pos + 1);
      expect(inner.pos, ')');
      return { node: inner.node, pos: inner.pos + 1 };
    } else {
      return unexpected(pos);
    }
  };

  const parseCall = (pos: number): Parsed<Expr> => {
    const callee = at(pos) as Token;
    const args = parseArguments(pos + 2, []);
    return {
      node: {
        kind: 'call',
        callee: callee.text,
        args: args.node,
        span: span(callee, tokens[args.pos - 1]),
      },
      pos: args.pos,
    };
  };

  const parseArguments = (
    pos: number,
    args: readonly Expr[],
  ): Parsed<readonly Expr[]> => {
    if (args.length === 0 && is(pos, ')')) {
      return { node: args, pos: pos + 1 };
    }
    const arg = parseConditional(pos);
    const all = args.concat([arg.node]);
    if (is(arg.pos, ',')) {
      return parseArguments(arg.pos + 1, all);
    }
    expect(arg.pos, ')');
    return { node: all, pos: arg.pos + 1 };
  };

  if (tokens[0].type === 'identifier' && is(1, '=')) {
    const expression = parseAll(2);
    return {
      kind: 'assignment',
      name: tokens[0].text,
      expression,
      span: span(tokens[0], expression.span),
    };
  } else {
    return { kind: 'expression', expression: parseAll(0) };
  }
}
