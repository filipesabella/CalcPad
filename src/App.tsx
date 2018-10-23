import * as React from 'react';

import './styles/app.less';

const funs = ['sqrt', 'round', 'ceil', 'floor', 'sin', 'cos', 'tan'];
const keywords = ['PI', 'E'].concat(funs);


interface State {
  results: string[];
  value: string;
  currentLine: number;
}

export class App extends React.Component<{}, State> {
  textRef: React.RefObject<HTMLDivElement> = React.createRef();
  textAreaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

  constructor(props: {}) {
    super(props);

    this.state = {
      results: [],
      value: '',
      currentLine: 0,
    };

    let value = `1 + 2
20 * 33
a = 20
a * 2
asd
# comment test
a * a
2 ^ 3 ^ 2
b = sqrt 9 + 2k
20% of 10K
20% on 10M
20% off 10 billion
2 * PI
E / 2`;
    this.state = {
      value,
      results: textToResults(value),
      currentLine: 0,
    };
  }

  public render(): React.ReactNode {
    this.resizeTextArea();

    const { value, results, currentLine } = this.state;

    const linesToRender = value.split('\n').map(textToNode);

    return <div className="app">
      <div className="texts" ref={this.textRef}>
        {linesToRender.map((line, i) =>
          <div key={i}
            className={'line ' + (currentLine === i ? 'current' : '')}>
            <div className="text">{line}</div>
            <div className="result">{results[i]}</div>
          </div>)}
      </div>
      <textarea
        id="textarea"
        autoFocus={true}
        onChange={e => this.onChange(e)}
        onClick={_ => this.cursorChanged()}
        onKeyUp={_ => this.cursorChanged()}
        value={value}
        ref={this.textAreaRef}></textarea>
    </div>;
  }

  public componentDidMount(): void {
    this.resizeTextArea();
  }

  private resizeTextArea(): void {
    if (this.textAreaRef.current) {
      this.textAreaRef.current.style.height =
        this.textRef.current!.clientHeight + 'px';
    }
  }

  private onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;
    this.setState({
      value,
      results: textToResults(value)
    });
  }

  private cursorChanged(): void {
    if (this.textAreaRef.current) {
      this.setState({
        currentLine: this.textAreaRef.current.value
          .substr(0, this.textAreaRef.current.selectionStart)
          .split('\n').length - 1
      });
    }
  }
}

/**
 * Receives
 * 1 + 2
 * a = 20
 * a * 2
 *
 * and returns
 * [3, 20, 40]
 */
function textToResults(text: string): string[] {
  const lines = text.split('\n');

  let assignments = '';
  return lines.map((line, i) => {
    try {
      if (line === '' || isComment(line)) {
        return '';
      } else {
        const transformedLine = parse(line);
        const result = eval(assignments + transformedLine);

        if (isAssignment(line)) {
          assignments += transformedLine + '\n';
        }

        const numberToDisplay = Math.round(result) !== result
          ? result.toFixed(2)
          : result;

        return numberToDisplay;
      }
    } catch (e) {
      // console.error(e);
      // hehe :v
      return '-';
    }
  });
}

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
function textToNode(text: string, index: number):
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

/**
 * Parses input text into a string that can be `eval`d.
 */
function parse(text: string): string {
  text = text.replace(/\^/g, '**');
  if (isAssignment(text)) {
    // trick so that `eval` returns the value of the assignment.
    // receives `a = 1` and returns
    // `var a
    //  a = 1`
    const variable = text.substring(0, text.indexOf('=')).trim();
    const expression = text.substring(text.indexOf('=') + 1).trim();
    return 'var ' + variable + '\n' + variable + ' = ' + parse(expression);
  } else if (isComment(text)) {
    return '// ' + text;
  } else {
    text = parseMultipliers(text);
    text = parsePercentages(text);
    text = parseContants(text);
    text = parseFunctions(text);
    return text;
  }
}

function parseMultipliers(text: string): string {
  while (text.match(/(\d+\.?\d*)k/i)) {
    text = text.replace(/(\d+\.?\d*)k/i, '$1 * 1e3');
  }

  while (text.match(/(\d+\.?\d*)M/)) {
    text = text.replace(/(\d+\.?\d*)M/, '$1 * 1e6');
  }

  while (text.match(/(\d+\.?\d*)\s?billion/)) {
    text = text.replace(/(\d+\.?\d*)\s?billion/, '$1 * 1e9');
  }

  return text;
}

function parsePercentages(text: string): string {
  while (text.match(/(\d+)% of (\d+)/)) {
    text = text.replace(/(\d+)% of (\d+)/, '$2 * $1 / 100');
  }

  while (text.match(/(\d+)% on (\d+)/)) {
    text = text.replace(/(\d+)% on (\d+)/, '$2 * $1 / 100 + $2');
  }

  while (text.match(/(\d+)% off (\d+)/)) {
    text = text.replace(/(\d+)% off (\d+)/, '$2 - $2 * $1 / 100');
  }

  return text;
}

function parseContants(text: string): string {
  while (text.match(/(\s|^)PI(\s|$)/i)) {
    text = text.replace(/(\s|^)PI(\s|$)/i, '3.1415926536');
  }

  while (text.match(/(\s|^)E(\s|$)/)) {
    text = text.replace(/(\s|^)E(\s|$)/, '2.7182818285');
  }

  return text;
}

function parseFunctions(text: string): string {
  for (let i = 0; i < funs.length; i++) {
    const fun = funs[i];
    const regexp = new RegExp(fun + '\\s+([^(\\s|$)]+)');
    while (text.match(regexp)) {
      text = text.replace(regexp, 'Math.' + fun + '($1)');
    }
  }

  return text;
}

function isAssignment(text: string): boolean {
  return text.includes('=');
}

function isComment(text: string): boolean {
  return text.trim().startsWith('#');
}

function countSpaces(s: string): number {
  return s.length - s.trimLeft().length;
}
