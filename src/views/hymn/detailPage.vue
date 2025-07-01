<template>
  <div>
    <div class="detail-content" v-if="hymnData">
      <!-- 标题 -->
      <div class="title-container">
        <h2 class="hymn-title">{{ hymnData.filename }}</h2>
      </div>

      <!-- 图片容器 -->
      <div class="image-container">
        <img :src="hymnData.url" :alt="hymnData.filename" class="detail-image" />
      </div>

      <!-- 歌词 -->
      <div v-if="hymnData.detail?.lyrics" class="lyrics-container">
        <h3 class="section-title">歌词</h3>
        <div class="lyrics-content">{{ hymnData.detail.lyrics }}</div>
      </div>

      <!-- 音频播放器 -->
      <div v-if="hymnData.detail?.audio" class="audio-container">
        <h3 class="section-title">音频播放</h3>
        <div class="audio-player-wrapper">
          <audio :src="hymnData.detail.audio" controls preload="metadata" class="detail-audio"
            controlsList="nodownload nofullscreen noremoteplayback" @loadstart="onAudioLoadStart"
            @canplay="onAudioCanPlay" @error="onAudioError">
            您的浏览器不支持音频播放
          </audio>
        </div>
        <!-- iOS兼容性提示 -->
        <div class="audio-compatibility-note">
          <p>💡 在iOS设备上，音频播放器将使用系统原生样式以获得最佳性能和用户体验。</p>
        </div>
      </div>

      <!-- 活动列表 -->
      <div v-if="hymnData.detail?.events && hymnData.detail.events.length > 0" class="events-container">
        <h3 class="section-title">相关活动</h3>
        <div v-for="(event, eventIndex) in hymnData.detail.events" :key="eventIndex" class="event-item">
          <div class="event-info">
            <h4 class="event-name">{{ event.name }}</h4>
            <div class="event-date">{{ formatDate(event.date) }}</div>
            <div v-if="event.description" class="event-description">{{ event.description }}</div>
          </div>

          <!-- 视频播放器 -->
          <div v-if="event.videos && event.videos.length > 0" class="videos-container">
            <div v-for="(videoName, videoIndex) in event.videos" :key="videoIndex" class="video-item">
              <video :src="getVideoUrl(event, videoIndex)" controls preload="metadata" class="detail-video"
                controlsList="nodownload noremoteplayback" @loadstart="onVideoLoadStart(videoName)"
                @canplay="onVideoCanPlay(videoName)" @error="onVideoError(videoName, $event)">
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-text">{{ error }}</div>
      <button class="retry-button" @click="loadHymnDetail">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// @ts-ignore
import { imageApi } from '../../api/images';

interface EventItem {
  name: string;
  date: string;
  description?: string;
  videos?: string[];
  video_urls?: string[];
}

interface HymnData {
  id: string;
  filename: string;
  url: string;
  index: number;
  type: string;
  tag?: string;
  detail?: {
    title?: string;
    lyrics?: string;
    audio?: string;
    events?: EventItem[];
  };
}

// 路由
const router = useRouter();
const route = useRoute();

// 数据状态
const hymnData = ref<HymnData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性：是否有活动
const hasEvents = computed(() => {
  return hymnData.value?.detail?.events &&
    hymnData.value.detail.events.length > 0;
});

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (err) {
    return dateString;
  }
};

// 获取视频URL
const getVideoUrl = (event: EventItem, videoIndex: number) => {
  // 如果有video_urls字段，使用它
  if (event.video_urls && event.video_urls[videoIndex]) {
    return event.video_urls[videoIndex];
  }

  // 如果没有video_urls，返回空字符串，让视频显示错误
  return '';
};

// 加载诗歌详情
const loadHymnDetail = async () => {
  const id = route.query.id as string;

  if (!id) {
    error.value = '缺少 ID 参数';
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const data = await imageApi.getHymnDetail(id);
    hymnData.value = data;

    // 设置网页标题为文件名
    if (data.filename) {
      document.title = data.filename;
    }

  } catch (err) {
    error.value = '加载详情失败，请稍后重试';
    console.error('Error loading hymn detail:', err);
  } finally {
    loading.value = false;
  }
};

// 视频事件处理
const onVideoLoadStart = (videoName: string) => {
  console.log(`视频 ${videoName} 开始加载`);
};

const onVideoCanPlay = (videoName: string) => {
  console.log(`视频 ${videoName} 可以播放`);
};

const onVideoError = (videoName: string, event: Event) => {
  console.error(`视频 ${videoName} 加载失败:`, event);
  // 可以在这里添加错误提示
};

