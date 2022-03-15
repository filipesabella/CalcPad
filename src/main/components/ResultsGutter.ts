// all copied and adapterd from
// https://github.com/codemirror/gutter/blob/c864e4a09219a10e8f3f503e68534a8f0c28bb20/src/index.ts#L441

import { RangeCursor, RangeSet, RangeValue } from '@codemirror/rangeset';
import { Extension, Facet, MapMode } from '@codemirror/state';
import { BlockInfo, BlockType, Direction, EditorView, PluginField, ViewPlugin, ViewUpdate } from '@codemirror/view';

abstract class RightGutterMarker extends RangeValue {
  compare(other: RightGutterMarker) {
    // tslint:disable-next-line: triple-equals
    return this == other || this.constructor == other.constructor && this.eq(other);
  }
  eq(other: RightGutterMarker): boolean { return false; }
  toDOM?(_view: EditorView): Node;
  elementClass!: string;
  destroy(dom: Node) {}
}

RightGutterMarker.prototype.elementClass = '';
RightGutterMarker.prototype.toDOM = undefined;
RightGutterMarker.prototype.mapMode = MapMode.TrackBefore;
RightGutterMarker.prototype.startSide = RightGutterMarker.prototype.endSide = -1;
RightGutterMarker.prototype.point = true;

export const gutterLineClass = Facet.define<RangeSet<RightGutterMarker>>();

type Handlers = {[event: string]: (view: EditorView, line: BlockInfo, event: Event) => boolean};

interface GutterConfig {
  /// Retrieve a set of markers to use in this gutter.
  markers?: (view: EditorView) => (RangeSet<RightGutterMarker> | readonly RangeSet<RightGutterMarker>[]);
  /// Can be used to optionally add a single marker to every line.
  lineMarker?: (view: EditorView, line: BlockInfo, otherMarkers: readonly RightGutterMarker[]) => RightGutterMarker | null;
  /// If line markers depend on additional state, and should be
  /// updated when that changes, pass a predicate here that checks
  /// whether a given view update might change the line markers.
  lineMarkerChange?: null | ((update: ViewUpdate) => boolean);
  /// Add a hidden spacer element that gives the gutter its base
  /// width.
  initialSpacer?: null | ((view: EditorView) => RightGutterMarker);
  /// Update the spacer element when the view is updated.
  updateSpacer?: null | ((spacer: RightGutterMarker, update: ViewUpdate) => RightGutterMarker);
  /// Supply event handlers for DOM events on this gutter.
  domEventHandlers?: Handlers;
}

const defaults = {
  class: '',
  elementStyle: '',
  markers: () => RangeSet.empty,
  lineMarker: () => null,
  lineMarkerChange: null,
  initialSpacer: null,
  updateSpacer: null,
  domEventHandlers: {}
};

const activeGutters = Facet.define<Required<GutterConfig>>();

function gutter(config: GutterConfig): Extension {
  return [
    gutters(),
    activeLineRightGutterHighlighter,
    activeGutters.of({ ...defaults, ...config })
  ];
}

const baseTheme = EditorView.baseTheme({
  '.cm-right-gutters': {
    display: 'flex',
    height: '100%',
    boxSizing: 'border-box',
    zIndex: 200,
  },

  '.cm-right-gutter': {
    display: 'flex !important', // Necessary -- prevents margin collapsing
    flexDirection: 'column',
    flexShrink: 0,
    boxSizing: 'border-box',
    minHeight: '100%',
    overflow: 'hidden',
  },

  '.cm-right-gutterElement': {
    boxSizing: 'border-box',
    padding: '0 10px',
  },
});

const unfixGutters = Facet.define<boolean, boolean>({
  combine: values => values.some(x => x)
});

function gutters(config?: {fixed?: boolean}): Extension {
  let result = [
    gutterView,
    baseTheme,
  ];
  if (config && config.fixed === false) result.push(unfixGutters.of(true));
  return result;
}

