export const PAGE_SIZE = 10;

export type Page<T> = { rows: T[]; page: number; pageCount: number; total: number; from: number; to: number };

// Lists page on the server from `?page=`, so a link to page 3 stays page 3.
export function paginate<T>(items: readonly T[], requested: string | string[] | undefined, size: number = PAGE_SIZE): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const parsed = Number(Array.isArray(requested) ? requested[0] : requested);
  const page = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), pageCount) : 1;
  const start = (page - 1) * size;
  const rows = items.slice(start, start + size);
  return { rows, page, pageCount, total: items.length, from: items.length === 0 ? 0 : start + 1, to: start + rows.length };
}