// 音频事件处理
const onAudioLoadStart = () => {
  console.log('音频开始加载');
};

const onAudioCanPlay = () => {
  console.log('音频可以播放');
};

const onAudioError = (event: Event) => {
  console.error('音频加载失败:', event);
  // 可以在这里添加错误提示
};

// 初始化
onMounted(() => {
  loadHymnDetail();
});
</script>

<style scoped>
.detail-content {
  max-width: 900px;
  margin: 20px auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeInUp 0.8s ease-out;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 标题容器样式 */
.title-container {
  padding: 25px 30px 20px 30px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.title-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.hymn-title {
  font-size: 32px;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  padding: 20px;
  box-sizing: border-box;
}

.detail-image {
  max-width: calc(100% - 40px);
  width: auto;
  height: auto;
  display: block;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  object-fit: contain;
}

.detail-image:hover {
  transform: scale(1.02);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}

/* 歌词容器样式 */
.lyrics-container {
  padding: 25px 30px;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
}

.section-title {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 18px 0;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 12px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.lyrics-content {
  background: linear-gradient(135deg, #f8f9ff, #fff8f8);
  padding: 25px;
  border-radius: 20px;
  white-space: pre-wrap;
  line-height: 2;
  color: #2c3e50;
  font-size: 16px;
  text-align: left;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.lyrics-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* 音频播放器样式 */
.audio-container {
  padding: 25px 30px;
  background: linear-gradient(to right, #fefeff, #ffffff);
}

.audio-player-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.audio-player-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

.audio-player-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
}

.detail-audio {
  width: 100%;
  max-width: 700px;
  height: 60px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  outline: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.detail-audio:focus {
  box-shadow: 0 12px 24px rgba(255, 255, 255, 0.4);
  transform: scale(1.02);
}

/* 桌面版WebKit样式（仅在支持的浏览器中生效） */
@supports (-webkit-appearance: none) {
  .detail-audio::-webkit-media-controls-panel {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 255, 0.95));
    border-radius: 14px;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
  }

  .detail-audio::-webkit-media-controls-timeline {
    background: linear-gradient(135deg, #a29bfe, #6c5ce7);
    border-radius: 8px;
    margin-left: 10px;
    height: 6px;
    box-shadow: 0 2px 8px rgba(108, 92, 231, 0.4);
  }

  .detail-audio::-webkit-media-controls-current-time-display,
  .detail-audio::-webkit-media-controls-time-remaining-display {
    color: #ffffff;
    font-weight: 600;
    text-shadow: 0 1px 3px rgba(69, 69, 69, 0.4);
    background: rgba(108, 92, 231, 0.3);
    border-radius: 8px;
    padding: 3px 8px;
    font-size: 12px;
    border: 1px solid rgba(162, 155, 254, 0.4);
    backdrop-filter: blur(5px);
  }

  /* 隐藏不需要的控件 */
  .detail-audio::-webkit-media-controls-download-button,
  .detail-audio::-webkit-media-controls-overflow-button,
  .detail-audio::-webkit-media-controls-overflow-menu-button,
  .detail-audio::-webkit-media-controls-toggle-closed-captions-button,
  .detail-audio::-webkit-media-controls-fullscreen-button,
  .detail-audio::-webkit-media-controls-picture-in-picture-button,
  .detail-audio::-webkit-media-controls-cast-button,
  .detail-audio::-webkit-media-controls-more-button {
    display: none !important;
    visibility: hidden !important;
  }

  /* 通用隐藏所有可能的更多按钮 */
  .detail-audio audio::-webkit-media-controls button[aria-label*="更多"],
  .detail-audio audio::-webkit-media-controls button[aria-label*="More"],
  .detail-audio audio::-webkit-media-controls button[title*="更多"],
  .detail-audio audio::-webkit-media-controls button[title*="More"],
  .detail-audio audio::-webkit-media-controls [role="button"]:last-child {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
  }
}

/* iOS专用样式 - iOS设备上使用原生控件 */
@media screen and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait),
screen and (-webkit-min-device-pixel-ratio: 2) and (orientation: landscape) {

  /* iOS设备检测 */
  @supports (-webkit-touch-callout: none) {
    .audio-player-wrapper {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 20px;
    }

    .detail-audio {
      height: 50px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.5);
      /* iOS上保持简洁的样式，不尝试自定义控件 */
    }

    /* iOS上移除hover效果，因为触摸设备没有hover */
    .audio-player-wrapper:hover {
      transform: none;
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
    }

    .detail-audio:focus {
      transform: none;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
  }
}

/* iPhone特定样式 */
@media only screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3),
only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2),
only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) {

  .audio-player-wrapper {
    padding: 15px;
    margin: 0 5px;
  }

  .detail-audio {
    height: 44px;
    /* iOS推荐的最小触摸目标高度 */
    max-width: 100%;
  }
}

/* iPad特定样式 */
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) {

  .audio-player-wrapper {
    padding: 25px;
  }

  .detail-audio {
    height: 55px;
  }
}

