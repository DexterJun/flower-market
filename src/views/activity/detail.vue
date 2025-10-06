<template>
  <div class="page">
    <div v-if="loading" class="skeleton"><van-skeleton :row="6" :loading="loading" row-width="100%" /></div>

    <div v-else class="detail">
      <div class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <h1 class="title">{{ detail?.title }}</h1>
          <span class="date-badge">{{ detail?.date }}</span>
        </div>
      </div>

      <div class="divider">
        <span class="dot"></span>
        <span class="line"></span>
        <span class="dot"></span>
      </div>

      <div v-if="detail?.description" class="desc-card">
        <p class="desc">{{ detail?.description }}</p>
      </div>

      <div v-if="images.length" class="gallery-section">
        <h2 class="section-title">活动相册</h2>
        <div class="gallery-masonry">
          <img v-for="(img, idx) in images" :key="idx" :src="img" class="m-item" alt="image" loading="lazy"
            @click="openViewer(idx)" />
        </div>
      </div>

      <div v-if="videos.length" class="video-section">
        <h2 class="section-title">活动视频</h2>
        <div class="video-list">
          <div v-for="(vv, idx) in videos" :key="idx" class="video-card">
            <video :src="vv" class="video" controls preload="metadata"></video>
          </div>
        </div>
      </div>

      <!-- 全屏图片预览：替换为通用组件（支持双指缩放、下拉关闭、左右滑动） -->
      <MobileImageViewer v-model="showViewer" :images="images" :start-index="currentIndex" @change="onIndexChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
// @ts-ignore
import MobileImageViewer from '@/components/MobileImageViewer.vue'

type ActivityDetail = {
  id: string
  activityId: string
  title: string
  description?: string
  image: string[]
  video: string[]
  date: string
}

const route = useRoute()
const loading = ref<boolean>(false)
const detail = ref<ActivityDetail | null>(null)

const images = computed(() => (detail.value?.image ?? []))
const videos = computed(() => (detail.value?.video ?? []))

// 图片预览
const showViewer = ref(false)
const currentIndex = ref(0)
const currentImage = computed(() => images.value[currentIndex.value])

const openViewer = (idx: number) => {
  currentIndex.value = idx
  showViewer.value = true
}
const closeViewer = () => { showViewer.value = false }
const prevImage = () => { if (images.value.length) currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length }
const nextImage = () => { if (images.value.length) currentIndex.value = (currentIndex.value + 1) % images.value.length }
const onIndexChange = (i: number) => { currentIndex.value = i }

const onKeydown = (e: KeyboardEvent) => {
  if (!showViewer.value) return
  if (e.key === 'Escape') closeViewer()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

onMounted(async () => {
  const id = route.params.id as string
  if (!id) return

  try {
    loading.value = true
    const qs = new URLSearchParams({ id }).toString()
    const res = await fetch(`/api/activityDetail?${qs}`)
    if (!res.ok) throw new Error('network')
    const data: ActivityDetail = await res.json()
    detail.value = data
  } catch (e) {
    detail.value = null
  } finally {
    loading.value = false
  }
})

onMounted(() => { window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeydown) })
</script>

<style scoped>
.page {
  padding: 16px 16px 80px;
}

:root {
  --primary: #5b8cff;
  --accent: #ff7f7f;
}

.hero {
  position: relative;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #5b8cff 0%, #9b7bff 50%, #ff8fb1 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .08);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(ellipse at 20% 20%, rgba(255, 255, 255, .25) 0, transparent 40%), radial-gradient(ellipse at 80% 0, rgba(255, 255, 255, .16) 0, transparent 35%);
}

.hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  color: #fff;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  text-shadow: 0 2px 6px rgba(0, 0, 0, .18);
}

.date-badge {
  margin-top: 8px;
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .2);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, .35);
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0 10px;
}

.divider .line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(91, 140, 255, .5), transparent);
}

.divider .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5b8cff;
  box-shadow: 0 0 0 3px rgba(91, 140, 255, .15);
}

.desc-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, .06);
  border: 1px solid #f0f2f5;
}

.desc {
  margin: 0;
  color: #4a5568;
  line-height: 1.7;
}

.section-title {
  margin: 18px 2px 10px;
  font-size: 14px;
  color: #748094;
  font-weight: 700;
  letter-spacing: .5px;
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 48px;
  height: 3px;
  background: linear-gradient(90deg, #5b8cff, #9b7bff);
  border-radius: 3px;
}

.gallery-masonry {
  column-count: 2;
  column-gap: 10px;
}

.m-item {
  width: 100%;
  margin: 0 0 10px;
  break-inside: avoid;
  border-radius: 10px;
  background: #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .06);
  transition: transform .2s ease, box-shadow .2s ease;
}

.m-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .12);
}

@media (min-width: 768px) {
  .gallery-masonry {
    column-count: 3;
  }

  .hero {
    height: 160px;
  }

  .title {
    font-size: 24px;
  }
}

.video-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.video-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, .06);
  border: 1px solid #f0f2f5;
  overflow: hidden;
}

.video {
  width: 100%;
  background: #000;
  aspect-ratio: 16 / 9;
  display: block;
}

.skeleton {
  padding: 16px;
}

/* 全屏预览样式 */
.viewer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.viewer-image {
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  box-shadow: 0 6px 24px rgba(0, 0, 0, .5);
  border-radius: 8px;
}

.viewer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .15);
  border: 1px solid rgba(255, 255, 255, .35);
  color: #fff;
  font-size: 22px;
  line-height: 34px;
  text-align: center;
  cursor: pointer;
}

.viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .15);
  border: 1px solid rgba(255, 255, 255, .35);
  color: #fff;
  font-size: 26px;
  line-height: 38px;
  text-align: center;
  cursor: pointer;
}

.viewer-nav.prev {
  left: 12px;
}

.viewer-nav.next {
  right: 12px;
}

.viewer-indicator {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .15);
  border: 1px solid rgba(255, 255, 255, .35);
}
</style>
