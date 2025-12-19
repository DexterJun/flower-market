<template>
  <div class="drama-page">
    <!-- 顶部英雄区域 -->
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">起来建造</h1>
        <div class="hero-decoration">
          <span class="decoration-dot"></span>
          <span class="decoration-line"></span>
          <span class="decoration-dot"></span>
        </div>
      </div>
    </div>

    <!-- 视频区域 -->
    <div v-if="videoUrl" class="video-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon">🎬</span>
          精彩视频
        </h2>
      </div>
      <div class="video-container">
        <div class="video-wrapper">
          <video ref="videoElement" :src="videoUrl" class="drama-video" controls preload="auto" playsinline
            webkit-playsinline x5-playsinline x5-video-player-type="h5" x5-video-player-fullscreen="true"
            @loadstart="onVideoLoadStart" @progress="onVideoProgress" @waiting="onVideoWaiting"
            @canplay="onVideoCanPlay" @canplaythrough="onVideoCanPlayThrough" @playing="onVideoPlaying"
            @timeupdate="onVideoTimeUpdate" @seeked="onVideoSeeked" @error="onVideoError"></video>

          <!-- 缓冲进度条 -->
          <div v-if="buffering" class="buffering-overlay">
            <div class="buffering-content">
              <van-loading type="spinner" color="#ff6b9d" size="24px"></van-loading>
              <p class="buffering-text">正在缓冲中...</p>
              <p v-if="bufferedPercent > 0" class="buffered-percent">
                已缓冲 {{ Math.round(bufferedPercent) }}%
              </p>
            </div>
          </div>

          <!-- 缓冲进度指示器 -->
          <div v-if="bufferedPercent > 0 && bufferedPercent < 99.5 && !buffering" class="buffer-indicator">
            <div class="buffer-bar" :style="{ width: `${bufferedPercent}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="videoLoading" class="video-loading">
      <van-loading type="spinner" color="#ff6b9d">加载视频中...</van-loading>
    </div>

    <!-- 图片画廊区域 -->
    <div v-if="images.length" class="gallery-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon">📸</span>
          排练花絮
        </h2>
      </div>
      <div class="gallery-grid">
        <div v-for="(img, idx) in images" :key="idx" class="gallery-item" @click="openViewer(idx)">
          <img :src="img" :alt="`排练花絮 ${idx + 1}`" class="gallery-image" loading="lazy" />
          <div class="gallery-overlay">
            <span class="gallery-icon">🔍</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏图片预览 -->
    <MobileImageViewer v-model="showViewer" :images="images" :start-index="currentIndex" @change="onIndexChange" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
// @ts-ignore
import MobileImageViewer from '@/components/MobileImageViewer.vue'

// 动态导入所有图片
const imageModules = import.meta.glob('@/assets/drama_temp/*.jpg', { eager: true })
const images = computed(() => {
  return Object.values(imageModules).map((module: any) => module.default) as string[]
})

// 视频相关
const videoUrl = ref<string | null>(null)
const videoLoading = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)

// 缓冲相关
const buffering = ref(false)
const bufferedPercent = ref(0)
let bufferingTimer: number | null = null
let progressTimer: number | null = null

// 图片预览
const showViewer = ref(false)
const currentIndex = ref(0)

const openViewer = (idx: number) => {
  currentIndex.value = idx
  showViewer.value = true
}

const onIndexChange = (i: number) => {
  currentIndex.value = i
}

// 更新缓冲进度
const updateBufferedProgress = () => {
  if (!videoElement.value) return

  const video = videoElement.value
  if (video.buffered.length > 0 && video.duration > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    bufferedPercent.value = (bufferedEnd / video.duration) * 100
  }
}

// 视频事件处理
const onVideoLoadStart = () => {
  buffering.value = true
  bufferedPercent.value = 0
}

const onVideoProgress = () => {
  updateBufferedProgress()
  // 如果正在播放，隐藏缓冲提示（静静地缓冲）
  if (videoElement.value && !videoElement.value.paused) {
    buffering.value = false
  }
}

