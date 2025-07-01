<template>
  <div class="page-container">
    <div class="search-container">
      <div class="search-box">
        <button class="menu-button" @click="showDrawer = true">
          <span class="menu-icon"></span>
        </button>
        <input type="text" v-model="searchQuery" placeholder="搜索诗歌名称..." class="search-input" />
        <button v-if="searchQuery" class="clear-button" @click="clearSearch">×</button>
      </div>
    </div>

    <div class="hymn-container">
      <masonry-wall :items="filteredHymnList" :column-width="columnWidth" :gap="10" :rtl="false">
        <template #default="{ item }">
          <div class="image-card">
            <img :src="item.url" :alt="item.filename" @load="onImageLoad" @click="handleItemClick(item)" />
            <div class="image-title">{{ item.filename }}</div>
            <div v-if="item.tag && item.tag.trim()" class="image-ribbon">
              <span class="ribbon-text">{{ item.tag }}</span>
            </div>
          </div>
        </template>
      </masonry-wall>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 加载更多状态 -->
      <div v-if="loadingMore" class="loading-more">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载更多...</div>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-container">
        <div class="error-text">{{ error }}</div>
        <button class="retry-button" @click="loadHymnList(true)">重试</button>
      </div>

      <!-- 没有更多数据提示 -->
      <div
        v-if="!loading && !loadingMore && hymnList.length > 0 && !(isSearching ? searchPagination.hasMore : pagination.hasMore)"
        class="no-more-data">
        没有更多数据了
      </div>
    </div>

    <!-- 侧边抽屉 -->
    <div class="drawer-overlay" v-if="showDrawer" @click="showDrawer = false"></div>
    <div class="drawer" :class="{ 'drawer-open': showDrawer }">
      <div class="drawer-header">
        <h2>目录</h2>
        <button class="drawer-close" @click="showDrawer = false">×</button>
      </div>
      <div class="drawer-content">
        <div v-for="item in catalog" :key="item.id" class="drawer-item" @click="scrollToItem(item)">
          {{ item.index }}. {{ item.filename }}
        </div>
      </div>
    </div>
  </div>

  <!-- 图片预览组件 -->
  <Teleport to="body">
    <div v-if="previewVisible" class="image-preview" :class="{ visible: previewVisible }" @click="closePreview">
      <div class="preview-content" :class="{ visible: previewVisible }">
        <img :src="currentPreviewImage" :alt="currentPreviewItem?.filename" @click.stop />
        <div class="preview-title">{{ currentPreviewItem?.filename }}</div>
        <button class="close-button" @click="closePreview">×</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
// @ts-ignore
import MasonryWall from '@/components/masonry-wall.vue';
// @ts-ignore
import { imageApi } from '../../api/images';

interface HymnItem {
  id: string;
  filename: string;
  url: string;
  lastModified: string;
  size: number;
  tag?: string;
}

interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  nextMarker: string | null;
}

// 路由
const router = useRouter();

// 搜索相关
const searchQuery = ref('');
const searchTimeout = ref<number | null>(null);

const clearSearch = () => {
  searchQuery.value = '';
  handleSearch();
};

// 处理搜索
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      await searchHymnList(searchQuery.value, true);
    } else {
      isSearching.value = false;
      await loadHymnList(true);
    }
  }, 300);
};

// 监听搜索输入
watch(searchQuery, handleSearch);

// 数据状态
const hymnList = ref<HymnItem[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const catalog = ref<any[]>([]);
const catalogLoading = ref(false);

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
  nextMarker: null
});

// 搜索状态
const isSearching = ref(false);
const searchPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
  nextMarker: null
});

