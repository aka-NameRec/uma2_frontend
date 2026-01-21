import { umaClient } from '../../../shared/api/uma/client';
import type { SQL2JSQLRequest, SQL2JSQLResponse, JSQL2SQLRequest, JSQL2SQLResponse } from '../../../shared/api/uma/types';

export class QueryConverter {
  async sqlToJsql(sql: string, dialect?: string): Promise<SQL2JSQLResponse> {
    const normalizedDialect = dialect === 'postgresql' ? 'postgres' : dialect;
    const request: SQL2JSQLRequest = {
      data: sql,
      dialect: normalizedDialect,
    };
    
    return await umaClient.post<SQL2JSQLResponse>('/uma/transform/sql2jsql', request);
  }
  
  async jsqlToSql(jsql: Record<string, unknown>, dialect?: string): Promise<JSQL2SQLResponse> {
    const normalizedDialect = dialect === 'postgresql' ? 'postgres' : dialect;
    const request: JSQL2SQLRequest = {
      data: jsql,
      dialect: normalizedDialect,
    };
    
    return await umaClient.post<JSQL2SQLResponse>('/uma/transform/jsql2sql', request);
  }
}

export const queryConverter = new QueryConverter();
