const DEFAULT_PAGE_SIZE = 100;

export interface JsqlPaging {
  limit: number;
  offset: number;
  baseOffset: number;
}

function parseNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`JSQL ${fieldName} must be a non-negative integer.`);
  }
  if (value < 0) {
    throw new Error(`JSQL ${fieldName} must be a non-negative integer.`);
  }
  return value;
}

function readOptionalInteger(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return parseNonNegativeInteger(value, fieldName);
}

export function withPaging(
  jsql: Record<string, unknown>,
  pageSize: number,
  pageOffset: number
): { jsql: Record<string, unknown>; paging: JsqlPaging } {
  const normalizedPageSize = parseNonNegativeInteger(pageSize, 'limit');
  const normalizedPageOffset = parseNonNegativeInteger(pageOffset, 'offset');

  const jsqlLimit = readOptionalInteger(jsql.limit, 'limit');
  const jsqlOffset = readOptionalInteger(jsql.offset, 'offset');

  const limit = jsqlLimit ?? normalizedPageSize;
  const baseOffset = jsqlOffset ?? 0;
  const offset = baseOffset + normalizedPageOffset;

  return {
    jsql: {
      ...jsql,
      limit,
      offset,
    },
    paging: {
      limit,
      offset,
      baseOffset,
    },
  };
}

export function getDefaultPageSize(): number {
  return DEFAULT_PAGE_SIZE;
}
