<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type {
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
} from 'ag-grid-community';
import { darkGridTheme } from './theme';

interface GridWithSearchProps {
  rows: Record<string, unknown>[];
  columnDefs: ColDef[];
  rowIdKey: string;
  placeholder?: string;
  rowSelection?: 'single' | 'multiple';
  selectedRowId?: string | null;
}

const props = defineProps<GridWithSearchProps>();
const emit = defineEmits<{ (event: 'select', value: string): void }>();

const filterText = ref<string>('');
const gridApi = ref<GridApi | null>(null);

const rowData = computed(() => props.rows);

const defaultColDef: ColDef = {
  resizable: true,
};

const getRowId = (params: GetRowIdParams<Record<string, unknown>>) => {
  const value = params.data?.[props.rowIdKey];
  if (value === undefined || value === null) {
    throw new Error(`Row id "${props.rowIdKey}" is missing for grid data.`);
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`Row id "${props.rowIdKey}" must be a string or number.`);
  }
  return String(value);
};

function selectRow(rowId: string | null | undefined) {
  if (!gridApi.value) {
    return;
  }
  gridApi.value.deselectAll();
  if (!rowId) {
    return;
  }
  const rowNode = gridApi.value.getRowNode(rowId);
  if (rowNode) {
    rowNode.setSelected(true, true);
  }
}

function handleGridReady(event: GridReadyEvent) {
  gridApi.value = event.api;
  gridApi.value.setGridOption('quickFilterText', filterText.value);
  selectRow(props.selectedRowId ?? null);
}

function handleRowClicked(event: RowClickedEvent<Record<string, unknown>>) {
  const rowId = event.data?.[props.rowIdKey];
  if (rowId === undefined || rowId === null) {
    return;
  }
  emit('select', String(rowId));
}

watch(
  () => props.selectedRowId,
  (next) => selectRow(next ?? null)
);

watch(filterText, (value) => {
  if (!gridApi.value) {
    return;
  }
  gridApi.value.setGridOption('quickFilterText', value);
});
</script>

<template>
  <div class="h-full min-h-0 flex flex-col">
    <div class="px-3 py-2 border-b bg-gray-800">
      <input
        v-model="filterText"
        type="text"
        :placeholder="placeholder ?? 'Search...'"
        class="uma-grid-search w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
    <div class="flex-1 min-h-0">
      <AgGridVue
        class="h-full"
        :theme="darkGridTheme"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :rowData="rowData"
        :rowHeight="30"
        :headerHeight="32"
        :rowSelection="rowSelection ?? 'single'"
        :getRowId="getRowId"
        @grid-ready="handleGridReady"
        @rowClicked="handleRowClicked"
      />
    </div>
  </div>
</template>
