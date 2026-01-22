import { ref } from 'vue';
import { useQueryState } from './use-query-state';
import { useSchemaExplorerIntegration } from './use-schema-explorer-state';
import { queryExecutor } from '../../../entities/query/model/query-executor';
import { queryConverter } from '../../../entities/query/model/query-converter';
import { formatJsonText, formatSqlText } from '../../../shared/lib/formatters/formatters';
import { useQueryResults } from '../../../features/query-results/lib/use-query-results';
import type { QueryState } from './use-query-state';

export function MainModel() {
  const queryState = useQueryState() as QueryState & ReturnType<typeof useQueryState>;
  const schemaIntegration = useSchemaExplorerIntegration();
  const queryResults = useQueryResults();
  const queryParams = ref<Record<string, unknown> | unknown[] | null>(null);
  
  async function handleRunSql() {
    const startTime = performance.now();
    
    try {
      queryState.setExecuting(true);
      
      // Convert SQL to JSQL
      const jsql = await queryConverter.sqlToJsql(queryState.sqlQuery.value, queryState.dialect.value);
      queryState.setJsqlText(formatJsonText(JSON.stringify(jsql)));
      
      // Execute JSQL
      const params = (jsql as { params?: Record<string, unknown> | unknown[] }).params ?? null;
      queryParams.value = params;
      queryResults.reset(jsql);
      const page = await queryResults.loadPage(
        (pagedJsql) => queryExecutor.executeJsql(pagedJsql, queryParams.value),
        0
      );
      if (!page) {
        throw new Error('Failed to load the first page of query results.');
      }
      queryState.setExecutionTime(Math.round(performance.now() - startTime));
    } catch (error) {
      console.error('Failed to execute SQL:', error);
      throw error;
    } finally {
      queryState.setExecuting(false);
    }
  }
  
  async function handleRunJsql() {
    const startTime = performance.now();
    
    try {
      queryState.setExecuting(true);
      const jsql = parseJsqlOrThrow();
      
      // Optionally get SQL for debug
      const { sql } = await queryConverter.jsqlToSql(jsql, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
      queryState.setSqlQuery(sql);
      
      // Execute JSQL
      const params = (jsql as { params?: Record<string, unknown> | unknown[] }).params ?? null;
      queryParams.value = params;
      queryResults.reset(jsql);
      const page = await queryResults.loadPage(
        (pagedJsql) => queryExecutor.executeJsql(pagedJsql, queryParams.value),
        0
      );
      if (!page) {
        throw new Error('Failed to load the first page of query results.');
      }
      queryState.setExecutionTime(Math.round(performance.now() - startTime));
    } catch (error) {
      console.error('Failed to execute JSQL:', error);
      throw error;
    } finally {
      queryState.setExecuting(false);
    }
  }
  
  async function handleConvertSqlToJsql() {
    try {
      queryState.setExecuting(true);
      const jsql = await queryConverter.sqlToJsql(queryState.sqlQuery.value, queryState.dialect.value);
      queryState.setJsqlText(formatJsonText(JSON.stringify(jsql)));
    } catch (error) {
      console.error('Failed to convert SQL to JSQL:', error);
      throw error;
    } finally {
      queryState.setExecuting(false);
    }
  }
  
  async function handleConvertJsqlToSql() {
    try {
      queryState.setExecuting(true);
      const jsql = parseJsqlOrThrow();
      const { sql } = await queryConverter.jsqlToSql(jsql, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
      queryState.setSqlQuery(sql);
    } catch (error) {
      console.error('Failed to convert JSQL to SQL:', error);
      throw error;
    } finally {
      queryState.setExecuting(false);
    }
  }
  
  function handleClearSql() {
    queryState.setSqlQuery('');
  }
  
  function handleClearJsql() {
    queryState.setJsqlText('');
  }

  function handleFormatSql() {
    if (!queryState.sqlQuery.value.trim()) {
      return;
    }

    try {
      queryState.setSqlQuery(formatSqlText(queryState.sqlQuery.value, queryState.dialect.value));
    } catch (error) {
      console.error('Failed to format SQL:', error);
      throw error;
    }
  }

  function handleFormatJsql() {
    if (!queryState.jsqlText.value.trim()) {
      return;
    }

    try {
      queryState.setJsqlText(formatJsonText(queryState.jsqlText.value));
    } catch (error) {
      console.error('Failed to format JSQL:', error);
      throw error;
    }
  }
  
  function handleCopySql() {
    navigator.clipboard.writeText(queryState.sqlQuery.value);
  }
  
  function handleCopyJsql() {
    navigator.clipboard.writeText(queryState.jsqlText.value);
  }
  
  function handleExportResults() {
    // TODO: Implement export functionality
    console.log('Export results:', queryResults.results.value);
  }
  
  function handleClearResults() {
    queryResults.clear();
    queryState.clearResults();
    queryParams.value = null;
  }
  
  function handleShowSql() {
    // TODO: Show SQL in dialog
    console.log('Generated SQL:', queryState.generatedSql.value);
  }

  async function loadResultsPage(pageOffset: number) {
    return await queryResults.loadPage(
      (pagedJsql) => queryExecutor.executeJsql(pagedJsql, queryParams.value),
      pageOffset
    );
  }

  function parseJsqlOrThrow(): Record<string, unknown> {
    if (!queryState.jsqlText.value.trim()) {
      throw new Error('JSQL query is empty.');
    }

    try {
      const parsed = JSON.parse(queryState.jsqlText.value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSQL must be a JSON object.');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSQL JSON: ${message}`);
    }
  }
  
  return {
    ...queryState,
    ...schemaIntegration,
    queryResults: queryResults.results,
    queryResultsMeta: queryResults.meta,
    queryResultsRows: queryResults.rows,
    queryResultsPageSize: queryResults.pageSize,
    queryResultsHasMore: queryResults.hasMore,
    queryResultsIsLoadingPage: queryResults.isLoadingPage,
    queryResultsRowCount: queryResults.loadedRowCount,
    queryResultsRequestVersion: queryResults.requestVersion,
    loadResultsPage,
    // High-level actions
    handleRunSql,
    handleRunJsql,
    handleConvertSqlToJsql,
    handleConvertJsqlToSql,
    handleClearSql,
    handleClearJsql,
    handleFormatSql,
    handleFormatJsql,
    handleCopySql,
    handleCopyJsql,
    handleExportResults,
    handleClearResults,
    handleShowSql,
  };
}
