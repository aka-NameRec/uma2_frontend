import { umaClient } from '../../../shared/api/uma/client';
import type { SQL2JSQLRequest, SQL2JSQLResponse, JSQL2SQLRequest, JSQL2SQLResponse } from '../../../shared/api/uma/types';

export class QueryConverter {
  async sqlToJsql(sql: string, dialect?: string): Promise<SQL2JSQLResponse> {
    const request: SQL2JSQLRequest = {
      data: sql,
      dialect,
    };
    
    return await umaClient.post<SQL2JSQLRequest, SQL2JSQLResponse>('/api/uma/transform/sql2jsql', request);
  }
  
  async jsqlToSql(jsql: Record<string, unknown>, dialect?: string): Promise<JSQL2SQLResponse> {
    const request: JSQL2SQLRequest = {
      data: jsql,
      dialect,
    };
    
    return await umaClient.post<JSQL2SQLRequest, JSQL2SQLResponse>('/api/uma/transform/jsql2sql', request);
  }
}

export const queryConverter = new QueryConverter();
