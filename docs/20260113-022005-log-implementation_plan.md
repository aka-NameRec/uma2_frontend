# Updated Implementation Plan for UMA2 Frontend
_Created on 13.01.2026 at 2:20:05 GMT+3_

---

## Overview

Based on the initial implementation proposal and recent clarifications, this document presents an updated plan for the UMA2 frontend demo application. The key changes include:

1. **Configuration layer** - API URL configuration via environment variables
2. **SRP compliance** - Refactored MainPage.vue following Single Responsibility Principle
3. **FSD architecture** - Clear separation of concerns across app, entities, features, pages, and shared layers

## Selected Technology Stack

### Core Framework and UI
- **Vue 3** with Composition API
- **shadcn-vue** (components in repository) + **Radix Vue** (headless primitives) + **Tailwind CSS** (styles)
- Maximum freedom in visual design with full control over code

### Key Components
- **CodeMirror 6** with `@codemirror/lang-sql` - code editor with SQL syntax highlighting
- **TanStack Vue Query** - query management, caching, status handling
- **AG Grid Community** - results table with infinite scrolling
- **pnpm** - package manager

### Utilities
- **Vite** - build tool
- **TypeScript** - typing
- **Vitest** - testing
- **native fetch** - HTTP client (with typed wrapper)

## Application Structure

```
src/
├── app/
│   ├── providers/
│   │   └── QueryProvider.vue         # Context provider for query state
│   ├── router/
│   │   └── index.ts                  # Vue Router configuration
│   └── styles/
│       └── main.css                  # Global styles
│
├── entities/
│   └── query/                        # Query entity
│       ├── model/
│       │   ├── query-executor.ts     # Core query execution logic
│       │   └── query-converter.ts    # Core SQL/JSQL conversion logic
│       └── lib/
│           └── use-query-executor.ts # Composable for query execution
│
├── features/
│   ├── editor-section/               # Editor UI section
│   │   └── ui/
│   │       └── EditorSection.vue
│   ├── results-section/              # Results UI section
│   │   └── ui/
│   │       └── ResultsSection.vue
│   ├── dialect-selector/             # SQL dialect selector
│   │   └── ui/
│   │       └── DialectSelector.vue
│   ├── sql-editor/
│   │   ├── ui/
│   │   │   ├── SqlEditor.vue
│   │   │   └── EditorToolbar.vue
│   │   └── lib/
│   │       └── use-sql-editor.ts
│   ├── jsql-editor/
│   │   ├── ui/
│   │   │   ├── JsqlEditor.vue
│   │   │   └── EditorToolbar.vue
│   │   └── lib/
│   │       └── use-jsql-editor.ts
│   ├── query-results/
│   │   ├── ui/
│   │   │   ├── QueryResultsTable.vue
│   │   │   ├── ResultsHeader.vue
│   │   │   └── ResultsToolbar.vue
│   │   └── lib/
│   │       └── use-query-results.ts
│   └── schema-explorer/
│       ├── ui/
│       │   └── SchemaExplorer.vue
│       └── lib/
│           └── use-schema-explorer.ts
│
├── pages/
│   └── main/
│       ├── model/                    # Page logic
│       │   ├── use-main-page.ts      # Main page orchestrator
│       │   ├── use-query-state.ts    # Query state management
│       │   └── use-schema-explorer-state.ts  # Schema explorer integration
│       └── ui/
│           └── MainPage.vue          # View only - orchestration
│
├── shared/
│   ├── config/
│   │   ├── index.ts                  # Export all configs
│   │   ├── api.config.ts             # API configuration
│   │   └── env.types.ts              # Environment variable types
│   ├── api/
│   │   └── uma/
│   │       ├── client.ts             # HTTP client with fetch wrapper
│   │       ├── umaApi.ts             # UMA API endpoints
│   │       ├── endpoints.ts          # Endpoint constants
│   │       └── types.ts              # TypeScript types for API
│   ├── ui/
│   │   ├── button/
│   │   ├── resizable/
│   │   ├── tabs/
│   │   ├── toast/
│   │   └── ...                      # shadcn-vue components
│   └── lib/
│       ├── local-storage/
│       │   └── use-local-storage.ts # Local storage composable
│       └── logger/
│           └── use-logger.ts         # Logger utility
│
├── App.vue
└── main.ts
```

## API Endpoints

