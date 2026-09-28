/**
 * Column range within a single line, `to` being exclusive.
 */
export interface Span {
  readonly from: number;
  readonly to: number;
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | 'mod'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | '&&'
  | '||';

export type UnaryOperator = '-' | '+' | '!';

export type PercentageOperator = 'of' | 'on' | 'off';

export type Expr =
  | { readonly kind: 'number', readonly value: number, readonly span: Span }
  | { readonly kind: 'identifier', readonly name: string, readonly span: Span }
  | {
    readonly kind: 'unary',
    readonly operator: UnaryOperator,
    readonly operand: Expr,
    readonly span: Span,
  }
  | {
    readonly kind: 'binary',
    readonly operator: BinaryOperator,
    readonly left: Expr,
    readonly right: Expr,
    readonly span: Span,
  }
  | {
    readonly kind: 'percentage',
    readonly operator: PercentageOperator,
    readonly percentage: Expr,
    readonly base: Expr,
    readonly span: Span,
  }
  | {
    readonly kind: 'conversion',
    readonly value: Expr,
    // unit abbreviations as understood by `convert-units`
    readonly from: string,
    readonly to: string,
    readonly span: Span,
  }
  | {
    readonly kind: 'conditional',
    readonly test: Expr,
    readonly consequent: Expr,
    readonly alternate: Expr,
    readonly span: Span,
  }
  | {
    readonly kind: 'call',
    readonly callee: string,
    readonly args: readonly Expr[],
    readonly span: Span,
  };

export type Line =
  | { readonly kind: 'empty' }
  | { readonly kind: 'expression', readonly expression: Expr }
  | {
    readonly kind: 'assignment',
    readonly name: string,
    readonly expression: Expr,
    readonly span: Span,
  }
  | { readonly kind: 'error', readonly message: string, readonly span: Span };

export type Program = readonly Line[];

/**
 * Thrown by the lexer and the parser. Plain objects instead of an `Error`
 * subclass so that `instanceof` isn't needed, as it misbehaves in
 * transpiled code.
 */
export interface LangError {
  readonly message: string;
  readonly span: Span;
}

export const isLangError = (e: any): e is LangError =>
  !!e && typeof e.message === 'string' && !!e.span;
