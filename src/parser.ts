const convert = require('convert-units');

export const keywords = [
  // constants
  'PI', 'E',
  // conversion keywords
  'in', 'to',
  // math functions
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
  'tan',
];

/**
 * Parses input text into a string that can be `eval`d.
 */
export function parse(text: string): string {
  text = text.replace(/\^/g, '**');
  if (isAssignment(text)) {
    // trick so that `eval` returns the value of the assignment.
    // receives `a = 1` and returns
    // `var a
    //  a = 1`
    const variable = text.substring(0, text.indexOf('=')).trim();
    const expression = text.substring(text.indexOf('=') + 1).trim();
    return 'var ' + variable + '\n' + variable + ' = ' + parse(expression);
  } else if (isComment(text)) {
    return '// ' + text;
  } else {
    text = parseConversions(text);
    text = parseMultipliers(text);
    text = parsePercentages(text);
    text = parseConstants(text);
    text = parseFunctions(text);
    return text;
  }
}

function parseMultipliers(text: string): string {
  while (text.match(/(\d+\.?\d*)k/i)) {
    text = text.replace(/(\d+\.?\d*)k/i, '$1 * 1e3');
  }

  while (text.match(/(\d+\.?\d*)M/)) {
    text = text.replace(/(\d+\.?\d*)M/, '$1 * 1e6');
  }

  while (text.match(/(\d+\.?\d*)\s?billion/)) {
    text = text.replace(/(\d+\.?\d*)\s?billion/, '$1 * 1e9');
  }

  return text;
}

function parsePercentages(text: string): string {
  while (text.match(/(\d+\.?\d*)% of (\d+\.?\d*)/)) {
    text = text.replace(/(\d+\.?\d*)% of (\d+\.?\d*)/, '$2 * $1 / 100');
  }

  while (text.match(/(\d+\.?\d*)% on (\d+\.?\d*)/)) {
    text = text.replace(/(\d+\.?\d*)% on (\d+\.?\d*)/, '$2 * $1 / 100 + $2');
  }

  while (text.match(/(\d+\.?\d*)% off (\d+\.?\d*)/)) {
    text = text.replace(/(\d+\.?\d*)% off (\d+\.?\d*)/, '$2 - $2 * $1 / 100');
  }

  return text;
}

function parseConstants(text: string): string {
  while (text.match(/(\s|^)PI(\s|$)/i)) {
    text = text.replace(/(\s|^)PI(\s|$)/i, '3.1415926536');
  }

  while (text.match(/(\s|^)E(\s|$)/)) {
    text = text.replace(/(\s|^)E(\s|$)/, '2.7182818285');
  }

  return text;
}

function parseFunctions(text: string): string {
  const regex = /(\s|^)(\w+)\((.*?)\)/;
  while (text.match(regex)) {
    text = text.replace(regex, 'Math.$2($3)');
  }
  return text;
}

function parseConversions(text: string): string {
  if (text.includes(' in ') || text.includes(' to ')) {
    text = normaliseConversions(text);

    const regex = /(\d+\.?\d*)\s*([^\s]+)\s+(in|to)\s+([^(\s|$)]+)/i;
    const match = text.match(regex);
    if (match) {
      const [_, value, from, __, to] = match;
      try {
        const converted = convert(value).from(from).to(to);
        text = text.replace(regex, converted);
      } catch (e) {
        // heh
        // console.error(e);
      }
    }

  }
  return text;
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
