const convert = require('convert-units');

/**
 * Parses input text into a string that can be `eval`d.
 */
export function parse(text: string): string {
  // cheeky handling of pow
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
    // the order here is important
    return [
      parseConstants,
      parseMultipliers,
      parseConversions,
      parsePercentages,
      parseFunctions,
    ].reduce((text, fn) => fn(text), text);
  }
}

function parseMultipliers(text: string): string {
  const multipliers: [RegExp, number][] = [
    [/(\d+\.?\d*)k/i, 1e3],
    [/(\d+\.?\d*)M/i, 1e6],
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
    [/(\d+\.?\d*)%\s+of\s+([^\s]+|\(.*?\))/, '$2 * $1 / 100'],
    [/(\d+\.?\d*)%\s+on\s+([^\s]+|\(.*?\))/, '$2 * $1 / 100 + $2'],
    [/(\d+\.?\d*)%\s+off\s+([^\s]+|\(.*?\))/, '$2 - $2 * $1 / 100'],
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
