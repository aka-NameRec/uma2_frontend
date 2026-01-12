import { umaClient } from './client';
import type {
  SelectRequest,
  SelectResponse,
  SQL2JSQLRequest,
  SQL2JSQLResponse,
  JSQL2SQLRequest,
  JSQL2SQLResponse,
  EntityListRequest,
  EntityListResponse,
  EntityDetailsRequest,
  EntityDetailsResponse,
} from './types';

export const umaApi = {
  select: (request: SelectRequest) => 
    umaClient.post<SelectRequest, SelectResponse>('/api/uma/select', request),
  
  sqlToJsql: (request: SQL2JSQLRequest) => 
    umaClient.post<SQL2JSQLRequest, SQL2JSQLResponse>('/api/uma/transform/sql2jsql', request),
  
  jsqlToSql: (request: JSQL2SQLRequest) => 
    umaClient.post<JSQL2SQLRequest, JSQL2SQLResponse>('/api/uma/transform/jsql2sql', request),
  
  getEntityList: (request: EntityListRequest) => 
    umaClient.post<EntityListRequest, EntityListResponse>('/api/uma/meta/entity_list', request),
  
  getEntityDetails: (request: EntityDetailsRequest) => 
    umaClient.post<EntityDetailsRequest, EntityDetailsResponse>('/api/uma/meta/entity_details', request),
};
