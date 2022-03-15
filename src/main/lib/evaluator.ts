import { Preferences } from '../components/PreferencesDialog';
import { isAssignment, isComment, parse } from './parser';

const formatter = new Intl.NumberFormat();

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
  { decimalPlaces,
    decimalSeparator,
    thousandsSeparator }: Preferences): string[] {
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

          const formattedNumber = formatter
            .formatToParts(numberToDisplay)
            .map(part =>
              part.type === 'group' ? thousandsSeparator
                : part.type === 'decimal' ? decimalSeparator
                  : part.value)
            .join('');

          return [
            results.concat(formattedNumber),
            assignments + (isAssignment(line) ? parsedLine + '\n' : '')];
        } catch (e) {
          // many exceptions occur as the user is typing
          // console.error(parsedLine);
          // console.error(e);
          return [results.concat('-'), assignments];
        }
      }, [[], ''])[0];
}
