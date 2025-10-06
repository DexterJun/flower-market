<template>
  <div id="app">
    <div class="app-main">
      <router-view></router-view>
    </div>
    <van-tabbar route fixed placeholder class="app-tabbar">
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

/* TabBar 增强样式 */
.app-tabbar.van-tabbar {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.98) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.app-tabbar .van-tabbar-item--active .van-tabbar-item__text,
.app-tabbar .van-icon {
  color: #4a90e2;
}

.app-tabbar .van-tabbar-item--active .van-icon {
  color: #ff8a65;
}

/* 安全区适配：在 iOS 刘海屏下更舒适 */
.app-tabbar+* {
  padding-bottom: calc(env(safe-area-inset-bottom) + 4px);
}
</style>
