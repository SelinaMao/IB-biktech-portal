/**
 * Spring `Page<T>` envelope — already unwrapped from the core `{ success, data }`
 * response by `transformResponse`. Shared by every paginated admin list. Only
 * the fields the UI needs are typed.
 */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** Zero-based current page index. */
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

/** Common query args for a paginated, searchable list. */
export type PageArgs = {
  page?: number;
  size?: number;
  search?: string;
};
