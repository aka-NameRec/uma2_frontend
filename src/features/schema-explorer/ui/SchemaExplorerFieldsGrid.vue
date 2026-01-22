<script setup lang="ts">
import { computed } from 'vue';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import type { ColumnMetadata } from '../../../shared/api/uma/types';
import GridWithSearch from '../../../shared/ui/ag-grid/GridWithSearch.vue';

interface SchemaExplorerFieldsGridProps {
  rows: ColumnMetadata[];
}

const props = defineProps<SchemaExplorerFieldsGridProps>();

const rowData = computed(() => props.rows);

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Field',
    sortable: true,
    filter: 'agTextColumnFilter',
    flex: 1,
    minWidth: 180,
    sort: 'asc',
    getQuickFilterText: (params: ValueGetterParams<ColumnMetadata>) => params.data?.name ?? '',
  },
  {
    field: 'type',
    headerName: 'Type',
    sortable: true,
    minWidth: 160,
    flex: 1,
    getQuickFilterText: () => '',
  },
  {
    field: 'flags',
    headerName: 'Flags',
    sortable: false,
    minWidth: 140,
    valueGetter: (params: ValueGetterParams<ColumnMetadata>) => {
      const flags: string[] = [];
      if (params.data?.primary_key) {
        flags.push('PK');
      }
      if (params.data?.nullable) {
        flags.push('Nullable');
      } else {
        flags.push('Required');
      }
      return flags.join(', ');
    },
    getQuickFilterText: () => '',
  },
];
</script>

<template>
  <GridWithSearch
    :rows="rowData"
    :columnDefs="columnDefs"
    rowIdKey="name"
    placeholder="Search fields..."
  />
</template>
