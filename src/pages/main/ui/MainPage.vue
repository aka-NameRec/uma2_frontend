<script setup lang="ts">
import { MainModel } from '../model/use-main-page';

const model = MainModel();

function formatCellValue(
  row: Record<string, unknown> | unknown[],
  col: { name: string; qualified_name: string },
  colIndex: number
) {
  const rawValue = Array.isArray(row)
    ? row[colIndex]
    : row[col.name] ?? row[col.qualified_name];

  return rawValue !== null && rawValue !== undefined ? String(rawValue) : '-';
}
</script>

<template>
  <div class="main-page h-screen flex">
    <!-- Schema Explorer Sidebar -->
    <div
      v-if="model.showSchemaExplorer.value"
      class="schema-sidebar w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r"
    >
      <div class="p-3 border-b">
        <h2 class="font-semibold text-sm">
          Schema Explorer
        </h2>
      </div>
      <div class="p-4">
        <p class="text-sm text-gray-500">
          Schema Explorer coming soon...
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Editors Section -->
      <div class="editors-section h-2/5 border-b flex flex-col">
        <div class="tabs-header flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
          <div class="tabs flex gap-2">
            <button
              :class="['tab', { 'active': model.activeTab.value === 'sql' }]"
              @click="model.setActiveTab('sql')"
            >
              SQL
            </button>
            <button
              :class="['tab', { 'active': model.activeTab.value === 'jsql' }]"
              @click="model.setActiveTab('jsql')"
            >
              JSQL
            </button>
          </div>

          <div class="flex items-center gap-2">
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

        <!-- SQL Editor -->
        <div
          v-if="model.activeTab.value === 'sql'"
          class="editor-container flex-1 flex flex-col"
        >
          <div class="toolbar flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
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
          <div class="editor-content flex-1 p-4">
            <textarea
              v-model="model.sqlQuery.value"
              class="w-full h-full p-2 font-mono text-sm border rounded resize-none"
              placeholder="Enter SQL query..."
              @keydown.ctrl.enter="model.handleRunSql"
            />
          </div>
        </div>

        <!-- JSQL Editor -->
        <div
          v-else
          class="editor-container flex-1 flex flex-col"
        >
          <div class="toolbar flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
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
          <div class="editor-content flex-1 p-4">
            <textarea
              :value="model.jsqlQuery?.value ? JSON.stringify(model.jsqlQuery.value, null, 2) : ''"
              class="w-full h-full p-2 font-mono text-sm border rounded resize-none"
              placeholder="Enter JSQL query as JSON..."
              @input="model.setJsqlQuery($event.target.value ? JSON.parse($event.target.value) : null)"
              @keydown.ctrl.enter="model.handleRunJsql"
            />
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section h-3/5 flex flex-col">
        <div class="results-header p-4 border-b bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <h3 class="text-lg font-semibold">
                Query Results
              </h3>
              
              <div
                v-if="model.queryResults?.value"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span class="flex items-center gap-1">
                  <span class="font-medium">{{ model.queryResults.value.data.length }}</span>
                  rows
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <span class="font-medium">{{ model.queryResults.value.meta.length }}</span>
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
                :disabled="!model.queryResults?.value"
                class="btn btn-outline"
                @click="model.handleExportResults"
              >
                Export
              </button>
              <button
                :disabled="!model.queryResults?.value"
                class="btn btn-outline"
                @click="model.handleShowSql"
              >
                Show SQL
              </button>
              <button
                :disabled="!model.queryResults?.value"
                class="btn btn-ghost"
                @click="model.handleClearResults"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        
        <div class="results-content flex-1 overflow-auto bg-white dark:bg-gray-900">
          <div
            v-if="model.isExecuting.value"
            class="flex items-center justify-center h-full"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
          
          <div
            v-else-if="!model.queryResults?.value"
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
          
          <div
            v-else
            class="results-table-container h-full"
          >
            <table class="results-table w-full border-collapse">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-800">
                  <th
                    v-for="(col, colIndex) in model.queryResults.value.meta"
                    :key="col.name"
                    class="border px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {{ col.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in model.queryResults.value.data"
                  :key="rowIndex"
                  class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td
                    v-for="(col, colIndex) in model.queryResults.value.meta"
                    :key="col.name"
                    class="border px-4 py-2 text-sm"
                  >
                    {{ formatCellValue(row, col, colIndex) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
