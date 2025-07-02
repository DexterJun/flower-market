<template>
  <div class="manage-page">
    <van-nav-bar title="诗歌管理" left-text="返回" left-arrow @click-left="$router.go(-1)" />

    <div class="manage-content">
      <van-form @submit="handleSubmit" ref="formRef">
        <van-cell-group inset>
          <van-field v-model="form.filename" name="filename" label="歌曲名称" placeholder="请输入歌曲名称"
            :rules="[{ required: true, message: '请输入歌曲名称' }]" />

          <van-field v-model="form.index" name="index" label="歌曲编号" placeholder="请输入歌曲编号" type="number"
            :rules="[{ required: true, message: '请输入歌曲编号' }]" />

          <van-field v-model="form.tag" name="tag" label="标签" placeholder="请输入标签" />

          <van-field v-model="form.detail.title" name="title" label="歌曲标题" placeholder="请输入歌曲标题" />

          <van-field v-model="form.detail.lyrics" name="lyrics" label="歌词" type="textarea" rows="6"
            placeholder="请输入歌词" />
        </van-cell-group>

        <!-- 歌谱上传 -->
        <van-cell-group inset title="歌谱">
          <van-uploader v-model="sheetMusicFiles" :after-read="handleSheetMusicUpload"
            :before-delete="handleSheetMusicDelete" accept="image/*" :max-count="1" upload-text="上传歌谱图片" />
        </van-cell-group>

        <!-- 音频上传 -->
        <van-cell-group inset title="音频文件">
          <van-uploader v-model="audioFiles" :after-read="handleAudioUpload" :before-delete="handleAudioDelete"
            accept="audio/mp3" :max-count="1" upload-text="上传音频（仅支持MP3）" />
        </van-cell-group>

        <!-- 事件管理 -->
        <van-cell-group inset title="事件管理">
          <div v-for="(event, index) in form.detail.events" :key="index" class="event-item">
            <van-cell-group>
              <van-field v-model="event.name" :name="`event_name_${index}`" label="事件名称" placeholder="请输入事件名称" />

              <van-field v-model="event.date" :name="`event_date_${index}`" label="事件日期" placeholder="请选择日期" readonly
                @click="showDatePicker(index)" />

              <van-field v-model="event.description" :name="`event_description_${index}`" label="事件描述" type="textarea"
                placeholder="请输入事件描述" />

              <!-- 视频上传 -->
              <van-cell title="视频文件">
                <van-uploader v-model="event.videoFiles" :after-read="(file) => handleVideoUpload(file, index)"
                  :before-delete="(file) => handleVideoDelete(file, index)" accept="video/mp4" multiple
                  upload-text="上传视频（仅支持MP4）" />
              </van-cell>

              <van-cell>
                <van-button type="danger" size="small" @click="removeEvent(index)" v-if="form.detail.events.length > 1">
                  删除事件
                </van-button>
              </van-cell>
            </van-cell-group>
          </div>

          <van-cell>
            <van-button type="primary" size="small" @click="addEvent">
              添加事件
            </van-button>
          </van-cell>
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            提交
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePickerModal" position="bottom">
      <van-date-picker v-model="currentDate" @confirm="confirmDate" @cancel="showDatePickerModal = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showSuccessToast, showFailToast, showLoadingToast, closeToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const audioFiles = ref([])
const sheetMusicFiles = ref([])
const showDatePickerModal = ref(false)
const currentDate = ref(['2024', '01', '01'])
const currentEventIndex = ref(0)

// 表单数据
const form = reactive({
  filename: '',
  index: '',
  type: 'jpg',
  tag: '',
  detail: {
    title: '',
    lyrics: '',
    audio: '',
    events: [
      {
        name: '',
        date: '',
        description: '',
        videos: [],
        videoFiles: []
      }
    ]
  }
})

// 添加事件
const addEvent = () => {
  form.detail.events.push({
    name: '',
    date: '',
    description: '',
    videos: [],
    videoFiles: []
  })
}

// 删除事件
const removeEvent = (index) => {
  form.detail.events.splice(index, 1)
}

// 显示日期选择器
const showDatePicker = (index) => {
  currentEventIndex.value = index
  showDatePickerModal.value = true
}

