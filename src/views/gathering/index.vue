<template>
  <div class="page">
    <div class="header">
      <h1>聚会信息</h1>
      <p class="subtitle">每月主题与时间安排</p>
    </div>

    <div class="card-grid">
      <div v-for="item in topicList" :key="item.id" class="card" :class="themeClass(item.topic)"
        @click="goDetail(item.id)">
        <div class="time">{{ item.time }}</div>
        <div class="topic">{{ item.topic && item.topic.trim() ? item.topic : '自由主题' }}</div>
      </div>
    </div>

    <van-empty v-if="!loading && topicList.length === 0" description="暂无数据" />

    <div v-if="loading" class="skeleton">
      <van-skeleton :row="4" :loading="loading" row-width="100%" />
    </div>
  </div>

</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type TopicListItem = {
  id: string
  topic: string
  time: string
}

const router = useRouter()
const topicList = ref<TopicListItem[]>([])
const loading = ref<boolean>(false)

const themeClass = (topic: string) => {
  const key = (topic || '').trim()
  if (!key) return 'theme-free'
  if (key.includes('圣洁')) return 'theme-holy'
  if (key.includes('公义')) return 'theme-justice'
  if (key.includes('重生')) return 'theme-regenerate'
  if (key.includes('祷告')) return 'theme-prayer'
  if (key.includes('教会')) return 'theme-church'
  if (key.includes('末世')) return 'theme-endtime'
  if (key.includes('爱')) return 'theme-love'
  return 'theme-generic'
}

const goDetail = (id: string) => {
  router.push({ name: 'GatheringDetail', params: { id } })
}

onMounted(async () => {
  try {
    loading.value = true
    const res = await fetch('/api/meetingData/topicList.json')
    if (!res.ok) throw new Error('network')
    const data: TopicListItem[] = await res.json()
    topicList.value = Array.isArray(data) ? data : []
  } catch (e) {
    topicList.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  padding: 16px 16px 80px;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  margin: 4px 0 16px;
  color: #6b7280;
  font-size: 12px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card {
  cursor: pointer;
  border-radius: 12px;
  padding: 14px;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform .15s ease, box-shadow .15s ease;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.card:active {
  transform: scale(0.98);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0.0);
}

.time {
  font-size: 12px;
  color: #334155;
  opacity: .85;
}

.topic {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

/* 主题配色 */
.theme-free {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  color: #831843;
}

.theme-holy {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #3730a3;
}

.theme-justice {
  background: linear-gradient(135deg, #ecfeff, #cffafe);
  color: #115e59;
}

.theme-regenerate {
  background: linear-gradient(135deg, #ecfccb, #d9f99d);
  color: #3f6212;
}

.theme-prayer {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #5b21b6;
}

.theme-church {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.theme-endtime {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #991b1b;
}

.theme-love {
  background: linear-gradient(135deg, #ffe4e6, #fecdd3);
  color: #9f1239;
}

.theme-generic {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #0f172a;
}

.skeleton {
  padding: 12px;
}
</style>