Based on the UMA2 backend:

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/uma/select` | POST | Execute JSQL query | `{jsql: dict, params?: dict}` | `{meta: list, data: list}` |
| `/api/uma/transform/sql2jsql` | POST | Convert SQL to JSQL | `{data: string, dialect?: string}` | `{...jsql}` |
| `/api/uma/transform/jsql2sql` | POST | Convert JSQL to SQL | `{data: dict, dialect?: string}` | `{sql: string}` |
| `/api/uma/meta/entity_list` | POST | Get entity list | `{namespace?: string}` | `{entities: string[]}` |
| `/api/uma/meta/entity_details` | POST | Get entity metadata | `{entity_name: string}` | `{...metadata}` |
| `/health` | GET | Health check | - | `{status, service}` |

## Configuration Layer

### Environment Variables

`.env` file (excluded from git):
```env
# UMA Backend API URL (required)
VITE_API_URL=http://localhost:8000

# Default SQL dialect (optional, defaults to 'generic')
VITE_DEFAULT_DIALECT=generic
```

`.env.example` file (included in git):
```env
# UMA Backend API URL (required)
VITE_API_URL=http://localhost:8000

# Default SQL dialect (optional, defaults to 'generic')
VITE_DEFAULT_DIALECT=generic
```

### Configuration Implementation

```typescript
// shared/config/env.types.ts
export interface EnvConfig {
  apiUrl: string;
  defaultDialect: string;
}

export function validateEnv(): EnvConfig {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Set it in .env file.');
  }
  
  // Remove trailing slash
  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  
  return {
    apiUrl: cleanApiUrl,
    defaultDialect: import.meta.env.VITE_DEFAULT_DIALECT || 'generic',
  };
}

export const env = validateEnv();
```

```typescript
// shared/config/api.config.ts
import { env } from './env.types';

export const apiConfig = {
  baseUrl: env.apiUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};
```

```typescript
// shared/config/index.ts
export { env, validateEnv, type EnvConfig } from './env.types';
export { apiConfig } from './api.config';
```

### HTTP Client with Fetch

```typescript
// shared/api/uma/client.ts
import { apiConfig } from '../../../config';

export class UmaClient {
  private baseUrl: string;
  private timeout: number;
  
  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout;
  }
  
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...apiConfig.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'GET',
    });
  }
}

export const umaClient = new UmaClient();
```

## Phase 1: Infrastructure Setup

### 1.1 Project Initialization
- Create directory structure
- Initialize Vite + Vue 3 + TypeScript
- Configure Tailwind CSS
- Install dependencies: Vue, Radix Vue, CodeMirror, AG Grid, TanStack Query
- Initialize pnpm workspace

### 1.2 Configuration
- Configure TypeScript with strict mode
- Configure ESLint + Prettier
- Configure shadcn-vue CLI
- Create TypeScript types for API
- **Setup environment variable configuration** (new)
- Create `.env` and `.env.example` files

### 1.3 HTTP Client and API Layer
- Create HTTP client wrapper with fetch (new)
- Create TypeScript types for all API requests and responses
- Create API functions for each endpoint
- Add error handling
- Add interceptors for logging
- Integrate with apiConfig.baseUrl

### TypeScript Types for API

```typescript
// shared/api/uma/types.ts
export interface SelectRequest {
  jsql: Record<string, unknown>;
  params?: Record<string, unknown> | null;
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

export interface EntityMetadata {
  name: string;
  columns: ColumnMetadata[];
  // ... other fields
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  // ... other fields
}

export interface EntityDetailsResponse extends EntityMetadata {}
```

## Phase 2: Editor Components

### 2.1 SqlEditor.vue

```typescript
// features/sql-editor/ui/SqlEditor.vue
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  modelValue: string;
  dialect?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'execute'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement>();
let editor: EditorView | null = null;

onMounted(() => {
  if (!editorRef.value) return;
  
  editor = new EditorView({
    extensions: [
      basicSetup,
      sql({ dialect: props.dialect || 'standard' }),
      oneDark,
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ],
    parent: editorRef.value,
  });
  
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: props.modelValue },
  });
  
  // Listen for changes
  editor.state.field(EditorView.changeFilter).subscribe((transaction) => {
    if (transaction.docChanged) {
      emit('update:modelValue', editor!.state.doc.toString());
    }
  });
  
  // Keyboard shortcuts
  editor.domElement.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      emit('execute');
    }
  });
});

watch(() => props.modelValue, (newValue) => {
  if (editor && editor.state.doc.toString() !== newValue) {
    const cursor = editor.state.selection.main.head;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: newValue },
      selection: { anchor: cursor },
    });
  }
});

onBeforeUnmount(() => {
  editor?.destroy();
});
</script>

<template>
  <div ref="editorRef" class="sql-editor h-full w-full overflow-auto"></div>
</template>

