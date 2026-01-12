import { useLocalStorage } from '../../../shared/lib/local-storage/use-local-storage';
import type { QueryState } from './use-query-state';

export function useSchemaExplorerIntegration(queryState: QueryState & ReturnType<typeof useQueryState>) {
  const showSchemaExplorer = useLocalStorage('uma-show-schema-explorer', true);
  
  function handleInsertColumn(table: string, column: string) {
    const text = column ? `${table}.${column}` : table;
    
    if (queryState.activeTab.value === 'sql') {
      queryState.setSqlQuery(queryState.sqlQuery.value + ` ${text}`);
    } else {
      // TODO: Implement JSQL column insertion logic
      console.warn('JSQL column insertion not implemented yet');
    }
  }
  
  function toggleSchemaExplorer() {
    showSchemaExplorer.value = !showSchemaExplorer.value;
  }
  
  return {
    showSchemaExplorer,
    handleInsertColumn,
    toggleSchemaExplorer,
  };
}
