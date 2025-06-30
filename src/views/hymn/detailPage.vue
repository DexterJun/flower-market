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

      <!-- 视频播放器 -->
      <div v-if="hasVideo" class="video-container">
        <video ref="videoPlayer" :src="hymnData.detail?.video_file" controls preload="metadata" class="detail-video"
          @loadstart="onVideoLoadStart" @canplay="onVideoCanPlay" @error="onVideoError">
          您的浏览器不支持视频播放
        </video>
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
    video_file?: string;
  };
}

// 路由
const router = useRouter();
const route = useRoute();

// 数据状态
const hymnData = ref<HymnData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 视频播放器引用
const videoPlayer = ref<HTMLVideoElement | null>(null);

// 计算属性：是否有视频
const hasVideo = computed(() => {
  return hymnData.value?.detail?.video_file &&
    hymnData.value.detail.video_file.startsWith('http');
});



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

  } catch (err) {
    error.value = '加载详情失败，请稍后重试';
    console.error('Error loading hymn detail:', err);
  } finally {
    loading.value = false;
  }
};

// 视频事件处理
const onVideoLoadStart = () => {
  console.log('视频开始加载');
};

const onVideoCanPlay = () => {
  console.log('视频可以播放');
};

const onVideoError = (event: Event) => {
  console.error('视频加载失败:', event);
  // 可以在这里添加错误提示
};

// 初始化
onMounted(() => {
  loadHymnDetail();
});
</script>

<style scoped>
.detail-content {
  max-width: 800px;
  margin: 20px auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 标题容器样式 */
.title-container {
  padding: 30px 30px 20px 30px;
  text-align: center;
  border-bottom: 1px solid #eef2f7;
}

.hymn-title {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  background: #f8f9fa;
}

.detail-image {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 歌词容器样式 */
.lyrics-container {
  padding: 30px;
  border-bottom: 1px solid #eef2f7;
}

.section-title {
  font-size: 18px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-weight: 600;
  text-align: center;
}

.lyrics-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  white-space: pre-wrap;
  line-height: 1.8;
  color: #2c3e50;
  font-size: 15px;
  text-align: left;
}

/* 视频容器样式 */
.video-container {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 0 0 16px 16px;
}

.detail-video {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4a90e2;
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
  background: #4a90e2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #357abd;
  transform: translateY(-1px);
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

/* 移动端适配 */
@media screen and (max-width: 768px) {

  .detail-content {
    margin: 10px;
  }

  .title-container {
    padding: 20px 20px 15px 20px;
  }

  .hymn-title {
    font-size: 24px;
  }

  .lyrics-container {
    padding: 20px;
  }

  .lyrics-content {
    font-size: 14px;
    padding: 15px;
    line-height: 1.6;
  }

  .video-container {
    padding: 10px;
  }

  .section-title {
    font-size: 16px;
  }
}
</style>