// 获取图片列表
const loadHymnList = async (reset = false) => {
  try {
    if (reset) {
      loading.value = true;
      hymnList.value = [];
      pagination.value.current = 1;
      pagination.value.nextMarker = null;
    } else {
      loadingMore.value = true;
    }

    error.value = null;

    const data = await imageApi.getAllImages(
      pagination.value.current,
      pagination.value.pageSize,
      pagination.value.nextMarker
    );

    if (reset) {
      hymnList.value = data.images;
    } else {
      hymnList.value.push(...data.images);
    }

    pagination.value = {
      ...data.pagination,
      current: data.pagination.current + 1
    };

  } catch (err) {
    error.value = '加载图片失败，请稍后重试';
    console.error('Error loading hymn data:', err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 搜索图片
const searchHymnList = async (query: string, reset = false) => {
  if (!query.trim()) {
    isSearching.value = false;
    await loadHymnList(true);
    return;
  }

  try {
    if (reset) {
      isSearching.value = true;
      hymnList.value = [];
      searchPagination.value.current = 1;
      searchPagination.value.nextMarker = null;
    } else {
      loadingMore.value = true;
    }

    error.value = null;

    const data = await imageApi.searchImages(
      query,
      searchPagination.value.current,
      searchPagination.value.pageSize,
      searchPagination.value.nextMarker
    );

    if (reset) {
      hymnList.value = data.images;
    } else {
      hymnList.value.push(...data.images);
    }

    searchPagination.value = {
      ...data.pagination,
      current: data.pagination.current + 1
    };

  } catch (err) {
    error.value = '搜索图片失败，请稍后重试';
    console.error('Error searching hymns:', err);
  } finally {
    loadingMore.value = false;
  }
};

// 获取目录数据
const loadCatalog = async () => {
  try {
    catalogLoading.value = true;
    const catalogData = await imageApi.getContent();
    catalog.value = catalogData;
  } catch (err) {
    console.error('Error loading catalog:', err);
  } finally {
    catalogLoading.value = false;
  }
};

// 过滤后的列表 - 现在直接使用hymnList，因为搜索已经在API层面处理
const filteredHymnList = computed(() => {
  return hymnList.value;
});

const windowWidth = ref(window.innerWidth);
const previewVisible = ref(false);
const currentPreviewItem = ref<HymnItem | null>(null);
const currentPreviewImage = computed(() =>
  currentPreviewItem.value ? currentPreviewItem.value.url : ''
);

// 计算列宽
const columnWidth = computed(() => {
  const minColumns = 2; // 最小列数
  const maxColumns = 6; // 最大列数
  const minColumnWidth = 160; // 最小列宽
  const scrollbarWidth = 20; // 滚动条宽度
  const containerPadding = 40; // 容器左右内边距总和

  // 计算可用宽度
  const availableWidth = windowWidth.value - scrollbarWidth - containerPadding;

  // 计算最大可能的列数
  let columns = Math.floor(availableWidth / minColumnWidth);

  // 确保列数在最小和最大值之间
  columns = Math.max(minColumns, Math.min(columns, maxColumns));

  // 计算实际列宽
  return Math.floor((availableWidth - (columns - 1) * 20) / columns); // 20是列间距
});

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// 图片加载完成后触发重排
const onImageLoad = () => {
  // 瀑布流会自动处理重排
};

// 处理图片点击
const handleItemClick = (item: HymnItem) => {
  // 如果有tag，跳转到详情页面
  if (item.tag && item.tag.trim()) {
    router.push({
      name: 'HymnDetail',
      query: {
        id: item.id
      }
    });
  } else {
    // 如果没有tag，保持原有的预览逻辑
    openPreview(item);
  }
};

// 打开预览
const openPreview = (item: HymnItem) => {
  currentPreviewItem.value = item;
  previewVisible.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动
};

// 关闭预览
const closePreview = () => {
  previewVisible.value = false;
  document.body.style.overflow = ''; // 恢复背景滚动
};

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && previewVisible.value) {
    closePreview();
  }
};

// 抽屉状态
const showDrawer = ref(false);

// 排序后的列表 - 用于抽屉显示
const sortedHymnList = computed(() => {
  return [...hymnList.value].sort((a, b) => {
    const indexA = parseInt(a.id) || 0;
    const indexB = parseInt(b.id) || 0;
    return indexA - indexB;
  });
});

// 滚动到指定项
const scrollToItem = (item: HymnItem) => {
  showDrawer.value = false;
  searchQuery.value = item.filename;
};

// 无限滚动逻辑
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 当滚动到距离底部100px时触发加载
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMoreData();
  }
};