const gutterView = ViewPlugin.fromClass(class {
  gutters: SingleGutterView[];
  dom: HTMLElement;
  fixed: boolean;
  prevViewport: {from: number, to: number};

  constructor(readonly view: EditorView) {
    this.prevViewport = view.viewport;
    this.dom = document.createElement('div');
    this.dom.className = 'cm-right-gutters';
    this.dom.setAttribute('aria-hidden', 'true');
    this.dom.style.minHeight = this.view.contentHeight + 'px';
    this.gutters = view.state.facet(activeGutters).map(conf => new SingleGutterView(view, conf));
    for (let gutter of this.gutters) this.dom.appendChild(gutter.dom);
    this.fixed = !view.state.facet(unfixGutters);
    if (this.fixed) {
      // FIXME IE11 fallback, which doesn't support position: sticky,
      // by using position: relative + event handlers that realign the
      // gutter (or just force fixed=false on IE11?)
      this.dom.style.position = 'sticky';
    }
    this.syncGutters(false);

    // FS: this whole file exists for this line
    // original:
    // view.scrollDOM.insertBefore(this.dom, view.contentDOM);
    // my change:
    view.scrollDOM.insertBefore(this.dom, view.contentDOM.nextSibling);
  }

  update(update: ViewUpdate) {
    if (this.updateGutters(update)) {
      // Detach during sync when the viewport changed significantly
      // (such as during scrolling), since for large updates that is
      // faster.
      let vpA = this.prevViewport, vpB = update.view.viewport;
      let vpOverlap = Math.min(vpA.to, vpB.to) - Math.max(vpA.from, vpB.from);
      this.syncGutters(vpOverlap < (vpB.to - vpB.from) * 0.8);
    }
    if (update.geometryChanged) this.dom.style.minHeight = this.view.contentHeight + 'px';
    if (this.view.state.facet(unfixGutters) !== !this.fixed) {
      this.fixed = !this.fixed;
      this.dom.style.position = this.fixed ? 'sticky' : '';
    }
    this.prevViewport = update.view.viewport;
  }

  syncGutters(detach: boolean) {
    let after = this.dom.nextSibling;
    if (detach) this.dom.remove();
    let lineClasses = RangeSet.iter(this.view.state.facet(gutterLineClass), this.view.viewport.from);
    let classSet: RightGutterMarker[] = [];
    let contexts = this.gutters.map(gutter => new UpdateContext(gutter, this.view.viewport, -this.view.documentPadding.top));
    for (let line of this.view.viewportLineBlocks) {
      let text: BlockInfo | undefined;
      if (Array.isArray(line.type)) {
        for (let b of line.type) if (b.type === BlockType.Text) { text = b; break; }
      } else {
        text = line.type === BlockType.Text ? line : undefined;
      }
      if (!text) continue;

      if (classSet.length) classSet = [];
      advanceCursor(lineClasses, classSet, line.from);
      for (let cx of contexts) cx.line(this.view, text, classSet);
    }
    for (let cx of contexts) cx.finish();
    if (detach) this.view.scrollDOM.insertBefore(this.dom, after);
  }

  updateGutters(update: ViewUpdate) {
    let prev = update.startState.facet(activeGutters), cur = update.state.facet(activeGutters);
    let change = update.docChanged || update.heightChanged || update.viewportChanged ||
      !RangeSet.eq(update.startState.facet(gutterLineClass), update.state.facet(gutterLineClass),
                   update.view.viewport.from, update.view.viewport.to);
    // tslint:disable-next-line: triple-equals
    if (prev == cur) {
      for (let gutter of this.gutters) if (gutter.update(update)) change = true;
    } else {
      change = true;
      let gutters = [];
      for (let conf of cur) {
        let known = prev.indexOf(conf);
        if (known < 0) {
          gutters.push(new SingleGutterView(this.view, conf));
        } else {
          this.gutters[known].update(update);
          gutters.push(this.gutters[known]);
        }
      }
      for (let g of this.gutters) {
        g.dom.remove();
        if (gutters.indexOf(g) < 0) g.destroy();
      }
      for (let g of gutters) this.dom.appendChild(g.dom);
      this.gutters = gutters;
    }
    return change;
  }

  destroy() {
    for (let view of this.gutters) view.destroy();
    this.dom.remove();
  }
}, {
  provide: PluginField.scrollMargins.from(value => {
    if (value.gutters.length === 0 || !value.fixed) return null;
    return value.view.textDirection === Direction.LTR ? {left: value.dom.offsetWidth} : {right: value.dom.offsetWidth};
  })
});

function asArray<T>(val: T | readonly T[]) { return (Array.isArray(val) ? val : [val]) as readonly T[]; }

function advanceCursor(cursor: RangeCursor<RightGutterMarker>, collect: RightGutterMarker[], pos: number) {
  while (cursor.value && cursor.from <= pos) {
    if (cursor.from === pos) collect.push(cursor.value);
    cursor.next();
  }
}

class UpdateContext {
  cursor: RangeCursor<RightGutterMarker>;
  localMarkers: RightGutterMarker[] = [];
  i = 0;

  constructor(readonly gutter: SingleGutterView, viewport: {from: number, to: number}, public height: number) {
    this.cursor = RangeSet.iter(gutter.markers, viewport.from);
  }

  line(view: EditorView, line: BlockInfo, extraMarkers: readonly RightGutterMarker[]) {
    if (this.localMarkers.length) this.localMarkers = [];
    advanceCursor(this.cursor, this.localMarkers, line.from);
    let localMarkers = extraMarkers.length ? this.localMarkers.concat(extraMarkers) : this.localMarkers;
    let forLine = this.gutter.config.lineMarker(view, line, localMarkers);
    if (forLine) localMarkers.unshift(forLine);

    let gutter = this.gutter;

    let above = line.top - this.height;
    if (this.i === gutter.elements.length) {
      let newElt = new GutterElement(view, line.height, above, localMarkers);
      gutter.elements.push(newElt);
      gutter.dom.appendChild(newElt.dom);
    } else {
      gutter.elements[this.i].update(view, line.height, above, localMarkers);
    }
    this.height = line.bottom;
    this.i++;
  }

  finish() {
    let gutter = this.gutter;
    while (gutter.elements.length > this.i) {
      let last = gutter.elements.pop()!;
      gutter.dom.removeChild(last.dom);
      last.destroy();
    }
  }
}

