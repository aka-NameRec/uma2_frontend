import { ref, computed } from 'vue';
import { useLocalStorage } from '../../../shared/lib/local-storage/use-local-storage';
import type { SelectResponse } from '../../../shared/api/uma/types';

export function useQueryState() {
  const sqlQuery = useLocalStorage('uma-sql-query', '');
  const jsqlText = useLocalStorage('uma-jsql-query', '');
  const dialect = useLocalStorage('uma-dialect', 'generic');
  const queryResults = ref<SelectResponse | null>(null);
  const executionTime = ref<number>(0);
  const activeTab = useLocalStorage('uma-active-tab', 'sqlJsql' as 'sqlJsql' | 'schema');
  const generatedSql = ref<string | null>(null);
  const isExecuting = ref<boolean>(false);
  
  if (typeof sqlQuery.value !== 'string') {
    sqlQuery.value = '';
  }
  
  if (typeof dialect.value !== 'string') {
    dialect.value = 'generic';
  }

  if (activeTab.value !== 'sqlJsql' && activeTab.value !== 'schema') {
    activeTab.value = 'sqlJsql';
  }

  if (typeof jsqlText.value !== 'string') {
    jsqlText.value = JSON.stringify(jsqlText.value, null, 2);
  }
  
  const sqlEditorValid = computed(() => sqlQuery.value.trim().length > 0);
  const jsqlEditorValid = computed(() => jsqlText.value.trim().length > 0);
  
  function setSqlQuery(sql: string) {
    sqlQuery.value = sql;
  }
  
  function setJsqlText(text: string) {
    jsqlText.value = text;
  }
  
  function setQueryResults(results: SelectResponse | null) {
    queryResults.value = results;
  }
  
  function setExecutionTime(time: number) {
    executionTime.value = time;
  }
  
  function setActiveTab(tab: 'sqlJsql' | 'schema') {
    activeTab.value = tab;
  }
  
  function setGeneratedSql(sql: string | null) {
    generatedSql.value = sql;
  }
  
  function setExecuting(executing: boolean) {
    isExecuting.value = executing;
  }
  
  function clearResults() {
    queryResults.value = null;
    executionTime.value = 0;
    generatedSql.value = null;
  }
  
  function clearAll() {
    sqlQuery.value = '';
    jsqlText.value = '';
    clearResults();
  }
  
  return {
    // State
    sqlQuery,
    jsqlText,
    dialect,
    queryResults,
    executionTime,
    activeTab,
    generatedSql,
    isExecuting,
    
    // Computed
    sqlEditorValid,
    jsqlEditorValid,
    
    // Actions
    setSqlQuery,
    setJsqlText,
    setQueryResults,
    setExecutionTime,
    setActiveTab,
    setGeneratedSql,
    setExecuting,
    clearResults,
    clearAll,
  };
}
