<template>
  <div class="page">
    <div class="header">
      <div class="hero">
        <van-nav-bar title="聚会详情" left-text="返回" left-arrow @click-left="goBack" />
      </div>
    </div>

    <div v-if="loading" class="section">
      <van-skeleton title :row="6" :loading="loading" row-width="100%" />
    </div>

    <template v-else>
      <div v-if="records.length === 0">
        <van-empty description="暂无详情数据" />
      </div>

      <div v-else class="timeline">
        <div v-for="(rec, idx) in records" :key="rec.id" class="node" :class="{ alt: idx % 2 === 1 }">
          <div class="badge">{{ rec.date }}</div>

          <div class="card">
            <div class="section-title">
              <span class="dot"></span>
              本次聚会
            </div>

            <div class="row">
              <span class="label">🕊️ 主礼人</span>
              <span class="value">{{ rec.host || '—' }}</span>
            </div>

            <div class="row">
              <span class="label">📖 读经</span>
              <span class="value">{{ rec.bible || '—' }}</span>
            </div>

            <div class="row">
              <span class="label">🎵 诗歌</span>
              <div class="value chips">
                <span v-for="h in (rec.hymns || [])" :key="h" class="chip">{{ h }}</span>
              </div>
            </div>

            <div class="divider dotted"></div>

            <div class="section-title subtle">
              <span class="dot"></span>
              证道
            </div>

            <div class="row">
              <span class="label">👤 分享人</span>
              <span class="value">{{ rec.lession?.speaker || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">📝 题目</span>
              <span class="value">{{ rec.lession?.title || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">📖 经文</span>
              <span class="value">{{ rec.lession?.bible || '—' }}</span>
            </div>

            <van-collapse v-if="getPoints(rec).length > 0" v-model="activeNames" accordion class="collapse">
              <van-collapse-item :name="`p-${rec.id}`" :title="`提纲（${getPoints(rec).length}）`">
                <ul class="points-list">
                  <li v-for="(p, idx) in getPoints(rec)" :key="idx">{{ p }}</li>
                </ul>
              </van-collapse-item>
            </van-collapse>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Lession = {
  speaker?: string
  title?: string
  bible?: string
  points?: string[]
}

type RecordItem = {
  id: string
  date: string
  host: string
  hymns: string[]
  bible: string
  lession?: Lession
}

type TopicDetailBlock = {
  id: string
  topicId: string
  detail: RecordItem[]
}

type TopicListItem = {
  id: string
  topic: string
  time: string
}

const route = useRoute()
const router = useRouter()
const loading = ref<boolean>(false)
const records = ref<RecordItem[]>([])
const activeNames = ref<string | number | (string | number)[]>('')
const topicList = ref<TopicListItem[]>([])

const goBack = () => router.back()

const getPoints = (rec: RecordItem): string[] => {
  return rec.lession?.points ?? []
}

onMounted(async () => {
  const id = String(route.params.id || '')
  if (!id) return
  try {
    loading.value = true

    // 并行获取主题列表和详情数据
    const [topicListRes, detailRes] = await Promise.all([
      fetch('/api/meetingData/topicList.json'),
      fetch('/api/meetingData/topicDetail.json')
    ])

    if (!topicListRes.ok || !detailRes.ok) throw new Error('network')

    const [topicData, detailData] = await Promise.all([
      topicListRes.json(),
      detailRes.json()
    ])

    topicList.value = Array.isArray(topicData) ? topicData : []
    const block = (detailData || []).find((d: TopicDetailBlock) => d.topicId === id)
    records.value = block?.detail || []

    // 设置网页标题为本月主题
    const currentTopic = topicList.value.find(topic => topic.id === id)
    if (currentTopic) {
      const title = currentTopic.topic && currentTopic.topic.trim()
        ? currentTopic.topic
        : `${currentTopic.time}主题`
      document.title = title
    }
  } catch (e) {
    records.value = []
    topicList.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  padding-bottom: 80px;
}

.hero {
  background: linear-gradient(135deg, #eef2ff, #e0f2fe, #fef3c7);
  padding-bottom: 10px;
}

.header :deep(.van-nav-bar) {
  --van-nav-bar-background: transparent;
  --van-nav-bar-title-text-color: #0f172a;
}

.timeline {
  position: relative;
  padding: 12px 16px 24px 16px;
}

.node {
  position: relative;
  margin-bottom: 18px;
}

.node.alt .card {
  border-left-color: #c7d2fe;
}

.badge {
  position: relative;
  display: inline-block;
  margin-left: 8px;
  margin-bottom: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #0f172a;
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 999px;
}

.card {
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-left: 4px solid #bae6fd;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  backdrop-filter: saturate(1.2);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #111827;
  padding-bottom: 6px;
}

.section-title.subtle {
  color: #334155;
  font-weight: 600;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #60a5fa;
  display: inline-block;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}

.label {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.value {
  color: #0f172a;
  font-size: 14px;
  text-align: right;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  color: #334155;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 0;
}

.divider.dotted {
  background: repeating-linear-gradient(to right, #e5e7eb, #e5e7eb 6px, transparent 6px, transparent 10px);
  height: 1px;
}

.collapse :deep(.van-collapse-item__content) {
  background: #fbfdff;
}

.points-list {
  margin: 0;
  padding-left: 18px;
  color: #374151;
}

.points-list li {
  line-height: 1.6;
}
</style>
