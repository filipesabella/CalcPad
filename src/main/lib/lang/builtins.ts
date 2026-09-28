export const mathFunctions: readonly string[] = [
  'abs',
  'acos',
  'asin',
  'atan',
  'atan2',
  'ceil',
  'cos',
  'exp',
  'floor',
  'log',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sin',
  'sqrt',
  'tan',
];

export const constants: readonly string[] = ['PI', 'E'];

export const keywords: readonly string[] = [
  'in',
  'to',
  'of',
  'on',
  'off',
  'mod',
  'billion',
];

export const multipliers: { readonly [suffix: string]: number } = {
  k: 1e3,
  K: 1e3,
  M: 1e6,
};

export const isMathFunction = (name: string) =>
  mathFunctions.indexOf(name) !== -1;

export const isConstant = (name: string) => constants.indexOf(name) !== -1;
