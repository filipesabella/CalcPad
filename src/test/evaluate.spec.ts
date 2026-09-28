import * as assert from 'assert';
import {
  describe,
  it,
} from 'vitest';
import {
  evaluate,
  LineResult,
} from '../main/lib/lang/evaluate';

const externalFunctions = `
  function sum(a, b) { return a + b; }
  function yes() { return true; }
  const rate = 2;`;

// value of the last line
function run(text: string, external: string = externalFunctions): number {
  const results = evaluate(text, external);
  const last = results[results.length - 1];
  if (last.kind !== 'value') {
    throw new Error(`Expected a value, got ${JSON.stringify(last)}`);
  }
  return last.value;
}

function lastResult(text: string): LineResult {
  const results = evaluate(text, externalFunctions);
  return results[results.length - 1];
}

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

describe('evaluate', () => {
  it('evaluates arithmetic', () => {
    assert.strictEqual(run('1 + 1'), 2);
    assert.strictEqual(run('(10 + 5) / 5'), 3);
    assert.strictEqual(run('2 ^ 3'), 8);
    assert.strictEqual(run('-2 ^ 2'), -4);
    assert.strictEqual(run('10 mod 3'), 1);
    assert.strictEqual(run('1 / 0'), Infinity);
  });

  it('evaluates one result per line', () => {
    assert.deepStrictEqual(evaluate('1\n\n# c\n2', ''), [
      { kind: 'value', value: 1 },
      { kind: 'empty' },
      { kind: 'empty' },
      { kind: 'value', value: 2 },
    ]);
  });

  it('evaluates assignments', () => {
    assert.strictEqual(run('a = 2\na / 2'), 1);
    assert.strictEqual(run('a = 2\na = a * 3\na'), 6);
    assert.strictEqual(run('preço = 2\npreço * 2'), 4);
  });

  it('keeps the previous value when an assignment fails', () => {
    assert.strictEqual(run('a = 2\na = foo\na'), 2);
    assert.strictEqual(run('a = 2\na = 1 +\na'), 2);
  });

  it('does not clobber the evaluator with variable names', () => {
    assert.strictEqual(run('results = 1\nscope = 2\nresults + scope'), 3);
    assert.strictEqual(run('toString = 1\ntoString'), 1);
    assert.deepStrictEqual(lastResult('constructor').kind, 'error');
  });

  it('evaluates random only once per line', () => {
    const [a, b] = evaluate('a = random()\na', '');
    assert.deepStrictEqual(a, b);
  });

  it('evaluates constants', () => {
    assert.strictEqual(run('PI / 2'), Math.PI / 2);
    assert.strictEqual(run('PI/2'), Math.PI / 2);
    assert.strictEqual(run('2*E'), 2 * Math.E);
    assert.strictEqual(run('PI = 3\nPI'), 3);
    assert.strictEqual(run('pi'), Math.PI);
    assert.strictEqual(run('Pi * 2'), Math.PI * 2);
    assert.strictEqual(run('e'), Math.E);
    assert.strictEqual(run('e = 3\ne'), 3);
  });

  it('evaluates multipliers', () => {
    assert.strictEqual(run('1k'), 1000);
    assert.strictEqual(run('1.5K'), 1500);
    assert.strictEqual(run('1M / 2'), 500000);
    assert.strictEqual(run('1 billion / 2'), 500000000);
  });

  it('evaluates conversions', () => {
    assert.strictEqual(run('1m in cm'), 100);
    assert.strictEqual(run('1K m in cm'), 100000);
    assert.strictEqual(run('a = 1m in cm\na'), 100);
    assert.strictEqual(run('0 C in F'), 32);
    close(run('273.15K in C'), 0);
    assert.strictEqual(run('1 foot in meters').toFixed(4), '0.3048');
    assert.strictEqual(run('1 cup in tbs'), 16);
    assert.strictEqual(run('1 hour in minutes'), 60);
    assert.strictEqual(run('1 GB in MB'), 1024);
    assert.strictEqual(run('1m in cm * 2'), 200);
    assert.strictEqual(run('1m in cm + 1cm in mm'), 110);
    assert.deepStrictEqual(lastResult('1 kg in m'), {
      kind: 'error',
      message: 'Cannot convert incompatible measures of length and mass',
      span: { from: 0, to: 9 },
    });
  });

  it('evaluates percentages', () => {
    assert.strictEqual(run('10% of 14'), 1.4);
    assert.strictEqual(run('10% off 100'), 90);
    assert.strictEqual(run('10% on 100'), 110);
    assert.strictEqual(run('10% of 1K'), 100);
    assert.strictEqual(run('10% of 100.5'), 10.05);
    assert.strictEqual(run('10% of (14 / 2)'), 0.7);
    assert.strictEqual(run('(5% on 10) - 2'), 8.5);
    close(run('10% of 14 + 5% of 20'), 2.4);
    assert.strictEqual(run('10% off 100 + 50'), 140);
    assert.strictEqual(run('a = 10\na% of 14'), 1.4);
    assert.strictEqual(run('(5 + 10)% of 20'), 3);
    assert.strictEqual(run('min(10, 20)% off 30'), 27);
    assert.strictEqual(run('10% on min(100, 200)'), 110);
  });

  it('evaluates functions', () => {
    assert.strictEqual(run('sqrt(9)'), 3);
    assert.strictEqual(run('sqrt ( 9 )'), 3);
    assert.strictEqual(run('pow(2, 3)'), 8);
    assert.strictEqual(run('sqrt(pow(2, 4)) / 1k'), 0.004);
    assert.ok(run('random()') < 1);
  });

  it('evaluates conditionals', () => {
    assert.strictEqual(run('money = 5k\nmoney > 5k ? 15 : 10'), 10);
    assert.strictEqual(run('money = 5k\nmoney >= 5k ? 15 : 10'), 15);
    assert.strictEqual(run('a = 1\na == 1 && a != 2 ? 1 : 0'), 1);
  });

  it('evaluates external functions', () => {
    assert.strictEqual(run('sum(1, 2)'), 3);
    assert.strictEqual(run('rate * 2'), 4);
    assert.strictEqual(run('rate = 3\nrate * 2'), 6);
  });

  it('ignores a broken external functions file', () => {
    assert.strictEqual(run('1 + 1', 'function ('), 2);
  });

  it('reports errors', () => {
    assert.deepStrictEqual(lastResult('1 + foo'), {
      kind: 'error',
      message: 'foo is not defined',
      span: { from: 0, to: 7 },
    });
    assert.deepStrictEqual(lastResult('a = new'), {
      kind: 'error',
      message: 'new is not defined',
      span: { from: 0, to: 7 },
    });
    assert.deepStrictEqual(lastResult('1 > 2'), {
      kind: 'error',
      message: 'Expected a number, got boolean',
      span: { from: 0, to: 5 },
    });
    assert.deepStrictEqual(lastResult('yes()').kind, 'error');
    assert.deepStrictEqual(lastResult('1 +'), {
      kind: 'error',
      message: 'Unexpected end of line',
      span: { from: 2, to: 3 },
    });
  });
});
