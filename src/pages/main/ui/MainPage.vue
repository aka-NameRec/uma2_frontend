<script setup lang="ts">
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type { ColDef, IDatasource, IGetRowsParams, ValueGetterParams } from 'ag-grid-community';
import { MainModel } from '../model/use-main-page';
import SplitPane from '../../../shared/ui/split-pane/SplitPane.vue';
import CodeEditor from '../../../shared/ui/code-editor/CodeEditor.vue';
import SchemaExplorerGrid from '../../../features/schema-explorer/ui/SchemaExplorerGrid.vue';
import SchemaExplorerFieldsGrid from '../../../features/schema-explorer/ui/SchemaExplorerFieldsGrid.vue';
import { darkGridTheme } from '../../../shared/ui/ag-grid/theme';

const model = MainModel();

const columnDefs = computed<ColDef[]>(() => {
  const meta = model.queryResultsMeta.value ?? [];
  return meta.map((col, index) => ({
    headerName: col.name,
    field: col.name,
    resizable: true,
    sortable: true,
    valueGetter: (params: ValueGetterParams) => {
      const data = params.data as Record<string, unknown> | unknown[] | null | undefined;
      if (!data) {
        return '';
      }
      const rawValue = Array.isArray(data)
        ? data[index]
        : data[col.name] ?? data[col.qualified_name];
      return rawValue ?? '';
    },
  }));
});

const hasResults = computed(() => !!model.queryResults.value);

const dataSource = computed<IDatasource>(() => ({
  getRows: async (params: IGetRowsParams) => {
    try {
      const pageOffset = params.startRow ?? 0;
      const page = await model.loadResultsPage(pageOffset);
      if (!page) {
        params.successCallback([], pageOffset);
        return;
      }
      const lastRow = page.lastRow ?? undefined;
      params.successCallback(page.rows, lastRow);
    } catch (error) {
      console.error('Failed to load grid rows:', error);
      params.failCallback();
      throw error;
    }
  },
}));

const defaultColDef: ColDef = {
  resizable: true,
  sortable: true,
};
</script>