// 加载更多数据
const loadMoreData = async () => {
  if (loadingMore.value) return;

  const currentPagination = isSearching.value ? searchPagination.value : pagination.value;

  if (!currentPagination.hasMore) return;

  if (isSearching.value && searchQuery.value.trim()) {
    await searchHymnList(searchQuery.value, false);
  } else {
    await loadHymnList(false);
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('scroll', handleScroll);
  loadHymnList(true);
  loadCatalog();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('scroll', handleScroll);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style>
:root {
  --primary-color: #4a90e2;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --transition-fast: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-slow: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background-color: #f8f9fa;
}

.search-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
  backdrop-filter: blur(8px);
  z-index: 100;
  box-sizing: border-box;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 10px 35px 10px 15px;
  border: 2px solid #eef2f7;
  border-radius: 12px;
  font-size: 16px;
  box-sizing: border-box;
  min-width: 0;
  transition: all var(--transition-fast);
  color: #2c3e50;
  -webkit-text-size-adjust: 100%;
  touch-action: manipulation;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.search-input::placeholder {
  color: #a0aec0;
}

.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  transition: var(--transition-fast);
}

.clear-button:hover {
  color: #666;
  transform: translateY(-50%) scale(1.1);
}

.hymn-container {
  padding: 10px 10px;
  margin-top: 60px;
  width: 100%;
  box-sizing: border-box;
}

.hymn-container :deep(.masonry-wall) {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.image-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px var(--shadow-color);
  margin-bottom: 20px;
  cursor: pointer;
  transform: translateY(0);
  will-change: transform, box-shadow;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.image-card img {
  width: 100%;
  height: auto;
  display: block;
  transform: scale(1);
  will-change: transform;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
}

.image-card:hover img {
  transform: scale(1.05);
}

.image-title {
  padding: 12px;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2c3e50;
  font-weight: 500;
  transform: translateY(0);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-card:hover .image-title {
  transform: translateY(-2px);
}

/* 图片预览样式 */
.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, visibility;
}

.image-preview.visible {
  opacity: 1;
  visibility: visible;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  transform: scale(0.95);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, opacity;
}

.preview-content.visible {
  transform: scale(1);
  opacity: 1;
}

.preview-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-title {
  position: absolute;
  bottom: -40px;
  left: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  padding: 10px;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-button {
  position: absolute;
  top: -40px;
  right: -40px;
  color: #fff;
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  padding: 8px;
  transition: var(--transition-fast);
  opacity: 0.8;
}

.close-button:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .search-container {
    padding: 8px 12px;
  }

  .hymn-container {
    margin-top: 55px;
  }

  .search-box {
    max-width: 100%;
    gap: 8px;
  }

  .image-card {
    margin-bottom: 12px;
  }

  .menu-button {
    padding: 6px;
    /* 移动端稍微减小按钮内边距 */
  }

  .search-input {
    font-size: 16px;
    -webkit-appearance: none;
    appearance: none;
  }

  .preview-content {
    max-width: 95vw;
  }

  .close-button {
    top: -50px;
    right: 0;
  }

  .preview-title {
    bottom: -50px;
    font-size: 14px;
  }
}

/* 超窄屏幕适配 */
@media screen and (max-width: 360px) {
  .search-container {
    padding: 8px;
  }

  .hymn-container {
    padding: 8px;
  }

  .search-box {
    gap: 6px;
    /* 超窄屏进一步减小间距 */
  }

  .search-input {
    font-size: 16px;
    padding: 7px 30px 7px 10px;
  }

  .menu-button {
    padding: 4px;
  }
}

.menu-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  border-radius: 8px;
  transition: var(--transition-fast);
}

.menu-button:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  width: 20px;
  height: 2px;
  background-color: #2c3e50;
  position: relative;
}

