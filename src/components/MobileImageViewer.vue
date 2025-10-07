<template>
  <div v-if="show" class="miv-overlay" @click.self="handleBackdropClick">
    <button class="miv-close" @click="emitClose">×</button>
    <div class="miv-stage" ref="stageRef">
      <!-- 只显示单张图片，不支持轮播 -->
      <div class="miv-single">
        <img :src="currentImage" class="miv-image" :style="singleImageStyle" draggable="false"
          @touchstart.passive="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd"
          @touchcancel="onTouchEnd" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'

interface Props {
  modelValue: boolean
  images: string[]
  startIndex?: number
  enableBackdropClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  startIndex: 0,
  enableBackdropClose: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'change', index: number): void
  (e: 'close'): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const currentIndex = ref(props.startIndex)
watch(() => props.startIndex, v => { if (typeof v === 'number') currentIndex.value = v })
watch(currentIndex, v => emit('change', v))

// 当前显示的图片
const currentImage = computed(() => {
  const images = props.images || []
  return images[currentIndex.value] || ''
})

// viewport / stage
const stageRef = ref<HTMLDivElement | null>(null)
const viewportWidth = ref<number>(window.innerWidth)
const viewportHeight = ref<number>(window.innerHeight)

const updateViewport = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

// scroll lock
const lockScroll = () => { document.body.style.overflow = 'hidden' }
const unlockScroll = () => { document.body.style.overflow = '' }

watch(show, v => { v ? lockScroll() : unlockScroll() })

// gestures state
type Point = { x: number; y: number }
const startTouches = ref<TouchList | null>(null)
const lastTouches = ref<TouchList | null>(null)
const isPinching = ref(false)
const baseScale = ref(1)
const pinchStartDistance = ref(0)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)

const maxScale = 3
const minScale = 1

const getDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const getCenter = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

const getTouchPoint = (t: Touch): Point => ({ x: t.clientX, y: t.clientY })

const resetTransform = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const onTouchStart = (e: TouchEvent) => {
  startTouches.value = e.touches
  lastTouches.value = e.touches
  if (e.touches.length === 2) {
    isPinching.value = true
    const p1 = getTouchPoint(e.touches[0])
    const p2 = getTouchPoint(e.touches[1])
    pinchStartDistance.value = getDistance(p1, p2)
    baseScale.value = scale.value
  }
}

const onTouchMove = (e: TouchEvent) => {
  if (!startTouches.value) return

  if (isPinching.value && e.touches.length === 2) {
    const p1 = getTouchPoint(e.touches[0])
    const p2 = getTouchPoint(e.touches[1])
    const dist = getDistance(p1, p2)
    const s = clamp((dist / (pinchStartDistance.value || 1)) * baseScale.value, minScale, maxScale)
    scale.value = s
    return
  }

  // one finger pan
  if (e.touches.length === 1 && lastTouches.value) {
    const prev = getTouchPoint(lastTouches.value[0])
    const curr = getTouchPoint(e.touches[0])
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y

    if (scale.value > 1.01) {
      // when zoomed, pan image
      translateX.value += dx
      translateY.value += dy
    } else {
      // when not zoomed, dy to close, dx to swipe
      translateY.value += dy
      translateX.value += dx
    }
  }

  lastTouches.value = e.touches
}

const onTouchEnd = (_e: TouchEvent) => {
  if (isPinching.value) {
    isPinching.value = false
    if (scale.value < 1) scale.value = 1
    return
  }

  // close on vertical pull when not zoomed
  if (scale.value <= 1.02 && Math.abs(translateY.value) > 120 && Math.abs(translateY.value) > Math.abs(translateX.value)) {
    emitClose()
    resetTransform()
    return
  }

  // reset transient transforms (for non-zoomed)
  if (scale.value <= 1.02) {
    translateX.value = 0
    translateY.value = 0
  } else {
    // clamp translate so image stays roughly on screen
    const maxTranslateX = viewportWidth.value * (scale.value - 1) * 0.5 + 40
    const maxTranslateY = viewportHeight.value * (scale.value - 1) * 0.5 + 40
    translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX)
    translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY)
  }
}

const emitClose = () => {
  show.value = false
  emit('close')
}


const handleBackdropClick = () => {
  if (props.enableBackdropClose) emitClose()
}

const images = computed(() => props.images || [])

const singleImageStyle = computed(() => ({
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
  transition: isPinching.value ? 'none' : 'transform .2s ease',
}))

onMounted(() => {
  window.addEventListener('resize', updateViewport)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
  unlockScroll()
})
</script>

<style scoped>
.miv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  touch-action: none;
  /* we handle pan and pinch ourselves */
}

.miv-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}


.miv-single {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.miv-image {
  max-width: 92vw;
  max-height: 86vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  backface-visibility: hidden;
}

.miv-close {
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
  z-index: 2;
}
</style>
