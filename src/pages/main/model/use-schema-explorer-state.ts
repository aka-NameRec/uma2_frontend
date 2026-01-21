import { onMounted, ref, watch } from 'vue';
import { umaClient } from '../../../shared/api/uma/client';
import type {
  EntityDetailsResponse,
  EntityListResponse,
} from '../../../shared/api/uma/types';

export function useSchemaExplorerIntegration() {
  const entities = ref<string[]>([]);
  const selectedEntity = ref<string | null>(null);
  const entityDetails = ref<EntityDetailsResponse | null>(null);
  const isLoadingEntities = ref<boolean>(false);
  const isLoadingEntityDetails = ref<boolean>(false);

  async function loadEntities() {
    try {
      isLoadingEntities.value = true;
      const response = await umaClient.post<EntityListResponse>('/uma/meta/entity_list', {});
      entities.value = response.entities;
      if (!selectedEntity.value && response.entities.length > 0) {
        selectedEntity.value = response.entities[0];
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load entity list: ${message}`);
    } finally {
      isLoadingEntities.value = false;
    }
  }

  async function loadEntityDetails(entityName: string) {
    try {
      isLoadingEntityDetails.value = true;
      entityDetails.value = await umaClient.post<EntityDetailsResponse>(
        '/uma/meta/entity_details',
        { entity_name: entityName }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load entity details: ${message}`);
    } finally {
      isLoadingEntityDetails.value = false;
    }
  }

  function handleSelectEntity(entityName: string) {
    selectedEntity.value = entityName;
  }

  watch(selectedEntity, async (entityName) => {
    if (!entityName) {
      entityDetails.value = null;
      return;
    }

    await loadEntityDetails(entityName);
  });

  onMounted(() => {
    void loadEntities();
  });

  return {
    entities,
    selectedEntity,
    entityDetails,
    isLoadingEntities,
    isLoadingEntityDetails,
    handleSelectEntity,
  };
}
