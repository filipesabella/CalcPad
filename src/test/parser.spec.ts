import * as assert from 'assert';
import { describe, it } from 'mocha';
import { Expr, Line } from '../main/lib/lang/ast';
import { parseLine } from '../main/lib/lang/parser';

// compact representation of the AST, ignoring spans
function show(expr: Expr): string {
  switch (expr.kind) {
    case 'number':
      return String(expr.value);
    case 'identifier':
      return expr.name;
    case 'unary':
      return `(${expr.operator}${show(expr.operand)})`;
    case 'binary':
      return `(${show(expr.left)} ${expr.operator} ${show(expr.right)})`;
    case 'percentage':
      return `(${show(expr.percentage)}% ${expr.operator} ${show(expr.base)})`;
    case 'conversion':
      return `(${show(expr.value)} ${expr.from} in ${expr.to})`;
    case 'conditional':
      return `(${show(expr.test)} ? ${show(expr.consequent)} : ${show(expr.alternate)})`;
    case 'call':
      return `${expr.callee}(${expr.args.map(show).join(', ')})`;
  }
}

function parse(text: string): string {
  const line: Line = parseLine(text);
  switch (line.kind) {
    case 'empty':
      return '';
    case 'expression':
      return show(line.expression);
    case 'assignment':
      return `${line.name} = ${show(line.expression)}`;
    case 'error':
      return `error: ${line.message} at ${line.span.from}-${line.span.to}`;
  }
}

