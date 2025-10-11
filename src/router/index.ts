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
        title: "通州堂师主之范团契",
      },
    },
    {
      path: "/hymn/:id",
      name: "HymnDetail",
      component: () => import("@/views/hymn/detail.vue"),
      meta: {
        title: "歌曲详情",
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
      path: "/activity/:id",
      name: "ActivityDetail",
      component: () => import("@/views/activity/detail.vue"),
      meta: {
        title: "活动详情",
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
    {
      path: "/gathering/:id",
      name: "GatheringDetail",
      component: () => import("@/views/gathering/detail.vue"),
      meta: {
        title: "聚会详情",
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
