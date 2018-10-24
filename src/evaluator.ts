import { isComment, parse, isAssignment } from './parser';

/**
 * Receives
 * 1 + 2
 * a = 20
 * a * 2
 *
 * and returns
 * [3, 20, 40]
 */
export function textToResults(text: string): string[] {
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
