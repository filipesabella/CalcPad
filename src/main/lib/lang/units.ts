import convert from 'convert-units';

// commonly used names that `convert-units` does not know about,
// or that are ambiguous in it
const aliases: { readonly [name: string]: string } = {
  tbs: 'Tbs',
  tbsp: 'Tbs',
  pint: 'pnt',
  pints: 'pnt',
  kb: 'KB',
  mb: 'MB',
  gb: 'GB',
  tb: 'TB',
  celsius: 'C',
  farenheit: 'F',
  fahrenheit: 'F',
  kelvin: 'K',
  rankine: 'R',
  sec: 's',
  secs: 's',
  mins: 'min',
  hr: 'h',
  hrs: 'h',
  metre: 'm',
  metres: 'm',
  kilometre: 'km',
  kilometres: 'km',
  centimetre: 'cm',
  centimetres: 'cm',
  millimetre: 'mm',
  millimetres: 'mm',
  liter: 'l',
  liters: 'l',
  milliliter: 'ml',
  milliliters: 'ml',
};

const abbreviations: readonly string[] = convert().possibilities();

const lowercase = (s: string) => s.toLowerCase();

// reversed so that the first unit wins,
// `convert-units` describes `cm2` as "centimeter" as well
const byName: ReadonlyMap<string, string> = new Map(
  abbreviations
    .reduce<[string, string][]>((pairs, abbr) => {
      const { singular, plural } = convert().describe(abbr as convert.Unit);
      return pairs.concat([singular, plural]
        .map(name => [lowercase(name), abbr] as [string, string]));
    }, [])
    .reverse(),
);

// `KM` -> `km`, but only when there's no ambiguity like `mb` -> `Mb`/`MB`
const byLowercaseAbbreviation: ReadonlyMap<string, string> = new Map(
  abbreviations
    .filter(abbr =>
      abbreviations
        .filter(other => lowercase(other) === lowercase(abbr)).length === 1
    )
    .map(abbr => [lowercase(abbr), abbr] as [string, string]),
);

/**
 * Returns the `convert-units` abbreviation for the given unit name,
 * or `undefined` when it's not a known unit.
 */
export function resolveUnit(name: string): string | undefined {
  const key = lowercase(name);
  return abbreviations.indexOf(name) !== -1
    ? name
    : aliases.hasOwnProperty(key)
    ? aliases[key]
    : byName.get(key) || byLowercaseAbbreviation.get(key);
}

export function convertUnits(value: number, from: string, to: string): number {
  return convert(value).from(from as convert.Unit).to(to as convert.Unit);
}
