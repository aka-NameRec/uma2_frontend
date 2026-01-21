<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { sql, PostgreSQL, MySQL, SQLite, MSSQL, StandardSQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  modelValue: string;
  language: 'sql' | 'json';
  dialect?: 'generic' | 'postgres' | 'mysql' | 'sqlite' | 'mssql';
  readOnly?: boolean;
}

const props = withDefaults(defineProps<CodeEditorProps>(), {
  readOnly: false,
  dialect: 'generic',
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'run'): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);
const viewRef = ref<EditorView | null>(null);

const languageCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const themeCompartment = new Compartment();

function resolveSqlDialect(dialect: CodeEditorProps['dialect']) {
  switch (dialect) {
    case 'postgres':
      return PostgreSQL;
    case 'mysql':
      return MySQL;
    case 'sqlite':
      return SQLite;
    case 'mssql':
      return MSSQL;
    default:
      return StandardSQL;
  }
}

function resolveLanguage() {
  if (props.language === 'json') {
    return json();
  }

  return sql({ dialect: resolveSqlDialect(props.dialect) });
}

function resolveTheme() {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return prefersDark ? oneDark : [];
}

function createExtensions() {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    history(),
    keymap.of([
      indentWithTab,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    languageCompartment.of(resolveLanguage()),
    readOnlyCompartment.of(EditorState.readOnly.of(props.readOnly)),
    themeCompartment.of(resolveTheme()),
    keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        emit('run');
        return true;
      },
    }]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit('update:modelValue', update.state.doc.toString());
      }
    }),
  ];
}

onMounted(() => {
  if (!editorRef.value) {
    return;
  }

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions(),
  });

  viewRef.value = new EditorView({
    state,
    parent: editorRef.value,
  });
});

watch(() => props.modelValue, (value) => {
  const view = viewRef.value;
  if (!view) {
    return;
  }

  const current = view.state.doc.toString();
  if (current === value) {
    return;
  }

  view.dispatch({
    changes: { from: 0, to: current.length, insert: value },
  });
});

watch(() => [props.language, props.dialect], () => {
  const view = viewRef.value;
  if (!view) {
    return;
  }

  view.dispatch({
    effects: languageCompartment.reconfigure(resolveLanguage()),
  });
});

watch(() => props.readOnly, (value) => {
  const view = viewRef.value;
  if (!view) {
    return;
  }

  view.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(value)),
  });
});

onBeforeUnmount(() => {
  viewRef.value?.destroy();
  viewRef.value = null;
});
</script>

<template>
  <div class="code-editor h-full w-full" ref="editorRef" />
</template>

<style scoped>
.code-editor {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

:deep(.cm-editor) {
  height: 100%;
  max-height: 100%;
}

:deep(.cm-scroller) {
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.875rem;
  height: 100%;
  max-height: 100%;
  overflow: auto;
}

:deep(.cm-content) {
  min-height: 100%;
}
</style>