<style scoped>
.sql-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
```

### 2.2 JsqlEditor.vue

```typescript
// features/jsql-editor/ui/JsqlEditor.vue
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface Props {
  modelValue: Record<string, unknown> | null;
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, unknown> | null): void;
  (e: 'execute'): void;
  (e: 'error', error: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement>();
let editor: EditorView | null = null;

function formatValue(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : '';
}

function parseValue(text: string): Record<string, unknown> | null {
  try {
    return text.trim() ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
}

onMounted(() => {
  if (!editorRef.value) return;
  
  editor = new EditorView({
    extensions: [
      basicSetup,
      javascript({ jsx: false }),
      oneDark,
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ],
    parent: editorRef.value,
  });
  
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: formatValue(props.modelValue) },
  });
  
  // Listen for changes
  editor.state.field(EditorView.changeFilter).subscribe(() => {
    const text = editor!.state.doc.toString();
    const parsed = parseValue(text);
    emit('update:modelValue', parsed);
    
    if (text.trim() && !parsed) {
      emit('error', 'Invalid JSON');
    }
  });
  
  // Keyboard shortcuts
  editor.domElement.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      emit('execute');
    }
    if (e.ctrlKey && e.key === 'Shift' && e.key === 'F') {
      e.preventDefault();
      formatJson();
    }
  });
});

function formatJson() {
  if (editor && props.modelValue) {
    const formatted = formatValue(props.modelValue);
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: formatted },
    });
  }
}

watch(() => props.modelValue, (newValue) => {
  if (editor) {
    const formatted = formatValue(newValue);
    if (editor.state.doc.toString() !== formatted) {
      const cursor = editor.state.selection.main.head;
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: formatted },
        selection: { anchor: cursor },
      });
    }
  }
});

onBeforeUnmount(() => {
  editor?.destroy();
});

defineExpose({ formatJson });
</script>

<template>
  <div ref="editorRef" class="jsql-editor h-full w-full overflow-auto"></div>
</template>

<style scoped>
.jsql-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
```

### 2.3 EditorToolbar.vue

```typescript
// features/sql-editor/ui/EditorToolbar.vue
<script setup lang="ts">
import { Button } from '../../../shared/ui/button';
import { Play, RefreshCw, Copy, Trash2, Code2 } from 'lucide-vue-next';

interface Props {
  type: 'sql' | 'jsql';
  canExecute: boolean;
  isExecuting: boolean;
  isValid?: boolean;
}

