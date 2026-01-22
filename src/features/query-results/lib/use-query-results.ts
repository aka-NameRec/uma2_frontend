import { computed, ref } from 'vue';
import type { ColumnMeta, SelectResponse } from '../../../shared/api/uma/types';
import { getDefaultPageSize, withPaging } from '../../../entities/query/model/jsql-pagination';

interface QueryResultsPage {
  rows: Record<string, unknown>[];
  lastRow: number | null;
}

export function useQueryResults() {
  const rows = ref<Record<string, unknown>[]>([]);
  const meta = ref<ColumnMeta[]>([]);
  const pageSize = ref<number>(getDefaultPageSize());
  const baseOffset = ref<number>(0);
  const baseJsql = ref<Record<string, unknown> | null>(null);
  const isLoadingPage = ref<boolean>(false);
  const hasMore = ref<boolean>(true);
  const loadedRowCount = ref<number>(0);
  const requestVersion = ref<number>(0);
  const pageCache = ref<Map<number, Record<string, unknown>[]>>(new Map());
  const inflightRequests = ref<Map<number, Promise<QueryResultsPage>>>(new Map());
  const activeRequests = ref<number>(0);

  const results = computed<SelectResponse | null>(() => {
    if (!meta.value.length && rows.value.length === 0) {
      return null;
    }
    return {
      meta: meta.value,
      data: rows.value,
    };
  });

  function reset(jsql: Record<string, unknown>) {
    const { paging } = withPaging(jsql, getDefaultPageSize(), 0);
    baseJsql.value = jsql;
    pageSize.value = paging.limit;
    baseOffset.value = paging.baseOffset;
    rows.value = [];
    meta.value = [];
    loadedRowCount.value = 0;
    hasMore.value = true;
    isLoadingPage.value = false;
    pageCache.value = new Map();
    inflightRequests.value = new Map();
    activeRequests.value = 0;
    requestVersion.value += 1;
  }

  function clear() {
    baseJsql.value = null;
    rows.value = [];
    meta.value = [];
    loadedRowCount.value = 0;
    hasMore.value = true;
    isLoadingPage.value = false;
    pageCache.value = new Map();
    inflightRequests.value = new Map();
    activeRequests.value = 0;
    requestVersion.value += 1;
  }

  async function loadPage(
    execute: (jsql: Record<string, unknown>) => Promise<SelectResponse>,
    pageOffset: number
  ): Promise<QueryResultsPage | null> {
    if (!baseJsql.value) {
      throw new Error('Cannot load results page without base JSQL.');
    }

    if (!hasMore.value) {
      return null;
    }

    const cachedRows = pageCache.value.get(pageOffset);
    if (cachedRows) {
      return {
        rows: cachedRows,
        lastRow: hasMore.value ? null : pageOffset + cachedRows.length,
      };
    }

    const inflight = inflightRequests.value.get(pageOffset);
    if (inflight) {
      return await inflight;
    }

    try {
      isLoadingPage.value = true;
      activeRequests.value += 1;

      const request = (async () => {
        const { jsql, paging } = withPaging(baseJsql.value, pageSize.value, pageOffset);
        const response = await execute(jsql);

        if (!meta.value.length) {
          meta.value = response.meta;
        }

        pageCache.value.set(pageOffset, response.data);

        if (pageOffset === rows.value.length) {
          rows.value = rows.value.concat(response.data);
        }

        loadedRowCount.value = Math.max(loadedRowCount.value, pageOffset + response.data.length);

        if (paging.limit === 0 || response.data.length < paging.limit) {
          hasMore.value = false;
        }

        return {
          rows: response.data,
          lastRow: hasMore.value ? null : pageOffset + response.data.length,
        };
      })();

      inflightRequests.value.set(pageOffset, request);
      try {
        return await request;
      } finally {
        inflightRequests.value.delete(pageOffset);
      }
    } catch (error) {
      console.error('Failed to load query results page:', error);
      throw error;
    } finally {
      activeRequests.value = Math.max(0, activeRequests.value - 1);
      isLoadingPage.value = activeRequests.value > 0;
    }
  }

  return {
    results,
    rows,
    meta,
    pageSize,
    baseOffset,
    hasMore,
    isLoadingPage,
    loadedRowCount,
    requestVersion,
    reset,
    clear,
    loadPage,
  };
}
