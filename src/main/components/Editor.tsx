import {
  acceptCompletion,
  autocompletion,
  completionKeymap
} from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/basic-setup';
import { defaultKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';
import { history, historyKeymap, redo } from '@codemirror/history';
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
import { textToResults } from '../evaluator';
import { calcpadlang } from '../lib/calpadlang';
import '../styles/Editor.less';
import { CodeMirror } from './CodeMirror';
import { completions } from './Completions';
import { dark } from './DarkTheme';
import { light } from './LightTheme';
import { Preferences } from './PreferencesDialog';
import { rightGutter } from './ResultsGutter';

interface Props {
  value: string;
  onUpdate: (value: string) => void;
  preferences: Preferences;
}

export const Editor = ({
  value,
  onUpdate,
  preferences, }: Props) => {
  const resultsRef = useRef(textToResults(value, preferences));
  resultsRef.current = textToResults(value, preferences);

  const onChange = (value: string) => {
    resultsRef.current = textToResults(value, preferences);
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
      rightGutter(lineNumber => {
        return resultsRef.current[lineNumber - 1];
      }),
      autocompletion({ override: [completions] }),
      preferences.theme === 'dark' ? dark : light,
      history(),
      keymap.of([
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
        ...commentKeymap,
        ...completionKeymap,
        { key: 'Tab', run: acceptCompletion }
      ]),
    ]} />;
};

