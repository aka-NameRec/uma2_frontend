<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useLocalStorage } from '../../lib/local-storage/use-local-storage';

interface SplitPaneProps {
  direction?: 'horizontal' | 'vertical';
  storageKey: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  handleSize?: number;
}

const props = withDefaults(defineProps<SplitPaneProps>(), {
  direction: 'horizontal',
  defaultSize: 50,
  minSize: 20,
  maxSize: 80,
  handleSize: 8,
});

const containerRef = ref<HTMLElement | null>(null);
const sizePercent = useLocalStorage<number>(props.storageKey, props.defaultSize);
const isDragging = ref(false);
const activeHandle = ref<HTMLElement | null>(null);

const normalizedSize = computed(() => {
  const value = typeof sizePercent.value === 'number' ? sizePercent.value : props.defaultSize;
  const min = Math.min(props.minSize, props.maxSize);
  const max = Math.max(props.minSize, props.maxSize);
  return Math.min(Math.max(value, min), max);
});

watch(normalizedSize, (value) => {
  if (sizePercent.value !== value) {
    sizePercent.value = value;
  }
});

const gridStyle = computed(() => {
  const size = normalizedSize.value;
  const handle = `${props.handleSize}px`;
  const start = `calc(${size}% - ${props.handleSize / 2}px)`;
  const end = `calc(${100 - size}% - ${props.handleSize / 2}px)`;

  if (props.direction === 'vertical') {
    return {
      gridTemplateRows: `${start} ${handle} ${end}`,
    };
  }

  return {
    gridTemplateColumns: `${start} ${handle} ${end}`,
  };
});

function updateSizeFromPointer(clientX: number, clientY: number) {
  const container = containerRef.value;
  if (!container) {
    return;
  }

  const rect = container.getBoundingClientRect();
  if (props.direction === 'vertical') {
    const offset = clientY - rect.top;
    const percent = (offset / rect.height) * 100;
    sizePercent.value = Math.min(Math.max(percent, props.minSize), props.maxSize);
    return;
  }

  const offset = clientX - rect.left;
  const percent = (offset / rect.width) * 100;
  sizePercent.value = Math.min(Math.max(percent, props.minSize), props.maxSize);
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0) {
    return;
  }

  const target = event.currentTarget as HTMLElement | null;
  activeHandle.value = target;
  target?.setPointerCapture(event.pointerId);
  isDragging.value = true;
  document.body.style.userSelect = 'none';
  updateSizeFromPointer(event.clientX, event.clientY);

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value) {
    return;
  }

  updateSizeFromPointer(event.clientX, event.clientY);
}

function handlePointerUp(event: PointerEvent) {
  activeHandle.value?.releasePointerCapture(event.pointerId);
  activeHandle.value = null;
  isDragging.value = false;
  document.body.style.userSelect = '';
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
}

function handleResetSize() {
  sizePercent.value = props.defaultSize;
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  document.body.style.userSelect = '';
});
</script>

<template>
  <div
    ref="containerRef"
    class="split-pane h-full w-full"
    :class="props.direction === 'vertical' ? 'split-vertical' : 'split-horizontal'"
    :style="gridStyle"
  >
    <div class="split-pane-start min-w-0 min-h-0">
      <slot name="start" />
    </div>
    <div
      class="split-pane-handle"
      :class="props.direction === 'vertical' ? 'handle-vertical' : 'handle-horizontal'"
      @pointerdown="handlePointerDown"
      @dblclick="handleResetSize"
    />
    <div class="split-pane-end min-w-0 min-h-0">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.split-pane {
  display: grid;
  min-height: 0;
  min-width: 0;
}

.split-pane-handle {
  background: rgba(148, 163, 184, 0.4);
  transition: background 0.15s ease;
}

.split-pane-handle:hover {
  background: rgba(148, 163, 184, 0.8);
}

.handle-horizontal {
  cursor: col-resize;
}

.handle-vertical {
  cursor: row-resize;
}

.split-pane-start,
.split-pane-end {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
</style>