describe('parser', () => {
  it('parses numbers', () => {
    assert.strictEqual(parse('0.3'), '0.3');
    assert.strictEqual(parse('.3'), '0.3');
    assert.strictEqual(parse('.3 + .3'), '(0.3 + 0.3)');
    assert.strictEqual(parse('(.3'), 'error: Expected \')\' at 1-3');
    assert.strictEqual(parse('1 +.3'), '(1 + 0.3)');
    assert.strictEqual(parse('1_000_000.01'), '1000000.01');
    assert.strictEqual(parse('1e3'), '1000');
  });

  it('parses empty lines and comments', () => {
    assert.strictEqual(parse(''), '');
    assert.strictEqual(parse('   '), '');
    assert.strictEqual(parse('# abc'), '');
    assert.strictEqual(parse('1 + 1 # abc'), '(1 + 1)');
  });

  it('parses assignments', () => {
    assert.strictEqual(parse('a = 1'), 'a = 1');
    assert.strictEqual(parse('a  =   1'), 'a = 1');
    assert.strictEqual(parse('preço = 1'), 'preço = 1');
    assert.strictEqual(parse('a = b >= 3 ? 1 : 0'), 'a = ((b >= 3) ? 1 : 0)');
    assert.strictEqual(parse('a b = 1'), 'error: Unexpected \'b\' at 2-3');
    assert.strictEqual(parse('a ='), 'error: Unexpected end of line at 2-3');
  });

  it('respects operator precedence', () => {
    assert.strictEqual(parse('1 + 2 * 3'), '(1 + (2 * 3))');
    assert.strictEqual(parse('1 - 2 - 3'), '((1 - 2) - 3)');
    assert.strictEqual(parse('2 ^ 3 ^ 2'), '(2 ^ (3 ^ 2))');
    assert.strictEqual(parse('-2 ^ 2'), '(-(2 ^ 2))');
    assert.strictEqual(parse('2 ^ -1'), '(2 ^ (-1))');
    assert.strictEqual(parse('10 mod 3 + 1'), '((10 mod 3) + 1)');
    assert.strictEqual(parse('1 + 2 < 4 && !a || b == 1'),
      '((((1 + 2) < 4) && (!a)) || (b == 1))');
    assert.strictEqual(parse('a > 1 ? b : c ? d : e'),
      '((a > 1) ? b : (c ? d : e))');
  });

  it('parses constants as identifiers', () => {
    assert.strictEqual(parse('PI/2'), '(PI / 2)');
    assert.strictEqual(parse('2*E'), '(2 * E)');
  });

  it('parses multipliers', () => {
    assert.strictEqual(parse('1k'), '1000');
    assert.strictEqual(parse('1K / 2'), '(1000 / 2)');
    assert.strictEqual(parse('1.5M'), '1500000');
    assert.strictEqual(parse('1 billion'), '1000000000');
    assert.strictEqual(parse('1BILLION'), '1000000000');
    assert.strictEqual(parse('a2k'), 'a2k');
    assert.strictEqual(parse('1 k'), 'error: Unexpected \'k\' at 2-3');
  });

  it('parses conversions', () => {
    assert.strictEqual(parse('1m to cm'), '(1 m in cm)');
    assert.strictEqual(parse('1m  in  cm'), '(1 m in cm)');
    assert.strictEqual(parse('1K m in cm'), '(1000 m in cm)');
    assert.strictEqual(parse('273K in C'), '(273 K in C)');
    assert.strictEqual(parse('1km in mi'), '(1 km in mi)');
    assert.strictEqual(parse('0 C in F'), '(0 C in F)');
    assert.strictEqual(parse('1 foot in meters'), '(1 ft in m)');
    assert.strictEqual(parse('1 cup in tbs'), '(1 cup in Tbs)');
    assert.strictEqual(parse('1 kilometers in miles'), '(1 km in mi)');
    assert.strictEqual(parse('5 in in cm'), '(5 in in cm)');
    assert.strictEqual(parse('10 km/h in m/s'), '(10 km/h in m/s)');
    assert.strictEqual(parse('1 fl-oz in ml'), '(1 fl-oz in ml)');
    assert.strictEqual(parse('x m in cm'), '(x m in cm)');
    assert.strictEqual(parse('(1 + 1) m in cm'), '((1 + 1) m in cm)');
    assert.strictEqual(parse('2 * 1m in cm'), '(2 * (1 m in cm))');
    assert.strictEqual(parse('1m in cm + 1ft in cm'),
      '((1 m in cm) + (1 ft in cm))');
    assert.strictEqual(parse('1 xyz in cm'), 'error: Unknown unit \'xyz\' at 2-5');
    assert.strictEqual(parse('1 m in'), 'error: Unexpected end of line at 4-6');
  });

  it('parses percentages', () => {
    assert.strictEqual(parse('10% of 14'), '(10% of 14)');
    assert.strictEqual(parse('10% off 100'), '(10% off 100)');
    assert.strictEqual(parse('10% on 100'), '(10% on 100)');
    assert.strictEqual(parse('10% of 1K'), '(10% of 1000)');
    assert.strictEqual(parse('4.8% of a'), '(4.8% of a)');
    assert.strictEqual(parse('10% of (14 / 2)'), '(10% of (14 / 2))');
    assert.strictEqual(parse('10% of 14 + 5% of 20'),
      '((10% of 14) + (5% of 20))');
    assert.strictEqual(parse('10% off 100 + 50'), '((10% off 100) + 50)');
    assert.strictEqual(parse('(a + b * c)% on 3'), '((a + (b * c))% on 3)');
    assert.strictEqual(parse('min(1, 2)% off 3'), '(min(1, 2)% off 3)');
    assert.strictEqual(parse('10% of min(1, 2)'), '(10% of min(1, 2))');
    assert.strictEqual(parse('10 % 3'),
      'error: Expected \'of\', \'on\' or \'off\' after \'%\' at 3-4');
  });

  it('parses function calls', () => {
    assert.strictEqual(parse('sqrt(9)'), 'sqrt(9)');
    assert.strictEqual(parse('sqrt ( 9 )'), 'sqrt(9)');
    assert.strictEqual(parse('random()'), 'random()');
    assert.strictEqual(parse('pow(sqrt(pow(2, 3)), 5 / 3) / 1k'),
      '(pow(sqrt(pow(2, 3)), (5 / 3)) / 1000)');
    assert.strictEqual(parse('pow(2, 3'), 'error: Expected \')\' at 7-8');
  });

  it('reports errors with their position', () => {
    assert.strictEqual(parse('1 + @'), 'error: Unexpected character \'@\' at 4-5');
    assert.strictEqual(parse('1 2'), 'error: Unexpected \'2\' at 2-3');
    assert.strictEqual(parse('1 +'), 'error: Unexpected end of line at 2-3');
  });
});
