import { Preferences } from '../components/PreferencesDialog';
import { evaluate, LineResult } from './lang/evaluate';

/**
 * Receives
 * 1 + 2
 * a = 20
 * a * 2
 *
 * and returns
 * ['3', '20', '40']
 *
 * Lines that are empty, comments or errors return an empty string.
 */
export function textToResults(
  text: string,
  externalFunctions: string,
  preferences: Preferences): string[] {
  return evaluate(text, externalFunctions)
    .map(result => formatResult(result, preferences));
}

function formatResult(
  result: LineResult,
  { decimalPlaces,
    decimalSeparator,
    thousandsSeparator }: Preferences): string {
  if (result.kind !== 'value') {
    return '';
  }

  const magnitude = Math.abs(result.value);
  const roundsToZero = magnitude !== 0
    && magnitude < 0.5 * Math.pow(10, -decimalPlaces);
  if (roundsToZero || (magnitude >= 1e21 && magnitude !== Infinity)) {
    // 6.62e-34, 1.5e+21
    return result.value
      .toExponential(decimalPlaces)
      .replace(/\.?0+e/, 'e')
      .replace('.', decimalSeparator);
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: decimalPlaces,
  })
    .formatToParts(result.value)
    .map(part =>
      part.type === 'group' ? thousandsSeparator
        : part.type === 'decimal' ? decimalSeparator
          : part.value)
    .join('');
}
