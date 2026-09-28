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
