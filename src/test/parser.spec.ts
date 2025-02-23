import * as assert from 'assert';
import { describe, it } from 'mocha';
import { parse } from '../main/lib/parser';

describe('parser', () => {
  it('normalises numbers', () => {
    assert.strictEqual(parse('0.3'), '0.3');
    assert.strictEqual(parse('.3'), '0.3');
    assert.strictEqual(parse('.3 + .3'), '0.3 + 0.3');
    assert.strictEqual(parse(' .3'), ' 0.3');
    assert.strictEqual(parse('(.3'), '(0.3');
    assert.strictEqual(parse('1 +.3'), '1 +0.3');
  });

  it('parses assignments', () => {
    assert.strictEqual(parse('a = 1'), 'var a;\na = 1;');
    assert.strictEqual(parse('a  =   1'), 'var a;\na = 1;');
  });

  it('parses the pow operator', () => {
    assert.strictEqual(parse('1 ^ 2'), '1 ** 2');
    assert.strictEqual(parse('1  ^  2'), '1  **  2');
  });

  it('parses comments', () => {
    assert.strictEqual(parse('# abc'), '// abc');
  });

  describe('parses constants', () => {
    it('parses PI', () => {
      assert.strictEqual(parse('PI'), '3.1415926536');
      assert.strictEqual(parse(' PI'), ' 3.1415926536');
      assert.strictEqual(parse('PI '), '3.1415926536 ');
      assert.strictEqual(parse(' PI '), ' 3.1415926536 ');
      assert.strictEqual(parse('PI / 2'), '3.1415926536 / 2');
      assert.strictEqual(parse('2 + PI'), '2 + 3.1415926536');
      assert.strictEqual(parse('a = PI / 2'), 'var a;\na = 3.1415926536 / 2;');
    });

    it('parses E', () => {
      assert.strictEqual(parse('E'), '2.7182818285');
      assert.strictEqual(parse(' E'), ' 2.7182818285');
      assert.strictEqual(parse('E '), '2.7182818285 ');
      assert.strictEqual(parse(' E '), ' 2.7182818285 ');
      assert.strictEqual(parse('E / 2'), '2.7182818285 / 2');
      assert.strictEqual(parse('2 + E'), '2 + 2.7182818285');
      assert.strictEqual(parse('a = E / 2'), 'var a;\na = 2.7182818285 / 2;');
    });
  });

  describe('parses multipliers', () => {
    it('parses K', () => {
      assert.strictEqual(parse('1k'), '1000');
      assert.strictEqual(parse('1K'), '1000');
      assert.strictEqual(parse('a = 1K'), 'var a;\na = 1000;');
      assert.strictEqual(parse('1K / 2'), '1000 / 2');
    });

    it('parses M', () => {
      assert.strictEqual(parse('1M'), '1000000');
      assert.strictEqual(parse('a = 1M'), 'var a;\na = 1000000;');
      assert.strictEqual(parse('1M / 2'), '1000000 / 2');
    });

    it('parses billion', () => {
      assert.strictEqual(parse('1 billion'), '1000000000');
      assert.strictEqual(parse('1 BILLION'), '1000000000');
      assert.strictEqual(parse('a = 1 billion'), 'var a;\na = 1000000000;');
      assert.strictEqual(parse('1 billion / 2'), '1000000000 / 2');
    });
  });

  describe('conversions', () => {
    it('parses conversions', () => {
      assert.strictEqual(parse('1m to cm'), 'convert(1).from(\'m\').to(\'cm\')');
      assert.strictEqual(parse('1m in cm'), 'convert(1).from(\'m\').to(\'cm\')');
      assert.strictEqual(parse('1m  in  cm'), 'convert(1).from(\'m\').to(\'cm\')');
      assert.strictEqual(parse('1K m  in  cm'),
        'convert(1000).from(\'m\').to(\'cm\')');
      assert.strictEqual(parse('a = 1m  in  cm'),
        'var a;\na = convert(1).from(\'m\').to(\'cm\');');
      assert.strictEqual(parse('0 C in F'), 'convert(0).from(\'C\').to(\'F\')');
    });
  });

  it('parses percentages', () => {
    assert.strictEqual(parse('10% of 14'), '14 * 10 / 100');
    assert.strictEqual(parse('10% off 100'), '100 - 100 * 10 / 100');
    assert.strictEqual(parse('10% on 100'), '100 * 10 / 100 + 100');
    assert.strictEqual(parse('10%  of  100'), '100 * 10 / 100');
    assert.strictEqual(parse('10% of 1K'), '1000 * 10 / 100');
    assert.strictEqual(parse('a = 10% of 100'), 'var a;\na = 100 * 10 / 100;');

    assert.strictEqual(parse('10% of (14 / 2)'), '(14 / 2) * 10 / 100');

    assert.strictEqual(parse('(5% on 10) - 2'), '(10 * 5 / 100 + 10) - 2');
    assert.strictEqual(parse('10% of 14 + 5% of 20'), '14 * 10 / 100 + 20 * 5 / 100');
    assert.strictEqual(parse('(10% of 14) + (5% of 20)'),
      '(14 * 10 / 100) + (20 * 5 / 100)');

    assert.strictEqual(parse('a% of 14'), '14 * a / 100');
    assert.strictEqual(parse('10% of a'), 'a * 10 / 100');
  });

  describe('functions', () => {
    it('parses functions', () => {
      assert.strictEqual(parse('sqrt(9)'), 'Math.sqrt(9)');
      assert.strictEqual(parse('sqrt (9)'), 'Math.sqrt(9)');
      assert.strictEqual(parse('sqrt ( 9 )'), 'Math.sqrt( 9 )');
      assert.strictEqual(parse('pow(2, 3)'), 'Math.pow(2, 3)');
      assert.strictEqual(parse('a = sqrt(9)'), 'var a;\na = Math.sqrt(9);');
      assert.strictEqual(parse('sqrt(9) / 1k'), 'Math.sqrt(9) / 1000');
    });

    it('does not parse the `convert` function', () => {
      assert.strictEqual(parse('convert(9)'), 'convert(9)');
      assert.strictEqual(parse('sqrt(1.5) + convert(9)'),
        'Math.sqrt(1.5) + convert(9)');
    });

    it('parses nested functions', () => {
      assert.strictEqual(parse('sqrt(pow(2, 3))'), 'Math.sqrt(Math.pow(2, 3))');
      assert.strictEqual(parse('sqrt(pow(2, 3)) / 1k'),
        'Math.sqrt(Math.pow(2, 3)) / 1000');
      assert.strictEqual(parse('pow(sqrt(pow(2, 3)), 5 / 3) / 1k'),
        'Math.pow(Math.sqrt(Math.pow(2, 3)), 5 / 3) / 1000');
    });
  });

  // this will only get worse with time
  describe('special cases', () => {
    it('case #1', () => {
      assert.strictEqual(parse('10% of min(1, 2)'), 'Math.min(1, 2) * 10 / 100');
      assert.strictEqual(parse('10% off min(1, 2)'), 'Math.min(1, 2) - Math.min(1, 2) * 10 / 100');
      assert.strictEqual(parse('10% on min(1, 2)'), 'Math.min(1, 2) * 10 / 100 + Math.min(1, 2)');
    });

    it('case #2', () => {
      assert.strictEqual(parse('(5 + 10)% of 3'), '3 * (5 + 10) / 100');
      assert.strictEqual(parse('(a + b * c)% of 3'), '3 * (a + b * c) / 100');
      assert.strictEqual(parse('min(1, 2)% of 3'), '3 * Math.min(1, 2) / 100');

      assert.strictEqual(parse('(5 + 10)% off 3'), '3 - 3 * (5 + 10) / 100');
      assert.strictEqual(parse('(a + b * c)% off 3'), '3 - 3 * (a + b * c) / 100');
      assert.strictEqual(parse('min(1, 2)% off 3'), '3 - 3 * Math.min(1, 2) / 100');

      assert.strictEqual(parse('(5 + 10)% on 3'), '3 * (5 + 10) / 100 + 3');
      assert.strictEqual(parse('(a + b * c)% on 3'), '3 * (a + b * c) / 100 + 3');
      assert.strictEqual(parse('min(1, 2)% on 3'), '3 * Math.min(1, 2) / 100 + 3');
    });
  });
});
