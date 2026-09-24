/** Shape returned by any list endpoint when it's asked to paginate (a `page` param is sent).
 * Mirrors the backend's `Paged<T>` in `src/common/pagination.util.ts`. */
export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
