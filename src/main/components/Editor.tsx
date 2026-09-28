import {
  acceptCompletion,
  autocompletion,
  completionKeymap
} from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/basic-setup';
import { defaultKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';
import {
  history, historyField, historyKeymap, redo
} from '@codemirror/history';
import { Diagnostic, linter } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { StreamLanguage } from '@codemirror/stream-parser';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap
} from '@codemirror/view';
import * as React from 'react';
import { useRef } from 'react';
import { calcpadlang } from '../codemirror/calpadlang';
import { completions } from '../codemirror/Completions';
import { dark } from '../codemirror/DarkTheme';
import { light } from '../codemirror/LightTheme';
import { rightGutter } from '../codemirror/ResultsGutter';
import { textToResults } from '../lib/evaluator';
import { evaluate } from '../lib/lang/evaluate';
import '../styles/Editor.less';
import { CodeMirror } from './CodeMirror';
import { Preferences } from './PreferencesDialog';

interface Props {
  value: string;
  onUpdate: (value: string) => void;
  preferences: Preferences;
  externalFunctions: string;
}

export const Editor = ({
  value,
  onUpdate,
  preferences,
  externalFunctions, }: Props) => {
  const results = textToResults(value, externalFunctions, preferences);
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const externalFunctionsRef = useRef(externalFunctions);
  externalFunctionsRef.current = externalFunctions;

  const onChange = (value: string) => {
    resultsRef.current = textToResults(value, externalFunctions, preferences);
    onUpdate(value);
  };

  return <CodeMirror
    className="editor"
    value={value}
    onChange={onChange}
    extensions={[
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      StreamLanguage.define(calcpadlang),
      rightGutter(lineNumber => resultsRef.current[lineNumber - 1]),
      linter(view => diagnostics(view, externalFunctionsRef.current)),
      autocompletion({ override: [completions] }),
      preferences.theme === 'dark' ? dark : light,
      history(),
      historyField,
      keymap.of([
        ...defaultKeymap,
        ...searchKeymap,
        ...commentKeymap,
        ...completionKeymap,
        { key: 'Tab', run: acceptCompletion },
        ...historyKeymap,
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
      ]),
    ]} />;
};


function diagnostics(view: EditorView, externalFunctions: string): Diagnostic[] {
  const doc = view.state.doc;
  return evaluate(doc.toString(), externalFunctions)
    .reduce<Diagnostic[]>((all, result, i) => {
      if (result.kind !== 'error') {
        return all;
      }
      const line = doc.line(i + 1);
      return all.concat({
        from: line.from + result.span.from,
        to: Math.min(line.from + result.span.to, line.to),
        severity: 'error',
        message: result.message,
      });
    }, []);
}
