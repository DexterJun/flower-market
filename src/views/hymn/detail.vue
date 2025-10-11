<template>
  <div class="hymn-detail-container">
    <!-- 现代化头部导航 -->
    <!-- <div class="modern-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <div class="back-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
          <span class="back-text">返回</span>
        </button>
        <div class="header-title">诗歌详情</div>
        <div class="header-spacer"></div>
      </div>
    </div> -->

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-card">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">正在加载诗歌详情...</div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div class="error-text">{{ error }}</div>
        <button class="retry-button" @click="loadDetail">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          重新加载
        </button>
      </div>
    </div>

    <!-- 详情内容 -->
    <div v-else-if="hymnDetail" class="detail-content">
      <!-- 诗歌标题卡片 -->
      <div class="title-card">
        <h1 class="hymn-title">{{ hymnDetail.detail.filename }}</h1>
        <div class="title-decoration"></div>
      </div>

      <!-- 歌谱图片卡片 -->
      <div class="image-card" v-if="hymnDetail.detail.hymnUrl">
        <div class="card-header">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            歌谱
          </div>
        </div>
        <div class="image-container" @click="showFullImage = true">
          <img :src="hymnDetail.detail.hymnUrl" :alt="hymnDetail.detail.filename" class="hymn-image" />
          <!-- <div class="image-overlay">
            <div class="zoom-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <div class="zoom-text">点击查看大图</div>
          </div> -->
        </div>
      </div>

      <!-- 音频播放器卡片 -->
      <div class="audio-card" v-if="hymnDetail.detail.audio && hymnDetail.detail.audio !== null">
        <div class="card-header">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            音频
          </div>
        </div>
        <div class="audio-container">
          <audio controls :src="hymnDetail.detail.audio" class="audio-player" preload="metadata">
            您的浏览器不支持音频播放
          </audio>
        </div>
      </div>

      <!-- 歌词卡片 -->
      <div class="lyrics-card" v-if="hymnDetail.detail.lyrics">
        <div class="card-header">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            歌词
          </div>
          <button class="copy-button" :class="{ success: copySuccess }" @click="copyLyrics" :disabled="copying">
            <svg v-if="!copying" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <div v-else class="copy-spinner"></div>
            <span class="copy-text">{{ copying ? '复制中...' : '复制歌词' }}</span>
          </button>
        </div>
        <div class="lyrics-content" v-html="formatLyrics(hymnDetail.detail.lyrics)"></div>
      </div>
    </div>

    <!-- 全屏图片查看 -->
    <MobileImageViewer v-model="showFullImage" :images="hymnDetail?.detail?.hymnUrl ? [hymnDetail.detail.hymnUrl] : []"
      :start-index="0" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// @ts-ignore
import MobileImageViewer from '@/components/MobileImageViewer.vue';

interface HymnDetail {
  id: string;
  hymnId: string;
  detail: {
    filename: string;
    index: number;
    type: string;
    audio: string;
    lyrics: string;
    hymnUrl?: string;
  };
}

const route = useRoute();
const router = useRouter();

const hymnDetail = ref<HymnDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showFullImage = ref(false);
const copying = ref(false);
const copySuccess = ref(false);

// 格式化歌词（处理换行符）
const formatLyrics = (lyrics: string) => {
  if (!lyrics) return '';
  return lyrics
    .replace(/\n/g, '<br/>')
    .replace(/\s/g, '&nbsp;');
};

// 加载详情
const loadDetail = async () => {
  const hymnId = route.params.id as string;

  if (!hymnId) {
    error.value = '缺少歌曲ID';
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await fetch(`/api/hymn/detail?id=${hymnId}`);

    if (!response.ok) {
      throw new Error('加载失败');
    }

    const data = await response.json();

    if (!data) {
      throw new Error('未找到该歌曲');
    }

    hymnDetail.value = data;

    // 设置页面标题为filename
    if (data?.detail?.filename) {
      document.title = data.detail.filename;
    }
  } catch (err: any) {
    error.value = err.message || '加载歌曲详情失败，请稍后重试';
    console.error('Error loading hymn detail:', err);
  } finally {
    loading.value = false;
  }
};

// 复制歌词功能
const copyLyrics = async () => {
  if (!hymnDetail.value?.detail?.lyrics || copying.value) return;

  copying.value = true;
  copySuccess.value = false;

  try {
    const lyricsText = hymnDetail.value.detail.lyrics;

    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(lyricsText);
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = lyricsText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('复制失败');
      }
    }

    copySuccess.value = true;

    // 显示成功提示
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);

  } catch (error) {
    console.error('复制失败:', error);

    // 显示错误提示
    alert('复制失败，请手动选择歌词内容进行复制');
  } finally {
    copying.value = false;
  }
};