<template>
  <div class="main-page h-screen flex flex-col">
    <div class="tabs-header flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
      <div class="tabs flex gap-2">
        <button
          :class="['tab', { 'active': model.activeTab.value === 'sqlJsql' }]"
          @click="model.setActiveTab('sqlJsql')"
        >
          SQL/JSQL
        </button>
        <button
          :class="['tab', { 'active': model.activeTab.value === 'schema' }]"
          @click="model.setActiveTab('schema')"
        >
          Schema Explorer
        </button>
      </div>

      <div
        v-if="model.activeTab.value === 'sqlJsql'"
        class="flex items-center gap-2"
      >
        <label class="text-sm text-gray-600 dark:text-gray-400">Dialect:</label>
        <select
          :value="model.dialect.value"
          class="text-sm rounded border px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-200"
          @change="model.dialect.value = ($event.target as HTMLSelectElement).value"
        >
          <option value="generic">
            Generic
          </option>
          <option value="postgres">
            PostgreSQL
          </option>
          <option value="mysql">
            MySQL
          </option>
          <option value="sqlite">
            SQLite
          </option>
          <option value="mssql">
            SQL Server
          </option>
        </select>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <div
        v-if="model.activeTab.value === 'sqlJsql'"
        class="h-full flex flex-col"
      >
        <SplitPane
          direction="vertical"
          storage-key="uma-split-editors-results"
          :default-size="50"
          :min-size="30"
          :max-size="70"
          :handle-size="8"
        >
          <template #start>
            <div class="h-full p-4 min-h-0 overflow-hidden">
              <SplitPane
                class="h-full"
                direction="horizontal"
                storage-key="uma-split-sql-jsql"
                :default-size="50"
                :min-size="25"
                :max-size="75"
                :handle-size="8"
              >
                <template #start>
                  <div class="editor-container h-full min-h-0 overflow-hidden flex flex-col rounded-lg border bg-white dark:bg-gray-900">
                    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b bg-gray-50 dark:bg-gray-800">
                      <button
                        :disabled="!model.sqlEditorValid.value || model.isExecuting.value"
                        class="btn btn-primary"
                        @click="model.handleRunSql"
                      >
                        Run SQL
                      </button>
                      <button
                        :disabled="!model.sqlEditorValid.value"
                        class="btn btn-secondary"
                        @click="model.handleConvertSqlToJsql"
                      >
                        Convert
                      </button>
                      <button
                        :disabled="!model.sqlEditorValid.value"
                        class="btn btn-secondary"
                        @click="model.handleFormatSql"
                      >
                        Format
                      </button>
                      <div class="flex-1" />
                      <button
                        class="btn btn-ghost"
                        @click="model.handleCopySql"
                      >
                        Copy
                      </button>
                      <button
                        class="btn btn-ghost"
                        @click="model.handleClearSql"
                      >
                        Clear
                      </button>
                    </div>
                    <div class="editor-content flex-1 min-h-0 overflow-hidden p-3">
                      <CodeEditor
                        class="h-full"
                        v-model="model.sqlQuery.value"
                        language="sql"
                        :dialect="model.dialect.value"
                        @run="model.handleRunSql"
                      />
                    </div>
                  </div>
                </template>
                <template #end>
                  <div class="editor-container h-full min-h-0 overflow-hidden flex flex-col rounded-lg border bg-white dark:bg-gray-900">
                    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b bg-gray-50 dark:bg-gray-800">
                      <button
                        :disabled="!model.jsqlEditorValid.value || model.isExecuting.value"
                        class="btn btn-primary"
                        @click="model.handleRunJsql"
                      >
                        Run JSQL
                      </button>
                      <button
                        :disabled="!model.jsqlEditorValid.value"
                        class="btn btn-secondary"
                        @click="model.handleConvertJsqlToSql"
                      >
                        Convert
                      </button>
                      <button
                        :disabled="!model.jsqlEditorValid.value"
                        class="btn btn-secondary"
                        @click="model.handleFormatJsql"
                      >
                        Format
                      </button>
                      <div class="flex-1" />
                      <button
                        class="btn btn-ghost"
                        @click="model.handleCopyJsql"
                      >
                        Copy
                      </button>
                      <button
                        class="btn btn-ghost"
                        @click="model.handleClearJsql"
                      >
                        Clear
                      </button>
                    </div>
                    <div class="editor-content flex-1 min-h-0 overflow-hidden p-3">
                      <CodeEditor
                        class="h-full"
                        v-model="model.jsqlText.value"
                        language="json"
                        @run="model.handleRunJsql"
                      />
                    </div>
                  </div>
                </template>
              </SplitPane>
            </div>
          </template>
          <template #end>
            <div class="results-section h-full min-h-0 flex flex-col">
              <div class="results-header p-4 border-b bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <h3 class="text-lg font-semibold">
                      Query Results
                    </h3>
                    
                    <div
                      v-if="hasResults"
                      class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span class="flex items-center gap-1">
                        <span class="font-medium">{{ model.queryResultsRowCount.value }}</span>
                        rows
                      </span>
                      <span>•</span>
                      <span class="flex items-center gap-1">
                        <span class="font-medium">{{ model.queryResultsMeta.value.length }}</span>
                        columns
                      </span>
                      <span
                        v-if="model.executionTime.value"
                        class="text-xs"
                      >
                        • {{ model.executionTime.value }}ms
                      </span>
                    </div>
                  </div>

                  <div class="toolbar flex items-center gap-2">
                    <button
                      :disabled="!hasResults"
                      class="btn btn-outline"
                      @click="model.handleExportResults"
                    >
                      Export
                    </button>
                    <button
                      :disabled="!hasResults"
                      class="btn btn-outline"
                      @click="model.handleShowSql"
                    >
                      Show SQL
                    </button>
                    <button
                      :disabled="!hasResults"
                      class="btn btn-ghost"
                      @click="model.handleClearResults"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="results-content flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-900">
                <div
                  v-if="model.isExecuting.value"
                  class="flex items-center justify-center h-full"
                >
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
                
                <div
                  v-else-if="!hasResults"
                  class="flex items-center justify-center h-full text-gray-500"
                >
                  <div class="text-center">
                    <p class="text-lg">
                      No results
                    </p>
                    <p class="text-sm">
                      Execute a query to see results
                    </p>
                  </div>
                </div>

                <div v-else class="results-grid h-full min-h-0">
                  <AgGridVue
                    class="h-full"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :headerHeight="32"
                    :rowHeight="28"
                    rowModelType="infinite"
                    :theme="darkGridTheme"
                    :datasource="dataSource"
                    :cacheBlockSize="model.queryResultsPageSize.value"
                    :maxBlocksInCache="5"
                    :infiniteInitialRowCount="1"
                    :key="model.queryResultsRequestVersion.value"
                  />
                </div>
              </div>
            </div>
          </template>
        </SplitPane>
      </div>

      <div
        v-else
        class="h-full flex gap-4 p-4"
      >
        <SplitPane
          class="h-full w-full"
          direction="horizontal"
          storage-key="uma-split-schema-list"
          :default-size="40"
          :min-size="20"
          :max-size="70"
          :handle-size="8"
        >
          <template #start>
            <div class="h-full min-w-0 rounded-lg border bg-white dark:bg-gray-900 flex flex-col">
              <div class="px-3 py-2 border-b bg-gray-50 dark:bg-gray-800">
                <h3 class="text-sm font-semibold">
                  Tables
                </h3>
              </div>
              <div class="flex-1 min-h-0 overflow-hidden">
                <div
                  v-if="model.isLoadingEntities.value"
                  class="text-sm text-gray-500"
                >
                  Loading tables...
                </div>
                <div
                  v-else-if="model.entities.value.length === 0"
                  class="text-sm text-gray-500"
                >
                  No tables available.
                </div>
                <SchemaExplorerGrid
                  v-else
                  :rows="model.entities.value"
                  :selected="model.selectedEntity.value"
                  @select="model.handleSelectEntity"
                />
              </div>
            </div>
          </template>
          <template #end>
            <div class="h-full min-w-0 rounded-lg border bg-white dark:bg-gray-900 flex flex-col">
              <div class="px-3 py-2 border-b bg-gray-50 dark:bg-gray-800">
                <h3 class="text-sm font-semibold">
                  Fields
                </h3>
              </div>
              <div class="flex-1 min-h-0 overflow-hidden">
                <div
                  v-if="model.isLoadingEntityDetails.value"
                  class="text-sm text-gray-500"
                >
                  Loading fields...
                </div>
                <div
                  v-else-if="!model.selectedEntity.value"
                  class="text-sm text-gray-500"
                >
                  Select a table to view fields.
                </div>
                <div
                  v-else-if="!model.entityDetails.value || model.entityDetails.value.columns.length === 0"
                  class="text-sm text-gray-500"
                >
                  No fields found.
                </div>
                <SchemaExplorerFieldsGrid
                  v-else
                  :rows="model.entityDetails.value.columns"
                />
              </div>
            </div>
          </template>
        </SplitPane>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-page {
  background: white;
  color: rgb(23, 23, 23);
}

