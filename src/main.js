import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useLedgerStore } from "./stores/ledger";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();
const store = useLedgerStore(pinia);

router.beforeEach(async (to) => {
  await store.ensureSession();

  if (to.path === "/login") {
    if (store.authenticated) return "/records";
    return true;
  }

  if (!store.authenticated) {
    return "/login";
  }

  if (!store.initialized) {
    await store.initialize();
  }

  return true;
});

app.use(pinia);
app.use(router);
app.mount("#app");
