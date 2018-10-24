const funs = ['sqrt', 'round', 'ceil', 'floor', 'sin', 'cos', 'tan'];
export const keywords = ['PI', 'E'].concat(funs);

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
    text = parseMultipliers(text);
    text = parsePercentages(text);
    text = parseContants(text);
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
  while (text.match(/(\d+)% of (\d+)/)) {
    text = text.replace(/(\d+)% of (\d+)/, '$2 * $1 / 100');
  }

  while (text.match(/(\d+)% on (\d+)/)) {
    text = text.replace(/(\d+)% on (\d+)/, '$2 * $1 / 100 + $2');
  }

  while (text.match(/(\d+)% off (\d+)/)) {
    text = text.replace(/(\d+)% off (\d+)/, '$2 - $2 * $1 / 100');
  }

  return text;
}

function parseContants(text: string): string {
  while (text.match(/(\s|^)PI(\s|$)/i)) {
    text = text.replace(/(\s|^)PI(\s|$)/i, '3.1415926536');
  }

  while (text.match(/(\s|^)E(\s|$)/)) {
    text = text.replace(/(\s|^)E(\s|$)/, '2.7182818285');
  }

  return text;
}

function parseFunctions(text: string): string {
  for (let i = 0; i < funs.length; i++) {
    const fun = funs[i];
    const regexp = new RegExp(fun + '\\s+([^(\\s|$)]+)');
    while (text.match(regexp)) {
      text = text.replace(regexp, 'Math.' + fun + '($1)');
    }
  }

  return text;
}

export function isAssignment(text: string): boolean {
  return text.includes('=');
}

export function isComment(text: string): boolean {
  return text.trim().startsWith('#');
}
