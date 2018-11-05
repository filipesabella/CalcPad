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
export function textToResults(
  text: string,
  decimalPlaces: number = 2): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => [line, parse(line)])
    .reduce<[string[], string]>(
      ([results, assignments], [line, parsedLine]) => {
        if (line.trim() === '' || isComment(line)) {
          return [results.concat(''), assignments];
        }

        try {
          const result = eval(assignments + parsedLine);

          const numberToDisplay = Math.round(result) !== result
            ? result.toFixed(decimalPlaces)
            : result;

          return [
            results.concat(numberToDisplay),
            assignments + (isAssignment(line) ? parsedLine + '\n' : '')];
        } catch (e) {
          // console.error(parsedLine);
          // console.error(e);
          // hehe :v
          return [results.concat('-'), assignments];
        }
      }, [[], ''])[0];
}
