import { useQueryState } from './use-query-state';
import { useSchemaExplorerIntegration } from './use-schema-explorer-state';
import { queryExecutor } from '../../../entities/query/model/query-executor';
import { queryConverter } from '../../../entities/query/model/query-converter';
import type { QueryState } from './use-query-state';

export function MainModel() {
  const queryState = useQueryState() as QueryState & ReturnType<typeof useQueryState>;
  const schemaIntegration = useSchemaExplorerIntegration(queryState);
  
  async function handleRunSql() {
    const startTime = performance.now();
    
    try {
      queryState.setExecuting(true);
      
      // Convert SQL to JSQL
      const jsql = await queryConverter.sqlToJsql(queryState.sqlQuery.value, queryState.dialect.value);
      queryState.setJsqlQuery(jsql);
      
      // Execute JSQL
      const result = await queryExecutor.executeJsql(
        jsql,
        (jsql as { params?: Record<string, unknown> | unknown[] }).params ?? null
      );
      queryState.setQueryResults(result);
      queryState.setExecutionTime(Math.round(performance.now() - startTime));
      queryState.setActiveTab('jsql');
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
      
      // Optionally get SQL for debug
      const { sql } = await queryConverter.jsqlToSql(queryState.jsqlQuery.value!, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
      queryState.setSqlQuery(sql);
      
      // Execute JSQL
      const result = await queryExecutor.executeJsql(
        queryState.jsqlQuery.value!,
        (queryState.jsqlQuery.value as { params?: Record<string, unknown> | unknown[] }).params ?? null
      );
      queryState.setQueryResults(result);
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
      queryState.setJsqlQuery(jsql);
      queryState.setActiveTab('jsql');
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
      const { sql } = await queryConverter.jsqlToSql(queryState.jsqlQuery.value!, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
      queryState.setSqlQuery(sql);
      queryState.setActiveTab('sql');
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
    queryState.setJsqlQuery(null);
  }

  function handleFormatJsql() {
    if (!queryState.jsqlQuery.value) {
      return;
    }

    // Normalize to a fresh object so the formatted JSON renders deterministically.
    const normalized = JSON.parse(JSON.stringify(queryState.jsqlQuery.value));
    queryState.setJsqlQuery(normalized);
  }
  
  function handleCopySql() {
    navigator.clipboard.writeText(queryState.sqlQuery.value);
  }
  
  function handleCopyJsql() {
    navigator.clipboard.writeText(JSON.stringify(queryState.jsqlQuery.value, null, 2));
  }
  
  function handleExportResults() {
    // TODO: Implement export functionality
    console.log('Export results:', queryState.queryResults.value);
  }
  
  function handleClearResults() {
    queryState.clearResults();
  }
  
  function handleShowSql() {
    // TODO: Show SQL in dialog
    console.log('Generated SQL:', queryState.generatedSql.value);
  }
  
  return {
    ...queryState,
    ...schemaIntegration,
    // High-level actions
    handleRunSql,
    handleRunJsql,
    handleConvertSqlToJsql,
    handleConvertJsqlToSql,
    handleClearSql,
    handleClearJsql,
    handleFormatJsql,
    handleCopySql,
    handleCopyJsql,
    handleExportResults,
    handleClearResults,
    handleShowSql,
  };
}
