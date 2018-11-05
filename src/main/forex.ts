export function requestForex(): Promise<Forex> {
  return fetch('https://api.exchangeratesapi.io/latest?base=EUR')
    .then(r => r.json())
    .then(b => ({
      ...(b as any).rates,
      EUR: 1,
    } as Forex));
}

export interface Forex {
  EUR: 1;
  BGN: number;
  CAD: number;
  BRL: number;
  HUF: number;
  DKK: number;
  JPY: number;
  ILS: number;
  TRY: number;
  RON: number;
  GBP: number;
  PHP: number;
  HRK: number;
  NOK: number;
  USD: number;
  MXN: number;
  AUD: number;
  IDR: number;
  KRW: number;
  HKD: number;
  ZAR: number;
  ISK: number;
  CZK: number;
  THB: number;
  MYR: number;
  NZD: number;
  PLN: number;
  SEK: number;
  RUB: number;
  CNY: number;
  SGD: number;
  CHF: number;
  INR: number;
}

export const DefaultForex: Forex = {
  EUR: 1,
  BGN: 1,
  CAD: 1,
  BRL: 1,
  HUF: 1,
  DKK: 1,
  JPY: 1,
  ILS: 1,
  TRY: 1,
  RON: 1,
  GBP: 1,
  PHP: 1,
  HRK: 1,
  NOK: 1,
  USD: 1,
  MXN: 1,
  AUD: 1,
  IDR: 1,
  KRW: 1,
  HKD: 1,
  ZAR: 1,
  ISK: 1,
  CZK: 1,
  THB: 1,
  MYR: 1,
  NZD: 1,
  PLN: 1,
  SEK: 1,
  RUB: 1,
  CNY: 1,
  SGD: 1,
  CHF: 1,
  INR: 1,
};