const onVideoWaiting = () => {
  // 视频等待数据时，延迟显示缓冲提示（避免短暂卡顿也显示）
  if (bufferingTimer) {
    clearTimeout(bufferingTimer)
  }
  // 延迟500ms显示，如果还在等待才显示
  bufferingTimer = window.setTimeout(() => {
    if (videoElement.value && videoElement.value.readyState < 3) {
      // 只有在真正等待数据时才显示
      buffering.value = true
    }
  }, 500)
}

const onVideoCanPlay = () => {
  // 可以播放时，隐藏缓冲提示
  updateBufferedProgress()
  buffering.value = false
}

const onVideoCanPlayThrough = () => {
  // 可以流畅播放时隐藏缓冲提示
  buffering.value = false
  updateBufferedProgress()
}

const onVideoPlaying = () => {
  // 开始播放时，隐藏缓冲提示，静静地继续缓冲
  buffering.value = false
  updateBufferedProgress()
}

// 播放时间更新时，继续缓冲（静默，不显示提示）
const onVideoTimeUpdate = () => {
  updateBufferedProgress()
  // 播放时持续触发缓冲，但不显示提示
  if (videoElement.value && !videoElement.value.paused) {
    triggerBuffering()
    // 确保播放时不显示缓冲提示
    buffering.value = false
  }
}

// 跳转后继续缓冲
const onVideoSeeked = () => {
  updateBufferedProgress()
  // 跳转后立即触发缓冲
  if (videoElement.value) {
    triggerBuffering()
  }
}

const onVideoError = (e: Event) => {
  console.error('视频加载错误:', e)
  buffering.value = false
}

// 主动触发视频缓冲（持续缓冲直到整个视频下载完成）
let lastBufferingTrigger = 0
const triggerBuffering = () => {
  if (!videoElement.value || !videoElement.value.duration) return

  const video = videoElement.value
  const duration = video.duration

  // 限制触发频率，避免过于频繁
  const now = Date.now()
  if (now - lastBufferingTrigger < 500) return // 每500ms最多触发一次
  lastBufferingTrigger = now

  // 检查是否已经完全加载
  if (video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)

    // 如果已经缓冲到视频末尾，不需要继续触发
    if (bufferedEnd >= duration - 0.5) {
      console.log('✅ 视频已完全缓冲')
      return
    }
  }

  // 如果视频还没完全加载，持续触发缓冲
  if (video.readyState < 4) {
    // 通过读取 buffered 和 readyState 属性来触发浏览器继续加载
    // 浏览器会自动继续缓冲后续内容
    void video.buffered
    void video.readyState

    // 如果网络状态是空闲，尝试触发继续加载
    if (video.networkState === 1) { // NETWORK_IDLE - 网络空闲
      // 访问这些属性会触发浏览器继续预加载
      // 浏览器会根据 preload="auto" 继续加载后续内容
      void video.duration
      void video.buffered.length

      // 持续触发直到完全加载
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / duration) * 100
        console.log(`🔄 持续缓冲中... ${bufferedPercent.toFixed(1)}%`)
      }
    }
  } else {
    // readyState === 4 表示已经有足够的数据可以流畅播放
    // 但仍需检查是否完全下载
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      if (bufferedEnd < duration - 0.5) {
        // 继续缓冲剩余部分
        void video.buffered
        void video.networkState
      }
    }
  }
}

// 定期更新缓冲进度
const startProgressMonitoring = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
  progressTimer = window.setInterval(() => {
    if (videoElement.value) {
      updateBufferedProgress()

      const video = videoElement.value

      // 无论播放还是暂停，都持续触发缓冲，直到完全下载
      triggerBuffering()

      // 如果正在播放，静默缓冲（不显示提示）
      if (!video.paused) {
        // 播放时隐藏缓冲提示，静静地缓冲
        buffering.value = false
      } else {
        // 暂停时，检查是否在等待缓冲
        // 只有在真正等待数据时才显示提示
        if (video.readyState < 3 && video.networkState === 2) {
          // 网络正在加载但数据不足
          buffering.value = true
        } else {
          buffering.value = false
        }
      }
    }
  }, 500) // 每500ms检查一次，持续缓冲直到完成
}

