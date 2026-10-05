export type Lit = string | number | boolean | undefined | null | void | object;
export const tuple = <T extends Lit[]>(...args: T) => args;