// 返回
const goBack = () => {
  router.back();
};

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
/* 全局容器 */
.hymn-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  position: relative;
  overflow-x: hidden;
}

.hymn-detail-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(168, 237, 234, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(254, 214, 227, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 现代化头部导航 */
.modern-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 100;
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 12px 20px;
  border-radius: 50px;
  font-size: 16px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #4a5568;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-spacer {
  width: 120px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.loading-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #a8edea;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  animation-delay: -0.4s;
  border-top-color: #fed6e3;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  animation-delay: -0.8s;
  border-top-color: #ff9a9e;
}

.loading-text {
  color: #4a5568;
  font-size: 18px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 错误状态 */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.error-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.error-icon {
  color: #ff6b6b;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.error-text {
  color: #4a5568;
  font-size: 18px;
  margin-bottom: 32px;
  line-height: 1.6;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff9a9e, #fecfef);
  color: #4a5568;
  border: none;
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(255, 154, 158, 0.3);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 154, 158, 0.4);
}

/* 详情内容 */
.detail-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

/* 标题卡片 */
.title-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 12px 32px;
  text-align: center;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.title-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a8edea, #fed6e3, #ff9a9e, #fecfef);
  background-size: 200% 100%;
  animation: gradientShift 3s ease-in-out infinite;
}

.hymn-title {
  font-size: 30px;
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  line-height: 1.2;
}

.title-decoration {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #a8edea, #fed6e3);
  border-radius: 2px;
  margin: 0 auto;
}

/* 通用卡片样式 */
.image-card,
.audio-card,
.lyrics-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

.image-card:hover,
.audio-card:hover,
.lyrics-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  flex-wrap: nowrap;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #4a5568;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 图片卡片 */
.image-container {
  position: relative;
  padding: 24px 32px 32px;
  cursor: pointer;
}

.hymn-image {
  width: 100%;
  height: auto;
  border-radius: 16px;
  display: block;
  transition: all 0.3s ease;
}

.image-overlay {
  position: absolute;
  top: 24px;
  left: 32px;
  right: 32px;
  bottom: 32px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.image-container:hover .hymn-image {
  transform: scale(1.02);
}

.zoom-icon {
  color: white;
  margin-bottom: 8px;
}

.zoom-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 音频卡片 */
.audio-container {
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.audio-player {
  width: 100%;
  height: 60px;
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.audio-player:focus {
  outline: 2px solid rgba(168, 237, 234, 0.8);
  outline-offset: 2px;
}

/* 歌词卡片 */
.lyrics-content {
  padding: 24px 32px 32px;
  font-size: 18px;
  line-height: 2.2;
  color: #4a5568;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 复制按钮 */
.copy-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #a8edea, #fed6e3);
  border: none;
  padding: 10px 15px;
  border-radius: 50px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(168, 237, 234, 0.3);
}

.copy-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 237, 234, 0.4);
}

.copy-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.copy-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(74, 85, 104, 0.3);
  border-top: 2px solid #4a5568;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.copy-text {
  font-size: 14px;
}

/* 复制成功状态 */
.copy-button.success {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  animation: successPulse 0.6s ease-out;
}

/* 动画效果 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes audioWave {

  0%,
  100% {
    transform: scaleY(0.5);
  }

  50% {
    transform: scaleY(1);
  }
}

@keyframes gradientShift {

  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }

  .back-button {
    padding: 10px 16px;
    font-size: 14px;
  }

  .header-title {
    font-size: 18px;
  }

  .header-spacer {
    width: 80px;
  }

  .detail-content {
    padding: 20px 16px;
  }

  .title-card {
    padding: 13px 24px;
    margin-bottom: 24px;
  }

  .hymn-title {
    font-size: 24px;
  }

  .image-card,
  .audio-card,
  .lyrics-card {
    margin-bottom: 24px;
  }

  .card-header {
    padding: 20px 24px 12px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .card-title {
    font-size: 18px;
  }

  .image-container {
    padding: 20px 24px 24px;
  }

  .audio-container {
    padding: 10px 24px 24px;
  }

  .lyrics-content {
    padding: 10px 24px 24px;
    font-size: 16px;
    line-height: 2;
  }

  .copy-button {
    padding: 10px 15px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .loading-card,
  .error-card {
    padding: 32px 24px;
    margin: 0 16px;
  }

  .loading-text,
  .error-text {
    font-size: 16px;
  }
}

@media screen and (max-width: 480px) {
  .hymn-title {
    font-size: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .lyrics-content {
    font-size: 15px;
    line-height: 1.8;
  }
}
</style>
