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
import { useEffect, useRef } from 'react';
import { textToResults } from '../evaluator';
import { calcpadlang } from '../lib/calpadlang';
import { Store } from '../store';
import '../styles/Editor.less';
import { completions } from './Completions';
import { dark } from './DarkTheme';
import { light } from './LightTheme';
import { Preferences } from './PreferencesDialog';
import { rightGutter } from './ResultsGutter';

interface Props {
  store: Store;
  value: string;
  preferences: Preferences;
}

export const Editor = ({
  store,
  value,
  preferences, }: Props) => {
  const editor = useRef<HTMLDivElement>(null);

  let results = textToResults(value, store.preferences());

  const onUpdate = EditorView.updateListener.of(viewUpdate => {
    const value = viewUpdate.state.doc.toString();
    results = textToResults(value, store.preferences());
    store.save(value);
  });

  useEffect(() => {
    const extensions = [
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      StreamLanguage.define(calcpadlang),
      rightGutter((lineNumber) => results[lineNumber - 1]),
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
      onUpdate,
    ];

    const startState = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editor.current!,
    });

    return () => view.destroy();
  }, [value, preferences]);

  return <div ref={editor}></div>;
};