.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background-color: #2c3e50;
  left: 0;
  transition: var(--transition-fast);
}

.menu-icon::before {
  top: -6px;
}

.menu-icon::after {
  bottom: -6px;
}

.menu-button:hover .menu-icon,
.menu-button:hover .menu-icon::before,
.menu-button:hover .menu-icon::after {
  background-color: var(--primary-color);
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 150;
  touch-action: none;
  backdrop-filter: blur(2px);
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  will-change: opacity;
}

.drawer-overlay.visible {
  opacity: 1;
}

.drawer {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0 20px var(--shadow-color);
  z-index: 200;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  overscroll-behavior: contain;
  touch-action: pan-y pinch-zoom;
  border-radius: 0 24px 24px 0;
  will-change: transform;
}

.drawer-open {
  transform: translateX(300px);
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h2 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: var(--transition-fast);
}

.drawer-close:hover {
  background-color: #f5f7fa;
  color: #666;
}

.drawer-content {
  padding: 16px;
  overflow-y: auto;
  height: calc(100vh - 165px);
  -webkit-overflow-scrolling: touch;
  /* 增加 iOS 滚动惯性 */
  overscroll-behavior: contain;
  /* 防止滚动传递 */
}

.drawer-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: var(--transition-fast);
  color: #2c3e50;
}

.drawer-item:hover {
  background-color: #f8f9fa;
  padding-left: 24px;
  color: var(--primary-color);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .drawer {
    width: 280px;
    left: -280px;
  }

  .drawer-open {
    transform: translateX(280px);
  }

  .drawer-item {
    padding: 10px;
    font-size: 14px;
  }
}

/* 超窄屏幕适配 */
@media screen and (max-width: 360px) {
  .drawer {
    width: 260px;
    left: -260px;
  }

  .drawer-open {
    transform: translateX(260px);
  }
}

/* 加载状态样式 */
.loading-container,
.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-more {
  padding: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
}

.retry-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition-fast);
}

.retry-button:hover {
  background: #357abd;
  transform: translateY(-1px);
}

/* 没有更多数据提示 */
.no-more-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #eef2f7;
  margin-top: 20px;
}

/* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 丝带标签样式 */
.image-ribbon {
  position: absolute;
  top: 12px;
  right: -15px;
  background: linear-gradient(45deg, var(--primary-color) 0%, #357abd 100%);
  color: white;
  padding: 6px 18px 6px 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transform: rotate(45deg);
  transform-origin: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 70px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-ribbon::before {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 0;
  border-left: 4px solid #2c5aa0;
  border-bottom: 4px solid transparent;
}

.image-ribbon::after {
  content: '';
  position: absolute;
  bottom: -4px;
  right: 0;
  width: 0;
  height: 0;
  border-right: 4px solid #2c5aa0;
  border-bottom: 4px solid transparent;
}

.ribbon-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.image-card:hover .image-ribbon {
  transform: rotate(45deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 移动端丝带适配 */
@media screen and (max-width: 768px) {
  .image-ribbon {
    top: 10px;
    right: -12px;
    padding: 3px 12px 3px 14px;
    font-size: 8px;
    min-width: 50px;
    transform: rotate(45deg);
    transform-origin: center;
    letter-spacing: 0.3px;
  }

  .ribbon-text {
    max-width: 55px;
  }
}

/* 超小屏幕丝带适配 */
@media screen and (max-width: 480px) {
  .image-ribbon {
    top: 8px;
    right: -10px;
    padding: 2px 10px 2px 12px;
    font-size: 7px;
    min-width: 45px;
    letter-spacing: 0.2px;
  }

  .ribbon-text {
    max-width: 45px;
  }
}
</style>
