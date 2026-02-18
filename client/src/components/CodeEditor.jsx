import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';

export default function CodeEditor({ value, onChange, readOnly = false }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChangeRef.current?.(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value || '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        python(),
        syntaxHighlighting(defaultHighlightStyle),
        oneDark,
        keymap.of([...defaultKeymap, indentWithTab]),
        updateListener,
        EditorView.lineWrapping,
        EditorState.tabSize.of(4),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []); // 마운트 시 한 번만

  // 외부에서 value가 바뀌었을 때 (reset 등)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value || '' },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
    />
  );
}
