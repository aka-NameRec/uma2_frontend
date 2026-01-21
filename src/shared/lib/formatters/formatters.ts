import { format as formatSql, type FormatOptionsWithLanguage } from 'sql-formatter';
import stringifyPrettyCompact from 'json-stringify-pretty-compact';

const SQL_DIALECT_MAP: Record<string, FormatOptionsWithLanguage['language']> = {
  generic: 'sql',
  postgres: 'postgresql',
  mysql: 'mysql',
  sqlite: 'sqlite',
  mssql: 'tsql',
};

export function formatSqlText(sql: string, dialect?: string): string {
  try {
    const language = SQL_DIALECT_MAP[dialect ?? 'generic'] ?? 'sql';
    return formatSql(sql, {
      language,
      tabWidth: 4,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to format SQL: ${message}`);
  }
}

export function formatJsonText(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return stringifyPrettyCompact(parsed, { indent: 2, maxLength: 120 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to format JSON: ${message}`);
  }
}
