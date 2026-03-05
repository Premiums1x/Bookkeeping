import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue")
    },
    {
      path: "/",
      component: () => import("../layouts/MainLayout.vue"),
      children: [
        { path: "", redirect: "/records" },
        { path: "records", name: "records", component: () => import("../views/RecordsView.vue") },
        { path: "stats", name: "stats", component: () => import("../views/StatsView.vue") },
        { path: "account", name: "account", component: () => import("../views/AccountView.vue") },
        { path: "me", name: "me", component: () => import("../views/MeView.vue") }
      ]
    },
    { path: "/:pathMatch(.*)*", redirect: "/records" }
  ]
});

export default router;
