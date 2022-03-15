import { HighlightStyle, tags } from '@codemirror/highlight';
import { EditorView } from '@codemirror/view';

const colors = {
  light: 'hsl(95, 6.7%, 64.7%)',
  medium: 'hsl(180, 14.9%, 46.1%)',
  dark: 'hsl(90, 3.3%, 47.1%)',
  background: 'hsl(220, 13%, 18%)',
  darkBackground: 'hsl(216, 13.2%, 14.9%)',
  highlightBackground: 'hsl(218.6, 13.7%, 20%)',
  tooltipBackground: 'hsl(216.9, 10.9%, 23.3%)',
  selection: 'hsl(221.1, 13.3%, 28%)',
  cursor: 'hsl(220.2, 100%, 66.1%)',
};

const darkTheme = EditorView.theme({
  '&': {
    color: 'rgba(214, 221, 209)',
    backgroundColor: colors.background
  },
  '.cm-content': {
    caretColor: colors.cursor
  },
  '&.cm-focused .cm-cursor': { borderLeftColor: colors.cursor },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: colors.selection
  },
  '.cm-panels': { backgroundColor: colors.darkBackground },
  '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
  '.cm-panels.cm-panels-bottom': { borderTop: '2px solid black' },
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
    backgroundColor: colors.tooltipBackground
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'inherit',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: colors.highlightBackground,
    }
  },
  '.cm-right-gutters': {
    backgroundColor: 'rgb(41, 41, 46)',
    color: colors.light,
  },
}, { dark: true });


const darkHighlightStyle = HighlightStyle.define([{
  tag: [
    tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName,
    tags.function(tags.variableName), tags.labelName, tags.color,
    tags.constant(tags.name), tags.standard(tags.name),
    tags.definition(tags.name), tags.separator, tags.typeName, tags.className,
    tags.changed, tags.annotation, tags.modifier, tags.self,
    tags.namespace, tags.operator, tags.operatorKeyword, tags.url, tags.escape,
    tags.regexp, tags.link, tags.atom, tags.bool,
    tags.special(tags.variableName)],
  color: colors.light,
}, {
  tag: [tags.number, tags.string],
  color: colors.medium,
}, {
  tag: [tags.meta, tags.comment],
  color: colors.dark,
}]);

const dark = [darkTheme, darkHighlightStyle];

export { dark, darkHighlightStyle, darkTheme, colors };
