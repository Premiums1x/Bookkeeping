import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import RecordsView from "../views/RecordsView.vue";
import StatsView from "../views/StatsView.vue";
import AccountView from "../views/AccountView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MainLayout,
      children: [
        { path: "", redirect: "/records" },
        { path: "records", name: "records", component: RecordsView },
        { path: "stats", name: "stats", component: StatsView },
        { path: "account", name: "account", component: AccountView }
      ]
    }
  ]
});

export default router;
