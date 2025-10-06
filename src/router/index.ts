import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/hymn",
    },
    {
      path: "/hymn",
      name: "Hymn",
      component: () => import("@/views/hymn/index.vue"),
      meta: {
        title: "青年团契诗歌集",
      },
    },
    {
      path: "/activity",
      name: "Activity",
      component: () => import("@/views/activity/index.vue"),
      meta: {
        title: "活动",
      },
    },
    {
      path: "/gathering",
      name: "Gathering",
      component: () => import("@/views/gathering/index.vue"),
      meta: {
        title: "聚会信息",
      },
    },
  ],
});

// 全局路由守卫，用于更新页面标题
router.beforeEach((to, from, next) => {
  // 更新页面标题
  document.title = (to.meta.title as string) || "";
  next();
});

export default router;
