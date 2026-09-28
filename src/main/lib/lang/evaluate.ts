import { Line, Span } from './ast';
import { compile } from './codegen';
import { parseProgram } from './parser';
import { convertUnits } from './units';

export type LineResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'value'; readonly value: number }
  | { readonly kind: 'error'; readonly message: string; readonly span: Span };

type Scope = { readonly [name: string]: number };

type LineFunction = (scope: Scope) => unknown;

const hasOwn = (o: object, key: string) =>
  Object.prototype.hasOwnProperty.call(o, key);

const notDefined = (name: string) =>
  new ReferenceError(`${name} is not defined`);

// available to the compiled code as `$rt`
const runtime = {
  lookup: (scope: Scope, name: string): number => {
    if (!hasOwn(scope, name)) {
      throw notDefined(name);
    }
    return scope[name];
  },
  undefined: (name: string): never => {
    throw notDefined(name);
  },
  percentage: {
    of: (percentage: number, base: number) => base * percentage / 100,
    on: (percentage: number, base: number) => base * percentage / 100 + base,
    off: (percentage: number, base: number) => base - base * percentage / 100,
  },
  convert: convertUnits,
};

/**
 * Receives
 * 1 + 2
 * a = 20
 * a * 2
 *
 * and returns one result per line
 * [3, 20, 40]
 */
export function evaluate(
  text: string,
  externalFunctions: string): readonly LineResult[] {
  const program = parseProgram(text);
  const functions = instantiate(compile(program), externalFunctions);

  return program.reduce<[LineResult[], Scope]>(
    ([results, scope], line, i) => {
      const [result, nextScope] = evaluateLine(line, functions[i], scope);
      return [results.concat([result]), nextScope];
    },
    [[], {}])[0];
}

function instantiate(
  source: string,
  externalFunctions: string): readonly (LineFunction | null)[] {
  try {
    return new Function('$rt', externalFunctions + '\n' + source)(runtime);
  } catch (e) {
    // a broken external functions file shouldn't break everything else
    if (externalFunctions) {
      return instantiate(source, '');
    }
    throw e;
  }
}

function evaluateLine(
  line: Line,
  fn: LineFunction | null,
  scope: Scope): [LineResult, Scope] {
  switch (line.kind) {
    case 'empty':
      return [{ kind: 'empty' }, scope];
    case 'error':
      return [{ kind: 'error', message: line.message, span: line.span }, scope];
    case 'expression':
    case 'assignment':
      try {
        const value = (fn as LineFunction)(scope);
        if (typeof value !== 'number') {
          throw new TypeError(`Expected a number, got ${typeof value}`);
        }
        return [
          { kind: 'value', value },
          line.kind === 'assignment' ? { ...scope, [line.name]: value } : scope,
        ];
      } catch (e) {
        return [{
          kind: 'error',
          message: e instanceof Error ? e.message : String(e),
          span: line.kind === 'assignment' ? line.span : line.expression.span,
        }, scope];
      }
  }
}
