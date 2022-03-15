import { HighlightStyle, tags } from '@codemirror/highlight';
import { EditorView } from '@codemirror/view';

const colors = {
  light: 'hsl(0, 0%, 70%)',
  medium: 'hsl(0, 0%, 20%)',
  dark: 'hsl(0, 80%, 40%)',
  background: 'hsl(0, 0%, 98%)',
  darkBackground: 'hsl(0, 0%, 95%)',
  highlightBackground: 'hsl(0, 0%, 100%)',
  selection: 'hsl(0, 0%, 90)',
  cursor: '#528bff',
};

const lightTheme = EditorView.theme({
  '&': {
    color: 'hsl(0, 0%, 50%)',
    backgroundColor: colors.background
  },
  '.cm-content': {
    caretColor: colors.cursor
  },
  '&.cm-focused .cm-cursor': { borderLeftColor: colors.cursor },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: colors.selection
  },
  '.cm-searchMatch': {
    backgroundColor: colors.selection,
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#6199ff2f'
  },
  '.cm-selectionMatch': { backgroundColor: colors.selection },
  '.cm-activeLine, .cm-activeLineGutter, .cm-activeLineRightGutter': {
    backgroundColor: colors.highlightBackground
  },
  '.cm-tooltip': {
    border: 'none',
    backgroundColor: colors.darkBackground
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'inherit',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: colors.selection
    }
  },
  '.cm-right-gutters': {
    backgroundColor: colors.darkBackground,
    color: colors.medium,
  },
}, { dark: false });

const lightHighlightStyle = HighlightStyle.define([{
  tag: [
    tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName,
    tags.function(tags.variableName), tags.labelName, tags.color,
    tags.constant(tags.name), tags.standard(tags.name),
    tags.definition(tags.name), tags.separator, tags.typeName, tags.className,
    tags.changed, tags.annotation, tags.modifier, tags.self,
    tags.namespace, tags.operator, tags.operatorKeyword, tags.url, tags.escape,
    tags.regexp, tags.link, tags.atom, tags.bool,
    tags.special(tags.variableName)],
  color: colors.medium,
}, {
  tag: [tags.number, tags.string],
  color: colors.dark,
}, {
  tag: [tags.meta, tags.comment],
  color: colors.light,
}]);

const light = [lightTheme, lightHighlightStyle];

export { light, lightHighlightStyle, lightTheme, colors };

