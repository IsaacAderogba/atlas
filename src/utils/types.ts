export type Any = any;
export type Class<T = unknown> = new (...args: never[]) => T;

export type OptionalPick<T, K extends keyof T> = Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = Partial<T> &
  Required<OptionalPick<T, K>>;
