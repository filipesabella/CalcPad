import {
  Expr,
  Line,
  Program,
} from './ast';
import {
  isConstant,
  isMathFunction,
} from './builtins';

/**
 * Compiles a program into the body of a javascript function which
 * receives the runtime as `$rt` and returns one entry per line: `null`
 * for lines that don't evaluate to anything, or a function that receives
 * the variables defined so far as `$s` and returns the line's value.
 *
 * Identifiers that are neither variables, constants nor math functions
 * are emitted as-is, so that the external functions file can be referenced.
 */
export function compile(program: Program): string {
  const [lines] = program.reduce<[string[], ReadonlySet<string>]>(
    ([lines, scope], line) => [
      lines.concat(compileLine(line, scope)),
      line.kind === 'assignment' ? new Set(scope).add(line.name) : scope,
    ],
    [[], new Set()],
  );

  return 'return [\n' + lines.map(l => '  ' + l + ',\n').join('') + '];';
}

function compileLine(line: Line, scope: ReadonlySet<string>): string {
  switch (line.kind) {
    case 'empty':
    case 'error':
      return 'null';
    case 'expression':
    case 'assignment':
      return `function ($s) { return ${compileExpr(line.expression, scope)}; }`;
  }
}

export function compileExpr(expr: Expr, scope: ReadonlySet<string>): string {
  const recur = (e: Expr) => compileExpr(e, scope);

  switch (expr.kind) {
    case 'number':
      return String(expr.value);
    case 'identifier':
      return compileIdentifier(expr.name, scope);
    case 'unary':
      return `(${expr.operator}${recur(expr.operand)})`;
    case 'binary':
      return `(${recur(expr.left)} ${
        jsOperators[expr.operator] || expr.operator
      } ${recur(expr.right)})`;
    case 'percentage':
      return `$rt.percentage.${expr.operator}(${recur(expr.percentage)}, ${
        recur(expr.base)
      })`;
    case 'conversion':
      return `$rt.convert(${recur(expr.value)}, ${JSON.stringify(expr.from)}, ${
        JSON.stringify(expr.to)
      })`;
    case 'conditional':
      return `(${recur(expr.test)} ? ${recur(expr.consequent)} : ${
        recur(expr.alternate)
      })`;
    case 'call':
      return `${compileCallee(expr.callee, scope)}(${
        expr.args.map(recur).join(', ')
      })`;
  }
}

const jsOperators: { readonly [operator: string]: string } = {
  '^': '**',
  'mod': '%',
  '==': '===',
  '!=': '!==',
};

function compileIdentifier(name: string, scope: ReadonlySet<string>): string {
  return scope.has(name)
    ? `$rt.lookup($s, ${JSON.stringify(name)})`
    : isConstant(name)
    ? `Math.${name.toUpperCase()}`
    : compileExternal(name);
}

function compileCallee(name: string, scope: ReadonlySet<string>): string {
  return scope.has(name)
    ? `$rt.lookup($s, ${JSON.stringify(name)})`
    : isMathFunction(name)
    ? `Math.${name}`
    : compileExternal(name);
}

// names that can't be safely emitted as-is fail when evaluated
function compileExternal(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && reserved.indexOf(name) === -1
    ? name
    : `$rt.undefined(${JSON.stringify(name)})`;
}

const reserved = [
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
];