@media (prefers-color-scheme: dark) {
  .main-page {
    background: rgb(17, 24, 39);
    color: rgb(243, 244, 246);
  }
}

.tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(209, 213, 219);
  background: white;
  color: rgb(31, 41, 55);
  border-radius: 0.375rem;
  cursor: pointer;
}

.tabs button:hover {
  background: rgb(249, 250, 251);
}

.tabs button.active {
  background: rgb(59, 130, 246);
  color: white;
}

.btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: rgb(59, 130, 246);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: rgb(37, 99, 235);
}

.btn-secondary {
  background: white;
  color: rgb(31, 41, 55);
  border: 1px solid rgb(209, 213, 219);
}

.btn-secondary:hover:not(:disabled) {
  background: rgb(249, 250, 251);
}

.btn-outline {
  background: transparent;
  color: rgb(31, 41, 55);
  border: 1px solid rgb(209, 213, 219);
}

.btn-outline:hover:not(:disabled) {
  background: rgb(249, 250, 251);
}

.btn-ghost {
  background: transparent;
  color: rgb(75, 85, 99);
  border: none;
}

.btn-ghost:hover:not(:disabled) {
  background: rgb(243, 244, 246);
}

@media (prefers-color-scheme: dark) {
  .tabs button {
    background: rgb(31, 41, 55);
    color: rgb(243, 244, 246);
    border-color: rgb(75, 85, 99);
  }

  .tabs button:hover {
    background: rgb(55, 65, 81);
  }

  .tabs button.active {
    background: rgb(59, 130, 246);
    color: white;
  }

  .btn-secondary {
    background: rgb(31, 41, 55);
    color: rgb(243, 244, 246);
    border-color: rgb(75, 85, 99);
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgb(55, 65, 81);
  }

  .btn-outline {
    color: rgb(243, 244, 246);
    border-color: rgb(75, 85, 99);
  }

  .btn-outline:hover:not(:disabled) {
    background: rgb(55, 65, 81);
  }

  .btn-ghost {
    color: rgb(209, 213, 219);
  }

  .btn-ghost:hover:not(:disabled) {
    background: rgb(55, 65, 81);
  }

  th {
    background: rgb(31, 41, 55);
    color: rgb(243, 244, 246);
    border-color: rgb(75, 85, 99);
  }

  tr:hover {
    background: rgb(55, 65, 81) !important;
  }
}
</style>