/* Safari浏览器特定样式（非iOS） */
@media not all and (hover: none) {
  @supports (-webkit-appearance: none) and (not (-webkit-touch-callout: none)) {

    /* 桌面Safari的增强样式 */
    .detail-audio::-webkit-media-controls-panel {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 255, 0.98));
      border-radius: 14px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
    }
  }
}

/* 活动容器样式 */
.events-container {
  padding: 25px 30px;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.event-item {
  margin-bottom: 25px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #ffffff, #f8f9ff);
  border-radius: 20px;
  border-left: 6px solid transparent;
  background-image: linear-gradient(135deg, #ffffff, #f8f9ff),
    linear-gradient(135deg, #667eea, #764ba2);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideInLeft 0.6s ease-out;
  animation-delay: calc(var(--delay, 0) * 0.1s);
}

.event-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.event-item:last-child {
  margin-bottom: 0;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-info {
  margin-bottom: 18px;
}

.event-name {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.event-date {
  font-size: 15px;
  color: #667eea;
  margin-bottom: 10px;
  font-weight: 600;
  display: inline-block;
  padding: 6px 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
}

.event-description {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
  padding: 8px 0;
}

/* 视频容器样式 */
.videos-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.video-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25);
  transition: all 0.4s ease;
  position: relative;
}

.video-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.35);
}

.detail-video {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  background: transparent;
}

.detail-video::-webkit-media-controls {
  background: transparent;
}

.detail-video::-webkit-media-controls-overlay-play-button {
  display: none;
}

.detail-video::-webkit-media-controls-overlay-enclosure {
  display: none;
}

.detail-video::-webkit-media-controls-start-playback-button {
  display: none;
}

/* 优化视频控件显示 */
.detail-video::-webkit-media-controls-enclosure {
  background: transparent;
}

.detail-video::-webkit-media-controls-overlay {
  display: none;
}

.detail-video:hover {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
}

.detail-video:focus {
  outline: 3px solid rgba(255, 255, 255, 0.6);
  outline-offset: 4px;
}

/* 视频播放器控件样式 */

/* 隐藏视频不需要的控件 */
.detail-video::-webkit-media-controls-download-button,
.detail-video::-webkit-media-controls-overflow-button {
  display: none;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 24px;
  margin: 20px auto;
  max-width: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border-radius: 24px;
  margin: 20px auto;
  max-width: 400px;
}

.error-text {
  color: white;
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.retry-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.retry-button:hover {
  background: white;
  color: #ff6b6b;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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

/* 移动端通用优化 */
@media screen and (max-width: 768px) {

  /* 触摸优化 */
  .retry-button {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
  }

  .detail-video,
  .detail-audio {
    touch-action: manipulation;
  }

  /* 滚动优化 */
  .lyrics-content {
    -webkit-overflow-scrolling: touch;
  }

  /* 阻止缩放 */
  .detail-content {
    touch-action: pan-y;
    margin: 10px;
    border-radius: 20px;
    max-width: calc(100% - 20px);
  }

  .title-container {
    padding: 20px 20px 16px 20px;
  }

  .hymn-title {
    font-size: 26px;
    line-height: 1.3;
  }

  .image-container {
    padding: 15px;
  }

  .detail-image {
    max-width: calc(100% - 30px);
  }

  .lyrics-container,
  .audio-container,
  .events-container {
    padding: 20px 15px;
  }

  .lyrics-content {
    font-size: 15px;
    padding: 20px;
    line-height: 1.8;
  }

  .event-item {
    padding: 18px 15px;
    margin-bottom: 20px;
  }

  .event-name {
    font-size: 18px;
  }

  .section-title {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .audio-player-wrapper {
    padding: 20px 15px;
  }

  .detail-audio {
    height: 55px;
    max-width: 100%;
  }

  .video-item {
    padding: 20px 15px;
  }

  .detail-video {
    width: 100%;
    height: auto;
    min-height: 200px;
  }

  .loading-container,
  .error-container {
    margin: 10px;
    padding: 30px 20px;
  }

  /* 优化音频播放器在移动端的显示 */
  .detail-audio::-webkit-media-controls-current-time-display,
  .detail-audio::-webkit-media-controls-time-remaining-display {
    font-size: 11px;
    padding: 2px 4px;
  }
}

@media screen and (max-width: 480px) {
  .detail-content {
    margin: 5px;
    border-radius: 16px;
  }

  .title-container {
    padding: 18px 15px 14px 15px;
  }

  .hymn-title {
    font-size: 20px;
    line-height: 1.2;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .event-name {
    font-size: 16px;
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .lyrics-container,
  .audio-container,
  .events-container {
    padding: 15px 12px;
  }

  .lyrics-content {
    font-size: 14px;
    padding: 15px;
    line-height: 1.7;
  }

  .event-item {
    padding: 15px 12px;
    margin-bottom: 15px;
  }

  .event-info {
    margin-bottom: 15px;
  }

  .event-date {
    font-size: 13px;
    padding: 4px 8px;
  }

  .event-description {
    font-size: 14px;
    line-height: 1.6;
  }

  .audio-player-wrapper {
    padding: 18px 12px;
  }

  .detail-audio {
    height: 48px;
    max-width: 100%;
  }

  .video-item {
    padding: 15px 10px;
  }

  .detail-video {
    min-height: 180px;
  }

  .image-container {
    padding: 10px;
  }

  .detail-image {
    max-width: calc(100% - 20px);
  }

  .loading-container,
  .error-container {
    margin: 5px;
    padding: 25px 15px;
  }

  .loading-text,
  .error-text {
    font-size: 14px;
  }

  .retry-button {
    padding: 10px 20px;
    font-size: 13px;
  }

  /* 进一步优化音频播放器 */
  .detail-audio::-webkit-media-controls-timeline {
    height: 5px;
    margin-left: 8px;
  }

  .detail-audio::-webkit-media-controls-current-time-display,
  .detail-audio::-webkit-media-controls-time-remaining-display {
    font-size: 10px;
    padding: 1px 3px;
  }
}

/* 超小屏幕适配 */
@media screen and (max-width: 360px) {
  .detail-content {
    margin: 2px;
    border-radius: 14px;
  }

  .title-container {
    padding: 15px 12px;
  }

  .hymn-title {
    font-size: 18px;
  }

  .section-title {
    font-size: 16px;
  }

  .lyrics-container,
  .audio-container,
  .events-container {
    padding: 12px 10px;
  }

  .lyrics-content {
    font-size: 13px;
    padding: 12px;
  }

  .audio-player-wrapper {
    padding: 15px 10px;
  }

  .detail-audio {
    height: 44px;
  }

  .video-item {
    padding: 12px 8px;
  }

  .detail-video {
    min-height: 160px;
  }

  .event-item {
    padding: 12px 10px;
  }

  .event-name {
    font-size: 15px;
  }

  .event-date {
    font-size: 12px;
  }

  .event-description {
    font-size: 13px;
  }
}

/* 横屏模式适配 */
@media screen and (max-height: 600px) and (orientation: landscape) {
  .detail-content {
    margin: 5px auto;
    max-height: 95vh;
    overflow-y: auto;
  }

  .title-container {
    padding: 15px 20px 12px 20px;
  }

  .hymn-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .lyrics-container,
  .audio-container,
  .events-container {
    padding: 15px 20px;
  }

  .lyrics-content {
    max-height: 200px;
    overflow-y: auto;
  }

  .audio-player-wrapper {
    padding: 15px 20px;
  }

  .detail-audio {
    height: 50px;
  }

  .video-item {
    padding: 15px 20px;
  }

  .detail-video {
    max-height: 300px;
  }
}

/* 触摸设备专用样式 */
@media (hover: none) and (pointer: coarse) {

  .event-item:hover,
  .audio-player-wrapper:hover,
  .video-item:hover {
    transform: none;
    box-shadow: initial;
  }

  .detail-image:hover {
    transform: none;
    box-shadow: initial;
  }

  .lyrics-content:hover {
    transform: none;
    box-shadow: initial;
  }

  /* 为触摸设备增加按下状态 */
  .retry-button:active {
    transform: scale(0.95);
  }
}

/* 音频兼容性提示样式 */
.audio-compatibility-note {
  margin-top: 15px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: none;
  /* 默认隐藏 */
}

.audio-compatibility-note p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  font-weight: 500;
}

/* 在iOS设备上显示兼容性提示 */
@supports (-webkit-touch-callout: none) {
  .audio-compatibility-note {
    display: block;
  }
}

/* 在移动设备上也显示提示 */
@media screen and (max-width: 768px) {
  .audio-compatibility-note {
    display: block;
    margin-top: 12px;
    padding: 10px 15px;
    font-size: 12px;
  }

  .audio-compatibility-note p {
    font-size: 12px;
  }
}
</style>