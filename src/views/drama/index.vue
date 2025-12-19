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
        <video 
          :src="videoUrl" 
          class="drama-video" 
          controls 
          preload="metadata"
          poster=""
        ></video>
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
        <div 
          v-for="(img, idx) in images" 
          :key="idx" 
          class="gallery-item"
          @click="openViewer(idx)"
        >
          <img 
            :src="img" 
            :alt="`排练花絮 ${idx + 1}`" 
            class="gallery-image"
            loading="lazy"
          />
          <div class="gallery-overlay">
            <span class="gallery-icon">🔍</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏图片预览 -->
    <MobileImageViewer 
      v-model="showViewer" 
      :images="images" 
      :start-index="currentIndex" 
      @change="onIndexChange" 
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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
  0%, 100% {
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

.drama-video {
  width: 100%;
  display: block;
  background: #000;
  aspect-ratio: 16 / 9;
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

