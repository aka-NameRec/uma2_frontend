import { umaClient } from '../../../shared/api/uma/client';
import type { SelectRequest, SelectResponse } from '../../../shared/api/uma/types';

export class QueryExecutor {
  async executeJsql(
    jsql: Record<string, unknown>,
    params?: Record<string, unknown> | unknown[] | null
  ): Promise<SelectResponse> {
    const request: SelectRequest = {
      jsql,
      params: params || null,
    };
    
    return await umaClient.post<SelectResponse>('/uma/select', request);
  }
}

export const queryExecutor = new QueryExecutor();
