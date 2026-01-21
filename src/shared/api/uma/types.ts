export interface SelectRequest {
  jsql: Record<string, unknown>;
  params?: Record<string, unknown> | unknown[] | null;
}

export interface ColumnMeta {
  name: string;
  type: string;
  nullable: boolean;
  qualified_name: string;
}

export interface SelectResponse {
  meta: ColumnMeta[];
  data: Record<string, unknown>[];
}

export interface SQL2JSQLRequest {
  data: string;
  dialect?: string;
}

export interface SQL2JSQLResponse extends Record<string, unknown> {
  // JSQL object structure
}

export interface JSQL2SQLRequest {
  data: Record<string, unknown>;
  dialect?: string;
}

export interface JSQL2SQLResponse {
  sql: string;
}

export interface EntityListRequest {
  namespace?: string;
}

export interface EntityListResponse {
  entities: string[];
}

export interface EntityDetailsRequest {
  entity_name: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  // ... other fields
}

export interface EntityMetadata {
  name: string;
  columns: ColumnMetadata[];
  // ... other fields
}

export interface EntityDetailsResponse extends EntityMetadata {}
