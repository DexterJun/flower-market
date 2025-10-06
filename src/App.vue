<template>
  <div id="app">
    <div class="app-main">
      <router-view></router-view>
    </div>
    <van-tabbar route fixed placeholder>
      <van-tabbar-item replace to="/hymn" icon="music">诗歌集</van-tabbar-item>
      <van-tabbar-item replace to="/activity" icon="fire">活动</van-tabbar-item>
      <van-tabbar-item replace to="/gathering" icon="friends-o">聚会信息</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script lang="ts" setup>
// Vant 组件库通过 unplugin 自动导入，这里无需手动注册
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-main {
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 全局触控优化 */
html,
body {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

img {
  -webkit-user-drag: none;
}
</style>
