/**
 * Generic lookup entry returned by the shared `meta` endpoint. Each dropdown
 * category (e.g. "province", "gender") is a list of these, keyed by category
 * name in `MetaResponse`.
 */
export type MetaOption = {
  code: string;
  name: string;
};

/**
 * Raw account row returned under meta's `account` category — richer than
 * the generic `{code, name}` shape every other category uses, e.g.:
 * `{ accountNumber, accountName, accountClass, accountClassDescription, ccy, status }`.
 */
export interface MetaAccountEntry {
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountClassDescription: string;
  ccy: string;
  status: string;
}

/**
 * GET bank/meta — every dropdown category in one payload, keyed by category
 * name. One call returns everything (confirmed 2026-09-14); there is no
 * per-category request. `account` is the one category with a richer shape
 * (`MetaAccountEntry[]`) — every other key is `MetaOption[]`.
 */
export interface MetaResponse extends Record<string, MetaOption[] | MetaAccountEntry[]> {
  accounts: MetaAccountEntry[];
}

/** One selectable currency in the exchange-rates widget. */
export interface ExchangeRateCurrency {
  currency: string;
  description: string;
  icon: string;
}

/** Buy/sell/mid rate for a single currency pair, e.g. `"USD/KHR"`. */
export interface ExchangeRatePair {
  pair: string;
  buyRate: number;
  sellRate: number;
  midRate: number;
}

/** GET bank/meta/exchange-rates. */
export interface ExchangeRatesResponse {
  lastUpdate: string;
  currencies: ExchangeRateCurrency[];
  rate: ExchangeRatePair;
}
