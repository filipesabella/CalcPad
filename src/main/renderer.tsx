import * as React from 'react';
import { isAssignment, isComment, mathFunctions, } from './parser';

const keywords = [
  // constants
  'PI', 'E',
  // conversion keywords
  'in', 'to',
].concat(mathFunctions);

// receives
// a = sqrt 9 + 2
// returns
// <div key={index}>
//   <span className="variable">a</span>
//   <span> = </span>
//   <span>
//     <div key={index}>
//       <span className="keyword">sqrt </span>
//       <span>9 + 2</span>
//     </div>
//   </span>
// </div>
export function textToNode(text: string, index: number):
  React.ReactElement<HTMLDivElement> {
  if (isAssignment(text)) {
    const variable = text.substring(0, text.indexOf('=')).trim();
    // add any amount of spaces the user may have added around
    // the `=` sign
    const equals = text.substring(
      text.indexOf(' '),
      text.indexOf('=') + countSpaces(text.trim().split('=')[1]) + 1);
    const expression = text.substring(text.indexOf('=') + 1).trim();
    return <div key={index}>
      <span className="variable">{variable}</span>
      <span>{equals}</span>
      <span>{textToNode(expression, index)}</span>
    </div>;
  } else if (isComment(text)) {
    return <div key={index}><span className="comment">{text}</span></div>;
  } else {
    return <div key={index}>{keywordToNode(text)}</div>;
  }
}

function keywordToNode(text: string): React.ReactElement<HTMLElement>[] {
  const els: React.ReactElement<HTMLElement>[] = [];
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (keywords.indexOf(word) >= 0) {
      els.push(<span className="keyword" key={i}>{word + ' '}</span>);
    } else {
      els.push(<span key={i}>{word + ' '}</span>);
    }
  }
  return els;
}

function countSpaces(s: string): number {
  return s.length - s.trimLeft().length;
}
