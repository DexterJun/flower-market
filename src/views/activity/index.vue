<template>
  <div class="page">
    <div class="header">
      <h1>活动</h1>
      <p class="subtitle">近期活动与记录</p>
    </div>

    <div class="card-list">
      <div v-for="item in list" :key="item.id" class="card" @click="goDetail(item.id)">
        <div class="cover">
          <img :src="item.image || defaultCover" alt="cover" />
        </div>
        <div class="content">
          <div class="title">{{ item.title }}</div>
          <div v-if="item.description" class="desc">{{ item.description }}</div>
          <div class="meta">{{ item.date }}</div>
        </div>
      </div>
    </div>

    <van-empty v-if="!loading && list.length === 0" description="暂无活动" />
    <div v-if="loading" class="skeleton"><van-skeleton :row="4" :loading="loading" row-width="100%" /></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type ActivityItem = {
  id: string
  title: string
  description?: string
  image?: string
  date: string
}

const router = useRouter()
const list = ref<ActivityItem[]>([])
const loading = ref<boolean>(false)
const defaultCover = '/image/default-cover.png'

const goDetail = (id: string) => {
  router.push({ name: 'ActivityDetail', params: { id } })
}

onMounted(async () => {
  try {
    loading.value = true
    const res = await fetch('/api/activityList')
    if (!res.ok) throw new Error('network')
    const data: ActivityItem[] = await res.json()
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    list.value = []
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
}

.subtitle {
  margin: 4px 0 12px;
  color: #666;
  font-size: 12px;
}

.card-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .06);
  cursor: pointer;
}

.cover {
  width: 100%;
  height: 180px;
  background: #f2f3f5;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content {
  padding: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.desc {
  margin-top: 6px;
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}

.meta {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}

.skeleton {
  padding: 16px;
}
</style>