// 检测网络连接速度并优化预加载
const optimizeVideoLoading = () => {
  if (!videoElement.value || !('connection' in navigator)) return

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (connection) {
    // 根据网络速度调整预加载策略
    const effectiveType = connection.effectiveType
    const downlink = connection.downlink || 10 // 默认假设10Mbps

    // 慢速网络：减少预加载
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1.5) {
      if (videoElement.value) {
        videoElement.value.preload = 'metadata'
      }
    } else {
      // 快速网络：启用自动预加载
      if (videoElement.value) {
        videoElement.value.preload = 'auto'
      }
    }
  }
}

// 获取视频链接
const fetchVideoUrl = async () => {
  try {
    videoLoading.value = true
    const res = await fetch('/api/drama/video')
    if (!res.ok) {
      throw new Error('获取视频失败')
    }
    const data = await res.json()
    if (data.success && data.videoUrl) {
      videoUrl.value = data.videoUrl
      // 视频URL设置后，优化加载策略并开始监控进度
      setTimeout(() => {
        optimizeVideoLoading()
        startProgressMonitoring()
      }, 1000)
    }
  } catch (error) {
    console.error('获取视频失败:', error)
  } finally {
    videoLoading.value = false
  }
}

onMounted(() => {
  fetchVideoUrl()
  // 设置页面标题
  document.title = '圣剧：起来建造'
})

onBeforeUnmount(() => {
  if (bufferingTimer) {
    clearTimeout(bufferingTimer)
  }
  if (progressTimer) {
    clearInterval(progressTimer)
  }
})
</script>

<style scoped>
.drama-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  padding-bottom: 80px;
}

/* 英雄区域 */
.hero-section {
  position: relative;
  height: 150px;
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #f8b500 50%, #ff6b9d 75%, #c44569 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  box-shadow: 0 8px 32px rgba(255, 107, 157, 0.3);
  margin-bottom: 24px;
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

.hero-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(ellipse at 20% 30%, rgba(255, 255, 255, 0.3) 0, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 255, 255, 0.2) 0, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.15) 0, transparent 60%);
  opacity: 0.8;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  color: #fff;
  text-align: center;
}

.hero-title {
  margin: 0;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  margin-bottom: 8px;
  background: linear-gradient(180deg, #fff 0%, #ffe0e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.95;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 500;
}

.hero-decoration {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.decoration-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
}

.decoration-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

/* 区域标题 */
.section-header {
  margin: 32px 16px 16px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #2d3436;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #ff6b9d, #f8b500);
  border-radius: 2px;
}

.title-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* 视频区域 */
.video-section {
  margin: 0 16px 24px;
}

.video-container {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.15);
  border: 2px solid rgba(255, 107, 157, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.video-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(255, 107, 157, 0.25);
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.drama-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

/* 缓冲覆盖层 */
.buffering-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
  pointer-events: none;
  /* 允许点击穿透到视频控件 */
}

.buffering-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
}

.buffering-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.buffered-percent {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

/* 缓冲进度指示器 */
.buffer-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 5;
}

.buffer-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #f8b500);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(255, 107, 157, 0.5);
}

.video-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  margin: 0 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 图片画廊 */
.gallery-section {
  margin: 0 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #f0f0f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.3);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-icon {
  font-size: 32px;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (min-width: 768px) {
  .hero-section {
    height: 240px;
  }

  .hero-title {
    font-size: 48px;
  }

  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .section-header {
    margin: 40px 24px 20px;
  }

  .video-section,
  .gallery-section {
    margin-left: 24px;
    margin-right: 24px;
  }
}

@media (min-width: 1024px) {
  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
