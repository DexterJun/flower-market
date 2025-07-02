import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: () => import("@/views/flowers/index.vue"),
      meta: {
        title: "898 花卉市场",
      },
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
      path: "/hymn/detail",
      name: "HymnDetail",
      component: () => import("@/views/hymn/detailPage.vue"),
      meta: {
        title: "青年团契诗歌集",
      },
    },
    {
      path: "/hymn/manage",
      name: "HymnManage",
      component: () => import("@/views/hymn/manage.vue"),
      meta: {
        title: "诗歌集管理",
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
