// copied from from https://github.com/tbjgolden/react-codemirror6/blob/main/src/CodeMirrorLite/index.tsx
// some changes to handle history not triggering the expected events
import { EditorState, Extension, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import * as React from 'react';
import { useEffect, useRef } from 'react';

export const CodeMirror = ({
  value: valueProp,
  onChange: onChangeProp,
  extensions = [],
  ...props
}: Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'value' | 'onChange' | 'extensions'
> & {
  value: string
  onChange?: (value: string) => void
  extensions?: Extension
}): JSX.Element => {
  // This ref is needed to allow changes to prevent binding the
  // initial value to the EditorView init effect, to allow
  // the new value to be the starting value when reinitialized
  const valueRef = useRef(valueProp);
  valueRef.current = valueProp;

  // This ref is needed to allow changes to the onChange prop
  // without reinitializing the EditorView
  const onChangeRef = useRef(onChangeProp);
  onChangeRef.current = onChangeProp;

  // This ref is to ensure the extensions object is not changed
  // - changing the extensions requires the user to fully unmount
  // this whole component and mount it again with updated values.
  // Handling extension changes is out of scope for this wrapper!
  const extensionsRef = useRef<Extension>(extensions);

  // This ref tracks the parent HTML el
  const editorParentElRef = useRef<HTMLDivElement | null>(null);

  // This ref contains the CodeMirror EditorView instance
  const editorRef = useRef<null | {
    view: EditorView
  }>(null);

  // This ref is used to store pending changes, which enables
  // controlled input behavior.
  const changeHandlerRef = useRef<null | ((newValue: string) => boolean)>(null);

  useEffect(() => {
    if (editorParentElRef.current !== null) {
      let view: EditorView | undefined = undefined;
      const state: EditorState = EditorState.create({
        doc: valueRef.current,
        extensions: [
          EditorView.theme({
            '&': { alignSelf: 'stretch', flex: '1 0 auto' }
          }),
          extensionsRef.current,
          EditorState.transactionExtender.of((tr: Transaction) => {
            const editorView = view;
            if (editorView !== undefined) {
              const prevDoc = editorView.state.doc.toString();
              const nextDoc = tr.newDoc.toString();
              if (prevDoc === nextDoc) {
                return tr;
              } else {
                changeHandlerRef.current = (newValue: string) => {
                  changeHandlerRef.current = null;
                  return newValue === nextDoc;
                };
                onChangeRef.current?.(nextDoc);
                return null;
              }
            } else {
              return null;
            }
          })
        ]
      });
      view = new EditorView({
        state,
        parent: editorParentElRef.current
      });
      editorRef.current = {
        view
      };
    }

    return () => {
      if (editorRef.current !== null) {
        editorRef.current.view.destroy();
        editorRef.current = null;
      }
    };
  }, [editorParentElRef]);

  useEffect(() => {
    const changeHandler = changeHandlerRef.current;
    const handledChange = changeHandler?.(valueProp);
    if (handledChange !== true && editorRef.current !== null) {
      editorRef.current.view.dispatch(
        editorRef.current.view.state.update({
          changes: {
            from: 0,
            to: editorRef.current.view.state.doc.toString().length,
            insert: valueProp
          },
          filter: false
        })
      );
    }
  }, [valueProp]);

  return <div {...props} ref={editorParentElRef} />;
};
