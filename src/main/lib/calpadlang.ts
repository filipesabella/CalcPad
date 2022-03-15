// adapted from https://github.com/codemirror/legacy-modes/blob/main/mode/lua.js

function wordRE(words: string[]) {
  return new RegExp('^(?:' + words.join('|') + ')$', 'i');
}

const builtins = wordRE(Object.getOwnPropertyNames(Math));

const keywords = wordRE(['in','to']);

function normal(stream: any, state: any) {
  const ch = stream.next();
  if (ch === '#') {
    stream.skipToEnd();
    return 'comment';
  }
  if (ch === '"' || ch === '\'')
    return (state.cur = string(ch))(stream, state);
  if (/\d/.test(ch)) {
    stream.eatWhile(/[\w._%]/);
    return 'number';
  }
  if (/[\w_]/.test(ch)) {
    stream.eatWhile(/[\w\\\-_.]/);
    return 'variable';
  }
  return null;
}

function string(quote: any) {
  return function(stream: any, state: any) {
    let escaped = false, ch;
    while ((ch = stream.next()) !== null) {
      if (ch === quote && !escaped) break;
      escaped = !escaped && ch === '\\';
    }
    if (!escaped) state.cur = normal;
    return 'string';
  };
}

export const calcpadlang = {
  startState: () => ({ basecol: 0, indentDepth: 0, cur: normal }),
  token: (stream: any, state: any) => {
    if (stream.eatSpace()) return null;
    const word = stream.current();
    let style = state.cur(stream, state);
    if (style == 'variable') {
      if (keywords.test(word)) style = 'keyword';
      else if (builtins.test(word)) style = 'builtin';
    }
    return style;
  },
  languageData: {
    commentTokens: { line: '#' }
  }
};
