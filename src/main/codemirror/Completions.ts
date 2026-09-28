import { CompletionContext } from '@codemirror/autocomplete';
import { constants, mathFunctions } from '../lib/lang/builtins';

const builtins = mathFunctions
  .map(n => ({ label: n, type: 'function' }))
  .concat(constants.map(n => ({ label: n, type: 'constant' })));

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
      options: builtins.concat(vars),
    };
  }
}
