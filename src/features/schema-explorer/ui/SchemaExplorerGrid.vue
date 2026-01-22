<script setup lang="ts">
import { computed } from 'vue';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import GridWithSearch from '../../../shared/ui/ag-grid/GridWithSearch.vue';

interface SchemaExplorerGridProps {
  rows: string[];
  selected: string | null;
}

const props = defineProps<SchemaExplorerGridProps>();
const emit = defineEmits<{ (event: 'select', value: string): void }>();

const rowData = computed(() => props.rows.map((name) => ({ name })));

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Table',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1,
    minWidth: 180,
    sort: 'asc',
    getQuickFilterText: (params: ValueGetterParams<{ name: string }>) => params.data?.name ?? '',
  },
];
</script>

<template>
  <GridWithSearch
    :rows="rowData"
    :columnDefs="columnDefs"
    rowIdKey="name"
    placeholder="Search tables..."
    :selectedRowId="selected"
    @select="emit('select', $event)"
  />
</template>
