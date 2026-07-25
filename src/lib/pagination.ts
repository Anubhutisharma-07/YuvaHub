export interface PaginationQuery {
  page?: unknown;
  limit?: unknown;
  cursor?: unknown;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const parseInteger = (value: unknown): number | null => {
  if (Array.isArray(value)) {
    return parseInteger(value[0]);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  if (!/^-?\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

/**
 * Parse untrusted HTTP pagination values into safe positive integers.
 *
 * - page defaults to 1
 * - limit defaults to 20
 * - limit is capped by maxLimit
 * - cursor is accepted as a backward-compatible page alias
 */
export function parsePagination(
  query: PaginationQuery | Record<string, unknown>,
  maxLimit = 100,
  defaultLimit = 20,
): ParsedPagination {
  const safeMaxLimit = Math.max(1, Math.trunc(maxLimit) || 100);
  const safeDefaultLimit = Math.min(
    safeMaxLimit,
    Math.max(1, Math.trunc(defaultLimit) || 20),
  );

  const cursor = parseInteger(query.cursor);
  const requestedPage = cursor && cursor > 0
    ? cursor
    : parseInteger(query.page);

  const requestedLimit = parseInteger(query.limit);

  const page = Math.max(1, requestedPage || 1);
  const limit = Math.min(
    safeMaxLimit,
    Math.max(1, requestedLimit || safeDefaultLimit),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMetadata(
  page: number,
  limit: number,
  total: number,
): PaginationMetadata {
  const safeTotal = Math.max(0, Math.trunc(total) || 0);
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNext: totalPages > 0 && page < totalPages,
    hasPrevious: page > 1 && totalPages > 0,
  };
}
