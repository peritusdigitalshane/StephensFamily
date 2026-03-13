import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Parse pagination query params with sensible defaults */
export function parsePagination(req: NextRequest, defaultLimit = 100): PaginationParams {
  const url = new URL(req.url);
  const page = Math.min(10000, Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Build paginated response with metadata */
export function paginatedResponse<T>(items: T[], total: number, params: PaginationParams) {
  return {
    data: items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