// 确认日期
const confirmDate = ({ selectedOptions }) => {
  const year = selectedOptions[0]?.value || '2024'
  const month = selectedOptions[1]?.value || '01'
  const day = selectedOptions[2]?.value || '01'
  form.detail.events[currentEventIndex.value].date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  showDatePickerModal.value = false
}

// 歌谱文件上传
const handleSheetMusicUpload = async (file) => {
  const loadingToast = showLoadingToast({
    message: '上传中...',
    forbidClick: true,
  })

  try {
    const formData = new FormData()
    formData.append('file', file.file)
    formData.append('type', 'image')
    formData.append('filename', form.filename)
    formData.append('index', form.index)

    const response = await fetch('/api/hymn/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      // 从返回结果中获取图片格式
      form.type = result.extension || result.filename.split('.').pop()
      showSuccessToast('歌谱上传成功')
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    showFailToast(error.message || '歌谱上传失败')
    // 移除上传失败的文件
    sheetMusicFiles.value = []
  } finally {
    closeToast()
  }
}

// 歌谱文件删除
const handleSheetMusicDelete = () => {
  form.type = 'jpg' // 重置为默认格式
  return true
}

// 音频文件上传
const handleAudioUpload = async (file) => {
  const loadingToast = showLoadingToast({
    message: '上传中...',
    forbidClick: true,
  })

  try {
    const formData = new FormData()
    formData.append('file', file.file)
    formData.append('type', 'audio')
    formData.append('filename', form.filename)

    const response = await fetch('/api/hymn/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      form.detail.audio = result.filename
      showSuccessToast('音频上传成功')
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    showFailToast(error.message || '音频上传失败')
    // 移除上传失败的文件
    audioFiles.value = []
  } finally {
    closeToast()
  }
}

// 音频文件删除
const handleAudioDelete = () => {
  form.detail.audio = ''
  return true
}

// 视频文件上传
const handleVideoUpload = async (file, eventIndex) => {
  const loadingToast = showLoadingToast({
    message: '上传中...',
    forbidClick: true,
  })

  try {
    const formData = new FormData()
    formData.append('file', file.file)
    formData.append('type', 'video')
    formData.append('filename', form.filename)

    const response = await fetch('/api/hymn/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      form.detail.events[eventIndex].videos.push(result.filename)
      showSuccessToast('视频上传成功')
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    showFailToast(error.message || '视频上传失败')
    // 移除上传失败的文件
    const event = form.detail.events[eventIndex]
    if (event.videoFiles && event.videoFiles.length > 0) {
      event.videoFiles.pop()
    }
  } finally {
    closeToast()
  }
}

// 视频文件删除
const handleVideoDelete = (file, eventIndex) => {
  const event = form.detail.events[eventIndex]
  const fileIndex = event.videoFiles.indexOf(file)
  if (fileIndex > -1 && event.videos && event.videos[fileIndex]) {
    event.videos.splice(fileIndex, 1)
  }
  return true
}

// 提交表单
const handleSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  const loadingToast = showLoadingToast({
    message: '提交中...',
    forbidClick: true,
  })

  try {
    // 清理事件数据，移除 videoFiles 字段
    const submitData = {
      ...form,
      detail: {
        ...form.detail,
        events: form.detail.events.map(event => ({
          name: event.name,
          date: event.date,
          description: event.description,
          videos: event.videos || []
        }))
      }
    }

    const response = await fetch('/api/hymn/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData)
    })

    const result = await response.json()

    if (result.success) {
      showSuccessToast('歌曲添加成功')
      // 重置表单
      Object.assign(form, {
        filename: '',
        index: '',
        type: 'jpg',
        tag: '',
        detail: {
          title: '',
          lyrics: '',
          audio: '',
          events: [
            {
              name: '',
              date: '',
              description: '',
              videos: [],
              videoFiles: []
            }
          ]
        }
      })
      audioFiles.value = []
      sheetMusicFiles.value = []
    } else {
      throw new Error(result.message || '提交失败')
    }
  } catch (error) {
    showFailToast(error.message || '提交失败')
  } finally {
    submitting.value = false
    closeToast()
  }
}
</script>

<style scoped>
.manage-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.manage-content {
  padding: 16px 0;
}

.event-item {
  margin-bottom: 16px;
  border-radius: 8px;
  background-color: white;
}

.event-item:last-child {
  margin-bottom: 0;
}
</style>
