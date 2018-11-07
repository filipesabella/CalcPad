// HERE BE DRAGONS
// This is implemented in the most simplistic way: by converting the user
// input text into something that can be `eval`ed in javascript.
// Not only that, it's implemented via regular expressions, making the
// code brittle and bug prone.
// A better implementation would be to actually describe the CalcPad
// format as a language and compile that down to javascript.

import { Forex, DefaultForex } from './forex';

export const mathFunctions = [
  'abs',
  'acos',
  'asin',
  'atan',
  'atan2',
  'ceil',
  'cos',
  'exp',
  'floor',
  'log',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sin',
  'sqrt',
  'tan',];

/**
 * Parses input text into a string that can be `eval`d.
 */
export function parse(text: string, forex: Forex = DefaultForex): string {
  if (isAssignment(text)) {
    return parseAssignment(text);
  } else if (isComment(text)) {
    return '// ' + text;
  } else {
    // the order here is important
    return [
      normaliseNumbers,
      parseOperators,
      parseConstants,
      parseMultipliers,
      parseConversions(forex),
      parseFunctions,
      parsePercentages,
    ].reduce((text, fn) => fn(text), text);
  }
}

function normaliseNumbers(text: string): string {
  return text.replace(/([^0-9]|^)\.(\d+)/g, '$10.$2');
}

function parseAssignment(text: string): string {
  // trick so that `eval` returns the value of the assignment.
  // Receives `a = 1`
  // Returns
  // `var a
  //  a = 1`
  const variable = text.substring(0, text.indexOf('=')).trim();
  const expression = text.substring(text.indexOf('=') + 1).trim();
  return 'var ' + variable + ';\n' + variable + ' = ' + parse(expression) + ';';
}

function parseOperators(text: string): string {
  return text.replace(/\^/g, '**');
}

function parseMultipliers(text: string): string {
  const multipliers: [RegExp, number][] = [
    [/(\d+\.?\d*)k/i, 1e3],
    [/(\d+\.?\d*)M/, 1e6],
    [/(\d+\.?\d*)\s*billion/i, 1e9],
  ];

  return multipliers.reduce((text, [regex, multi]) => {
    while (text.match(regex)) {
      text = text.replace(regex, (_, num) => '' + parseFloat(num) * multi);
    }
    return text;
  }, text);
}

function parsePercentages(text: string): string {
  const expressions: [RegExp, string][] = [
    [/(|\w+|\d+\.?\d*)%\s+of\s+(\(.*?\)|(\w+|\d+\.?\d*))/, '$2 * $1 / 100'],
    [/(|\w+|\d+\.?\d*)%\s+on\s+(\(.*?\)|(\w+|\d+\.?\d*))/, '$2 * $1 / 100 + $2'],
    [/(|\w+|\d+\.?\d*)%\s+off\s+(\(.*?\)|(\w+|\d+\.?\d*))/, '$2 - $2 * $1 / 100'],
  ];

  return expressions.reduce((text, [regex, replacement]) => {
    while (text.match(regex)) {
      text = text.replace(regex, replacement);
    }
    return text;
  }, text);
}

function parseConstants(text: string): string {
  const constants = [
    ['PI', '3.1415926536'],
    ['E', '2.7182818285'],
  ];

  return constants.reduce((text, [name, value]) => {
    const re = new RegExp(`(\\s|^)${name}(\\s|$)`, 'i');
    while (text.match(re)) {
      text = text.replace(re, `$1${value}$2`);
    }

    return text;
  }, text);
}

function parseFunctions(text: string): string {
  const regex = new RegExp(
    `(\\b)(${mathFunctions.join('|')})\\s*\\((.*?)\\)`, 'g');
  return text.replace(regex, '$1Math.$2($3)');
}

function parseConversions(forex: Forex) {
  return (text: string): string => {
    if (text.includes(' in ') || text.includes(' to ')) {
      text = normaliseConversions(text);

      const regex = /(\d+\.?\d*|\w+)\s*([^\s]+)\s+(in|to)\s+([^(\s|$)]+)/i;
      const match = text.match(regex);
      if (match) {
        const [_, value, from, __, to] = match;
        let converted: string;
        if (forex.hasOwnProperty(from)
          && forex.hasOwnProperty(to)) {
          const fromExchange = forex[from as keyof Forex];
          const toExchange = forex[to as keyof Forex];

          converted = `(${toExchange} * ${value} / ` + `${fromExchange})`;
        } else {
          converted = `convert(${value}).from('${from}').to('${to}')`;
        }
        text = text.replace(regex, '' + converted);
      }

    }
    return text;
  };
}

// normalises commonly used units to something usable
// by the `convert-units` lib
function normaliseConversions(text: string): string {
  const conversions = [
    ['tbs', 'Tbs'],
    ['cups', 'cup'],
    ['pint', 'pnt'],
    ['gallon', 'gal'],
    ['weeks', 'week'],
    ['months', 'month'],
    ['years', 'year'],
    ['foot', 'ft'],
    ['feet', 'ft'],
    ['kb', 'KB'],
    ['gb', 'GB'],
    ['mb', 'MB'],
    ['tb', 'TB'],
    ['celsius', 'C'],
    ['farenheit', 'F'],
    ['kelvin', 'K'],
    ['tbs', 'Tbs'],
    ['meters', 'm'],
    ['meter', 'm'],
  ];

  return conversions.reduce((acc, [from, to]) =>
    text = text.replace(new RegExp(from, 'i'), to), text);
}

export function isAssignment(text: string): boolean {
  return text.includes('=');
}

export function isComment(text: string): boolean {
  return text.trim().startsWith('#');
}
