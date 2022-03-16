import { CompletionContext } from '@codemirror/autocomplete';

const allMathFunctions = Object
  .getOwnPropertyNames(Math)
  .map(n => ({ label: n, type: 'function' }));

export function completions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  } else {
    const vars = Array.from(
      context.state.doc.toString().matchAll(/(^|\n)(\w*)\s+=.*/g),
      (m: string[]) => m[2]
    ).map(v => ({ label: v, type: 'variable' }));

    return {
      from: word.from,
      options: allMathFunctions.concat(vars),
    };
  }
}
