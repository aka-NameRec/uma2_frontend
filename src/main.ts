import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import App from './App.vue';
import './app/styles/main.css';

const app = createApp(App);

ModuleRegistry.registerModules([AllCommunityModule]);

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