interface Emits {
  (e: 'execute'): void;
  (e: 'convert'): void;
  (e: 'format'): void;
  (e: 'clear'): void;
  (e: 'copy'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="editor-toolbar flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
    <Button
      :disabled="!canExecute || isExecuting"
      size="sm"
      @click="emit('execute')"
    >
      <Play class="w-4 h-4 mr-2" />
      Run {{ type.toUpperCase() }}
    </Button>
    
    <Button
      variant="outline"
      :disabled="!canExecute"
      size="sm"
      @click="emit('convert')"
    >
      <RefreshCw class="w-4 h-4 mr-2" />
      Convert
    </Button>
    
    <Button
      v-if="type === 'jsql'"
      variant="outline"
      :disabled="!canExecute"
      size="sm"
      @click="emit('format')"
    >
      <Code2 class="w-4 h-4 mr-2" />
      Format
    </Button>
    
    <div class="flex-1"></div>
    
    <Button
      variant="ghost"
      size="sm"
      @click="emit('copy')"
    >
      <Copy class="w-4 h-4" />
    </Button>
    
    <Button
      variant="ghost"
      size="sm"
      @click="emit('clear')"
    >
      <Trash2 class="w-4 h-4" />
    </Button>
  </div>
</template>
```

### 2.4 DialectSelector.vue

```typescript
// features/dialect-selector/ui/DialectSelector.vue
<script setup lang="ts">
import { computed } from 'vue';

const DIALECTS = [
  { value: 'generic', label: 'Generic' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mssql', label: 'SQL Server' },
] as const;

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleDialectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-sm text-gray-600 dark:text-gray-400">Dialect:</label>
    <select
      :value="modelValue"
      @change="handleDialectChange"
      class="text-sm rounded border px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-200"
    >
      <option
        v-for="dialect in DIALECTS"
        :key="dialect.value"
        :value="dialect.value"
      >
        {{ dialect.label }}
      </option>
    </select>
  </div>
</template>
```

## Phase 3: Entity Layer - Core Business Logic

### 3.1 QueryExecutor

```typescript
// entities/query/model/query-executor.ts
import { umaClient } from '../../../shared/api/uma/client';
import type { SelectRequest, SelectResponse } from '../../../shared/api/uma/types';

export class QueryExecutor {
  async executeJsql(jsql: Record<string, unknown>, params?: Record<string, unknown>): Promise<SelectResponse> {
    const request: SelectRequest = {
      jsql,
      params: params || null,
    };
    
    return await umaClient.post<SelectRequest, SelectResponse>('/api/uma/select', request);
  }
}

export const queryExecutor = new QueryExecutor();
```

### 3.2 QueryConverter

```typescript
// entities/query/model/query-converter.ts
import { umaClient } from '../../../shared/api/uma/client';
import type { SQL2JSQLRequest, SQL2JSQLResponse, JSQL2SQLRequest, JSQL2SQLResponse } from '../../../shared/api/uma/types';

export class QueryConverter {
  async sqlToJsql(sql: string, dialect?: string): Promise<SQL2JSQLResponse> {
    const request: SQL2JSQLRequest = {
      data: sql,
      dialect,
    };
    
    return await umaClient.post<SQL2JSQLRequest, SQL2JSQLResponse>('/api/uma/transform/sql2jsql', request);
  }
  
  async jsqlToSql(jsql: Record<string, unknown>, dialect?: string): Promise<JSQL2SQLResponse> {
    const request: JSQL2SQLRequest = {
      data: jsql,
      dialect,
    };
    
    return await umaClient.post<JSQL2SQLRequest, JSQL2SQLResponse>('/api/uma/transform/jsql2sql', request);
  }
}

export const queryConverter = new QueryConverter();
```

## Phase 4: Query State Management (Page Layer)

### 4.1 use-query-state.ts

```typescript
// pages/main/model/use-query-state.ts
import { ref, computed } from 'vue';
import { useLocalStorage } from '../../../shared/lib/local-storage/use-local-storage';
import type { SelectResponse } from '../../../shared/api/uma/types';

export function useQueryState() {
  const sqlQuery = useLocalStorage('uma-sql-query', '');
  const jsqlQuery = useLocalStorage('uma-jsql-query', null as Record<string, unknown> | null);
  const dialect = useLocalStorage('uma-dialect', 'generic');
  const queryResults = ref<SelectResponse | null>(null);
  const executionTime = ref<number>(0);
  const activeTab = useLocalStorage('uma-active-tab', 'sql' as 'sql' | 'jsql');
  const generatedSql = ref<string | null>(null);
  const isExecuting = ref<boolean>(false);
  
  const sqlEditorValid = computed(() => sqlQuery.value.trim().length > 0);
  const jsqlEditorValid = computed(() => jsqlQuery.value !== null);
  
  function setSqlQuery(sql: string) {
    sqlQuery.value = sql;
  }
  
  function setJsqlQuery(jsql: Record<string, unknown> | null) {
    jsqlQuery.value = jsql;
  }
  
  function setQueryResults(results: SelectResponse | null) {
    queryResults.value = results;
  }
  
  function setExecutionTime(time: number) {
    executionTime.value = time;
  }
  
  function setActiveTab(tab: 'sql' | 'jsql') {
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
    jsqlQuery.value = null;
    clearResults();
  }
  
  return {
    // State
    sqlQuery,
    jsqlQuery,
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
    setJsqlQuery,
    setQueryResults,
    setExecutionTime,
    setActiveTab,
    setGeneratedSql,
    setExecuting,
    clearResults,
    clearAll,
  };
}
```

### 4.2 use-schema-explorer-state.ts

```typescript
// pages/main/model/use-schema-explorer-state.ts
import { useLocalStorage } from '../../../shared/lib/local-storage/use-local-storage';
import type { QueryState } from './use-query-state';

export function useSchemaExplorerIntegration(queryState: QueryState) {
  const showSchemaExplorer = useLocalStorage('uma-show-schema-explorer', true);
  
  function handleInsertColumn(table: string, column: string) {
    const text = column ? `${table}.${column}` : table;
    
    if (queryState.activeTab.value === 'sql') {
      queryState.setSqlQuery(queryState.sqlQuery.value + ` ${text}`);
    } else {
      // TODO: Implement JSQL insertion logic
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
```

### 4.3 use-main-page.ts (Orchestrator)

```typescript
// pages/main/model/use-main-page.ts
import { useQueryState } from './use-query-state';
import { useSchemaExplorerIntegration } from './use-schema-explorer-state';
import { queryExecutor } from '../../entities/query/model/query-executor';
import { queryConverter } from '../../entities/query/model/query-converter';
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
      const result = await queryExecutor.executeJsql(jsql);
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
      const sql = await queryConverter.jsqlToSql(queryState.jsqlQuery!, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
      
      // Execute JSQL
      const result = await queryExecutor.executeJsql(queryState.jsqlQuery!);
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
      const sql = await queryConverter.jsqlToSql(queryState.jsqlQuery!, queryState.dialect.value);
      queryState.setGeneratedSql(sql);
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
    handleCopySql,
    handleCopyJsql,
    handleExportResults,
    handleClearResults,
    handleShowSql,
  };
}
```

## Phase 5: UI Sections (Features Layer)

### 5.1 EditorSection.vue

```typescript
// features/editor-section/ui/EditorSection.vue
<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { ResizablePanel, ResizableHandle } from '../../../shared/ui/resizable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui/tabs';
import SqlEditor from '../../sql-editor/ui/SqlEditor.vue';
import JsqlEditor from '../../jsql-editor/ui/JsqlEditor.vue';
import EditorToolbar from '../../sql-editor/ui/EditorToolbar.vue';
import DialectSelector from '../../dialect-selector/ui/DialectSelector.vue';

interface Props {
  sqlQuery: Ref<string>;
  jsqlQuery: Ref<Record<string, unknown> | null>;
  activeTab: Ref<string>;
  dialect: Ref<string>;
  isExecuting: Ref<boolean>;
  onRunSql: () => void;
  onRunJsql: () => void;
  onConvertSqlToJsql: () => void;
  onConvertJsqlToSql: () => void;
  onClearSql: () => void;
  onClearJsql: () => void;
  onCopySql: () => void;
  onCopyJsql: () => void;
  onFormatJsql: () => void;
}

defineProps<Props>();
</script>

<template>
  <ResizablePanel class="h-2/5 border-b">
    <Tabs v-model="activeTab" class="h-full flex flex-col">
      <div class="flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
        <TabsList>
          <TabsTrigger value="sql">SQL</TabsTrigger>
          <TabsTrigger value="jsql">JSQL</TabsTrigger>
        </TabsList>

        <DialectSelector v-model="dialect" />
      </div>

      <TabsContent value="sql" class="flex-1 flex flex-col m-0">
        <EditorToolbar
          type="sql"
          :can-execute="sqlQuery.value.trim().length > 0"
          :is-executing="isExecuting.value"
          @execute="onRunSql"
          @convert="onConvertSqlToJsql"
          @clear="onClearSql"
          @copy="onCopySql"
        />
        <SqlEditor
          v-model="sqlQuery"
          :dialect="dialect"
          @execute="onRunSql"
        />
      </TabsContent>

      <TabsContent value="jsql" class="flex-1 flex flex-col m-0">
        <EditorToolbar
          type="jsql"
          :can-execute="jsqlQuery !== null"
          :is-executing="isExecuting.value"
          @execute="onRunJsql"
          @convert="onConvertJsqlToSql"
          @format="onFormatJsql"
          @clear="onClearJsql"
          @copy="onCopyJsql"
        />
        <JsqlEditor
          v-model="jsqlQuery"
          @execute="onRunJsql"
        />
      </TabsContent>
    </Tabs>
  </ResizablePanel>
</template>
```

### 5.2 ResultsSection.vue

```typescript
// features/results-section/ui/ResultsSection.vue
<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { ResizablePanel, ResizableHandle } from '../../../shared/ui/resizable';
import QueryResultsTable from '../../query-results/ui/QueryResultsTable.vue';
import ResultsHeader from '../../query-results/ui/ResultsHeader.vue';
import ResultsToolbar from '../../query-results/ui/ResultsToolbar.vue';
import type { SelectResponse } from '../../../shared/api/uma/types';

interface Props {
  queryResults: Ref<SelectResponse | null>;
  executionTime: Ref<number>;
  loading: Ref<boolean>;
  onClear: () => void;
  onExport: () => void;
  onShowSql: () => void;
}

defineProps<Props>();
</script>

<template>
  <ResizablePanel class="h-3/5 flex flex-col">
    <ResultsHeader
      :results="queryResults"
      :execution-time="executionTime"
    >
      <ResultsToolbar 
        :has-results="!!queryResults"
        @clear="onClear"
        @export="onExport"
        @show-sql="onShowSql"
      />
    </ResultsHeader>
    
    <QueryResultsTable 
      :results="queryResults"
      :loading="loading"
      :infinite="false"
    />
  </ResizablePanel>
</template>
```

### 5.3 QueryResultsTable.vue (AG Grid)

```typescript
// features/query-results/ui/QueryResultsTable.vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import type { SelectResponse, ColumnMeta } from '../../../shared/api/uma/types';

interface Props {
  results: SelectResponse | null;
  loading?: boolean;
  infinite?: boolean;
}

const props = defineProps<Props>();

const gridApi = ref<any>(null);
const columnDefs = computed<any[]>(() => {
  if (!props.results?.meta) return [];
  
  return props.results.meta.map((col: ColumnMeta) => ({
    field: col.name,
    headerName: col.name,
    sortable: true,
    filter: true,
    resizable: true,
    type: getTypeFromMeta(col.type),
  }));
});

const rowData = computed<Record<string, unknown>[]>(() => {
  return props.results?.data || [];
});

function getTypeFromMeta(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('int') || lowerType.includes('numeric')) return 'numericColumn';
  if (lowerType.includes('date') || lowerType.includes('time')) return 'dateColumn';
  if (lowerType.includes('bool')) return 'booleanColumn';
  return 'textColumn';
}

function onGridReady(params: any) {
  gridApi.value = params.api;
}

function getDefaultColDef() {
  return {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  };
}
</script>

<template>
  <div class="query-results-table h-full flex-1 overflow-auto bg-white dark:bg-gray-900">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="!results" class="flex items-center justify-center h-full text-gray-500">
      <div class="text-center">
        <p class="text-lg">No results</p>
        <p class="text-sm">Execute a query to see results</p>
      </div>
    </div>
    
    <AgGridVue
      v-else
      class="ag-theme-quartz h-full"
      :column-defs="columnDefs"
      :row-data="rowData"
      :default-col-def="getDefaultColDef()"
      :grid-options="{
        animateRows: true,
        enableCellTextSelection: true,
      }"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<style scoped>
.ag-theme-quartz {
  --ag-foreground-color: rgb(23, 23, 23);
  --ag-background-color: rgb(255, 255, 255);
  --ag-header-background-color: rgb(249, 250, 251);
  --ag-odd-row-background-color: rgb(249, 250, 251);
  --ag-row-hover-color: rgb(243, 244, 246);
  --ag-border-color: rgb(229, 231, 235);
  --ag-header-foreground-color: rgb(55, 65, 81);
  --ag-cell-horizontal-border: rgb(229, 231, 235);
}

@media (prefers-color-scheme: dark) {
  .ag-theme-quartz {
    --ag-foreground-color: rgb(243, 244, 246);
    --ag-background-color: rgb(17, 24, 39);
    --ag-header-background-color: rgb(31, 41, 55);
    --ag-odd-row-background-color: rgb(17, 24, 39);
    --ag-row-hover-color: rgb(31, 41, 55);
    --ag-border-color: rgb(55, 65, 81);
    --ag-header-foreground-color: rgb(243, 244, 246);
    --ag-cell-horizontal-border: rgb(55, 65, 81);
  }
}
</style>
```

### 5.4 ResultsHeader.vue

```typescript
// features/query-results/ui/ResultsHeader.vue
<script setup lang="ts">
import type { SelectResponse } from '../../../shared/api/uma/types';

interface Props {
  results: SelectResponse | null;
  executionTime?: number;
  queryType?: 'sql' | 'jsql';
}

defineProps<Props>();
</script>

<template>
  <div class="results-header p-4 border-b bg-gray-50 dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h3 class="text-lg font-semibold">Query Results</h3>
        
        <div v-if="results" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span class="flex items-center gap-1">
            <span class="font-medium">{{ results.data.length }}</span>
            rows
          </span>
          <span>•</span>
          <span class="flex items-center gap-1">
            <span class="font-medium">{{ results.meta.length }}</span>
            columns
          </span>
          <span v-if="executionTime" class="text-xs">
            • {{ executionTime }}ms
          </span>
        </div>
      </div>

      <slot></slot>
    </div>
  </div>
</template>
```

### 5.5 ResultsToolbar.vue

```typescript
// features/query-results/ui/ResultsToolbar.vue
<script setup lang="ts">
import { Button } from '../../../shared/ui/button';
import { Download, Trash2, Eye } from 'lucide-vue-next';

interface Props {
  hasResults?: boolean;
}

interface Emits {
  (e: 'export'): void;
  (e: 'clear'): void;
  (e: 'show-sql'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="results-toolbar flex items-center gap-2 p-2 border-b bg-white dark:bg-gray-900">
    <Button
      variant="outline"
      size="sm"
      :disabled="!hasResults"
      @click="emit('export')"
    >
      <Download class="w-4 h-4 mr-2" />
      Export
    </Button>

    <Button
      variant="outline"
      size="sm"
      :disabled="!hasResults"
      @click="emit('show-sql')"
    >
      <Eye class="w-4 h-4 mr-2" />
      Show SQL
    </Button>

    <div class="flex-1"></div>

    <Button
      variant="ghost"
      size="sm"
      :disabled="!hasResults"
      @click="emit('clear')"
    >
      <Trash2 class="w-4 h-4" />
    </Button>
  </div>
</template>
```

### 5.6 SchemaExplorer.vue

```typescript
// features/schema-explorer/ui/SchemaExplorer.vue
<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { umaClient } from '../../../shared/api/uma/client';
import type { EntityListResponse, EntityMetadata } from '../../../shared/api/uma/types';
import { ChevronRight, ChevronDown, Database, Key } from 'lucide-vue-next';

interface Props {
  onInsertColumn?: (table: string, column: string) => void;
  namespace?: string;
}

const props = defineProps<Props>();

const expandedNodes = ref<Set<string>>(new Set());
const selectedEntity = ref<string | null>(null);

// Fetch entities list
const { data: entities, isLoading: loadingEntities } = useQuery({
  queryKey: ['uma', 'entities', props.namespace],
  queryFn: async () => {
    return await umaClient.post<{ namespace?: string }, EntityListResponse>(
      '/api/uma/meta/entity_list',
      { namespace: props.namespace }
    );
  },
});

// Fetch selected entity details
const { data: entityMetadata, isLoading: loadingMetadata } = useQuery({
  queryKey: ['uma', 'entity', selectedEntity.value],
  queryFn: async () => {
    if (!selectedEntity.value) return null;
    return await umaClient.post<{ entity_name: string }, EntityMetadata>(
      '/api/uma/meta/entity_details',
      { entity_name: selectedEntity.value }
    );
  },
  enabled: !!selectedEntity.value,
});

function selectEntity(entity: string) {
  selectedEntity.value = entity;
  expandedNodes.value.add(entity);
}

function insertColumn(column: string) {
  if (selectedEntity.value && props.onInsertColumn) {
    props.onInsertColumn(selectedEntity.value, column);
  }
}

function insertEntity(entity: string) {
  if (props.onInsertColumn) {
    props.onInsertColumn(entity, '');
  }
}
</script>

<template>
  <div class="schema-explorer h-full flex flex-col bg-white dark:bg-gray-900 border-r w-64 flex-shrink-0">
    <div class="p-3 border-b">
      <h2 class="font-semibold text-sm">Schema Explorer</h2>
    </div>

    <div v-if="loadingEntities" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else class="flex-1 overflow-auto p-2">
      <div v-if="entities?.entities.length === 0" class="text-sm text-gray-500 text-center py-4">
        No entities found
      </div>

      <div v-else class="space-y-1">
        <div 
          v-for="entity in entities?.entities" 
          :key="entity"
          class="entity-node"
        >
          <div
            class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            @click="selectEntity(entity)"
          >
            <ChevronRight
              v-if="!expandedNodes.has(entity)"
              class="w-4 h-4 text-gray-400"
            />
            <ChevronDown
              v-else
              class="w-4 h-4 text-gray-400"
            />
            <Database class="w-4 h-4 text-blue-500" />
            <span class="text-sm">{{ entity }}</span>
          </div>

          <div v-if="expandedNodes.has(entity)" class="ml-6 space-y-1">
            <div v-if="loadingMetadata" class="px-2 py-1 text-sm text-gray-500">
              Loading...
            </div>

            <div v-else-if="entityMetadata?.name === entity">
              <div
                v-for="column in entityMetadata.columns"
                :key="column.name"
                class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                @click="insertColumn(column.name)"
              >
                <span class="w-4 h-4 text-gray-400">•</span>
                <Key 
                  v-if="column.primary_key"
                  class="w-3 h-3 text-yellow-500"
                />
                <span class="text-sm">{{ column.name }}</span>
                <span class="text-xs text-gray-500">{{ column.type }}</span>
                <span class="ml-auto opacity-0 group-hover:opacity-100 text-xs text-blue-500">
                  Insert
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entity-node {
  user-select: none;
}
</style>
```

## Phase 6: MainPage (Orchestration Only)

```typescript
// pages/main/ui/MainPage.vue
<script setup lang="ts">
import { MainModel } from '../model/use-main-page';
import SchemaExplorer from '../../../features/schema-explorer/ui/SchemaExplorer.vue';
import EditorSection from '../../../features/editor-section/ui/EditorSection.vue';
import ResultsSection from '../../../features/results-section/ui/ResultsSection.vue';

const model = MainModel();
</script>

<template>
  <div class="main-page h-screen flex">
    <!-- Schema Explorer Sidebar -->
    <SchemaExplorer
      v-if="model.showSchemaExplorer"
      :on-insert-column="model.handleInsertColumn"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Editors Section (40% height) -->
      <EditorSection
        :sql-query="model.sqlQuery"
        :jsql-query="model.jsqlQuery"
        :active-tab="model.activeTab"
        :dialect="model.dialect"
        :is-executing="model.isExecuting"
        :on-run-sql="model.handleRunSql"
        :on-run-jsql="model.handleRunJsql"
        :on-convert-sql-to-jsql="model.handleConvertSqlToJsql"
        :on-convert-jsql-to-sql="model.handleConvertJsqlToSql"
        :on-clear-sql="model.handleClearSql"
        :on-clear-jsql="model.handleClearJsql"
        :on-copy-sql="model.handleCopySql"
        :on-copy-jsql="model.handleCopyJsql"
        :on-format-jsql="() => {}"
      />

      <!-- Results Section (60% height) -->
      <ResultsSection
        :query-results="model.queryResults"
        :execution-time="model.executionTime"
        :loading="model.isExecuting"
        :on-clear="model.handleClearResults"
        :on-export="model.handleExportResults"
        :on-show-sql="model.handleShowSql"
      />
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
</style>
```

## Phase 7: Shared Utilities

### 7.1 useLocalStorage

```typescript
// shared/lib/local-storage/use-local-storage.ts
import { ref, watch } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const storedValue = localStorage.getItem(key);
  const value = ref<T>(storedValue ? JSON.parse(storedValue) : defaultValue);
  
  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  }, { deep: true });
  
  return value;
}
```

### 7.2 UmaApi

```typescript
// shared/api/uma/umaApi.ts
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
```

## Phase 8: Application Entry Points

### 8.1 main.ts

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import './app/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  },
});

app.mount('#app');
```

### 8.2 App.vue

```typescript
// App.vue
<script setup lang="ts">
import MainPage from './pages/main/ui/MainPage.vue';
</script>

<template>
  <MainPage />
</template>
```

## Phase 9: Configuration Files

### 9.1 package.json

```json
{
  "name": "uma-frontend-demo",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.7",
    "@tanstack/vue-query": "^5.0.0",
    "ag-grid-community": "^31.0.0",
    "ag-grid-vue3": "^31.0.0",
    "@codemirror/view": "^6.23.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/lang-sql": "^6.5.4",
    "@codemirror/lang-javascript": "^6.2.2",
    "@codemirror/theme-one-dark": "^6.1.2",
    "@codemirror/commands": "^6.3.3",
    "radix-vue": "^1.7.0",
    "lucide-vue-next": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@vue/test-utils": "^2.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "playwright": "^1.40.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.19.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.1.0",
    "shadcn-vue": "^0.9.0",
    "vue-tsc": "^1.8.0"
  }
}
```

### 9.2 .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
dist/
dist-ssr/
build/

# Environment files
.env
.env.local
.env.*.local

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
coverage/
*.lcov
.nyc_output

# Misc
.turbo
.cache
```

### 9.3 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### 9.4 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Phase 10: Implementation Priorities

### P0 (Critical for MVP)

1. **Infrastructure**
   - Project initialization (Vite + Vue 3 + TypeScript)
   - Configuration layer (`.env`, `api.config.ts`)
   - HTTP client with fetch wrapper
   - TypeScript types for API

2. **Core functionality**
   - QueryExecutor entity
   - QueryConverter entity
   - use-query-state (page model)
   - MainPage (orchestration)

3. **Basic UI**
   - SqlEditor
   - JsqlEditor
   - EditorSection
   - ResultsSection
   - QueryResultsTable

### P1 (Important for usability)

4. **Enhanced UI**
   - DialectSelector
   - EditorToolbar
   - ResultsHeader
   - ResultsToolbar
   - Dark mode support

5. **Integration**
   - SchemaExplorer integration
   - LocalStorage persistence
   - Error handling and toasts

### P2 (Nice to have)

6. **Advanced features**
   - Export results
   - Query history
   - Keyboard shortcuts
   - Copy to clipboard

7. **Polish**
   - Loading states
   - Empty states
   - Error states
   - Responsive design

## Key Changes Summary

### Configuration
- ✅ Added environment variable configuration layer
- ✅ Created `.env` and `.env.example` files
- ✅ Implemented `api.config.ts` with `VITE_API_URL`
- ✅ Created typed fetch-based HTTP client

### Architecture
- ✅ Separated MainPage.vue into view and model layers
- ✅ Created EditorSection.vue for editor UI
- ✅ Created ResultsSection.vue for results UI
- ✅ Implemented use-main-page.ts as orchestrator
- ✅ Implemented use-query-state.ts for state management
- ✅ Moved core logic to entity layer (query-executor, query-converter)

### Responsibilities
- ✅ MainPage.vue - orchestration only (~50 lines)
- ✅ use-main-page.ts - business logic and coordination
- ✅ use-query-state.ts - state management
- ✅ EditorSection.vue - editor UI
- ✅ ResultsSection.vue - results UI
- ✅ query-executor.ts - pure execution logic
- ✅ query-converter.ts - pure conversion logic

---

**Next Steps:** Review this updated plan and proceed with implementation starting from P0 (Critical for MVP) items.