class SingleGutterView {
  dom: HTMLElement;
  elements: GutterElement[] = [];
  markers: readonly RangeSet<RightGutterMarker>[];
  spacer: GutterElement | null = null;

  constructor(public view: EditorView, public config: Required<GutterConfig>) {
    this.dom = document.createElement('div');
    this.dom.className = 'cm-right-gutter';
    for (let prop in config.domEventHandlers) {
      this.dom.addEventListener(prop, (event: Event) => {
        let line = view.lineBlockAtHeight((event as MouseEvent).clientY - view.documentTop);
        if (config.domEventHandlers[prop](view, line, event)) event.preventDefault();
      });
    }
    this.markers = asArray(config.markers(view));
    if (config.initialSpacer) {
      this.spacer = new GutterElement(view, 0, 0, [config.initialSpacer(view)]);
      this.dom.appendChild(this.spacer.dom);
      this.spacer.dom.style.cssText += 'visibility: hidden; pointer-events: none';
    }
  }

  update(update: ViewUpdate) {
    let prevMarkers = this.markers;
    this.markers = asArray(this.config.markers(update.view));
    if (this.spacer && this.config.updateSpacer) {
      let updated = this.config.updateSpacer(this.spacer.markers[0], update);
      // tslint:disable-next-line: triple-equals
      if (updated != this.spacer.markers[0]) this.spacer.update(update.view, 0, 0, [updated]);
    }
    let vp = update.view.viewport;
    return !RangeSet.eq(this.markers, prevMarkers, vp.from, vp.to) ||
      (this.config.lineMarkerChange ? this.config.lineMarkerChange(update) : false);
  }

  destroy() {
    for (let elt of this.elements) elt.destroy();
  }
}

class GutterElement {
  dom: HTMLElement;
  height: number = -1;
  above: number = 0;
  markers: readonly RightGutterMarker[] = [];

  constructor(view: EditorView, height: number, above: number, markers: readonly RightGutterMarker[]) {
    this.dom = document.createElement('div');
    this.update(view, height, above, markers);
  }

  update(view: EditorView, height: number, above: number, markers: readonly RightGutterMarker[]) {
    if (this.height !== height) {
      this.dom.style.height = (this.height = height) + 'px';
      this.dom.style.lineHeight = (this.height = height) + 'px';
    }

    if (this.above !== above)
      this.dom.style.marginTop = (this.above = above) ? above + 'px' : '';
    if (!sameMarkers(this.markers, markers)) this.setMarkers(view, markers);
  }

  setMarkers(view: EditorView, markers: readonly RightGutterMarker[]) {
    let cls = 'cm-right-gutterElement', domPos = this.dom.firstChild;
    for (let iNew = 0, iOld = 0;;) {
      let skipTo = iOld, marker = iNew < markers.length ? markers[iNew++] : null, matched = false;
      if (marker) {
        let c = marker.elementClass;
        if (c) cls += ' ' + c;
        for (let i = iOld; i < this.markers.length; i++)
          if (this.markers[i].compare(marker)) { skipTo = i; matched = true; break; }
      } else {
        skipTo = this.markers.length;
      }
      while (iOld < skipTo) {
        let next = this.markers[iOld++];
        if (next.toDOM) {
          next.destroy(domPos!);
          let after = domPos!.nextSibling;
          domPos!.remove();
          domPos = after;
        }
      }
      if (!marker) break;
      if (marker.toDOM) {
        if (matched) domPos = domPos!.nextSibling;
        else this.dom.insertBefore(marker.toDOM(view), domPos);
      }
      if (matched) iOld++;
    }
    this.dom.className = cls;
    this.markers = markers;
  }

  destroy() {
    this.setMarkers(null as any, []); // First argument not used unless creating markers
  }
}

function sameMarkers(a: readonly RightGutterMarker[], b: readonly RightGutterMarker[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!a[i].compare(b[i])) return false;
  return true;
}

const activeLineRightGutterMarker = new class extends RightGutterMarker {
  elementClass = 'cm-activeLineRightGutter';
};

const activeLineRightGutterHighlighter = gutterLineClass.compute(['selection'], state => {
  let marks = [], last = -1;
  for (let range of state.selection.ranges) if (range.empty) {
    let linePos = state.doc.lineAt(range.head).from;
    if (linePos > last) {
      last = linePos;
      marks.push(activeLineRightGutterMarker.range(linePos));
    }
  }
  return RangeSet.of(marks);
});

export function rightGutter(results: (lineNumber: number) => string) {
  return gutter({
    lineMarker: (view, line) => {
      const lineNumber = view.state.doc.lineAt(line.from).number;
      return new class extends RightGutterMarker {
        toDOM() {
          return document.createTextNode(results(lineNumber));
        }
      };
    },
    lineMarkerChange: () => {
      return true;
    },
    domEventHandlers: {
      'click': (view: EditorView, line: BlockInfo, event: Event) => {
        // TODO select the whole result? maybe send to clipboard?
        // console.log('asd', line);
        return true;
      }
    },
  });
}
