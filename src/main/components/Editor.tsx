import {
  acceptCompletion,
  autocompletion,
  completionKeymap
} from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/basic-setup';
import { defaultKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';
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
      autocompletion({ override: [completions] }),
      preferences.theme === 'dark' ? dark : light,
      keymap.of([
        ...defaultKeymap,
        ...searchKeymap,
        ...commentKeymap,
        ...completionKeymap,
        { key: 'Tab', run: acceptCompletion }
      ]),
    ]} />;
};

