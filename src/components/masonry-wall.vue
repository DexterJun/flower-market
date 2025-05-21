<template>
  <div class="masonry-wall" ref="container">
    <div class="masonry-wall-inner" :style="containerStyle">
      <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="masonry-column" :style="{
        width: `${columnWidth}px`,
        marginRight: columnIndex < columns.length - 1 ? `${gap}px` : '0'
      }">
        <div v-for="(item, itemIndex) in column" :key="getItemKey(item)" class="masonry-item"
          :style="{ marginBottom: `${gap}px` }">
          <slot :item="item" :index="itemIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

interface Props {
  items: any[];
  columnWidth: number;
  gap?: number;
  rtl?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  gap: 20,
  rtl: false
});

const container = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const columns = ref<any[][]>([]);

// 计算列数
const columnCount = computed(() => {
  if (!containerWidth.value || !props.columnWidth) return 1;
  return Math.floor((containerWidth.value + props.gap) / (props.columnWidth + props.gap));
});

// 计算容器样式
const containerStyle = computed(() => {
  const totalWidth = columnCount.value * props.columnWidth + (columnCount.value - 1) * props.gap;
  return {
    width: `${totalWidth}px`,
    margin: '0 auto',
    display: 'flex',
    gap: `${props.gap}px`
  };
});

// 获取项目的唯一键
const getItemKey = (item: any) => {
  return item.id || item.key || JSON.stringify(item);
};

// 重新计算列布局
const reflow = () => {
  if (!props.items.length) {
    columns.value = [];
    return;
  }

  const count = columnCount.value;
  const newColumns: any[][] = Array.from({ length: count }, () => []);

  // 计算每列的高度
  const columnHeights = new Array(count).fill(0);

  // 将每个项目放入高度最小的列中
  props.items.forEach((item) => {
    const minHeight = Math.min(...columnHeights);
    const columnIndex = columnHeights.indexOf(minHeight);
    newColumns[props.rtl ? count - 1 - columnIndex : columnIndex].push(item);
    columnHeights[columnIndex] += 1; // 这里可以根据实际图片高度调整
  });

  columns.value = newColumns;
};

// 更新容器宽度
const updateContainerWidth = () => {
  if (container.value) {
    containerWidth.value = container.value.offsetWidth;
  }
};

// 监听窗口大小变化
const handleResize = () => {
  updateContainerWidth();
};

// 监听属性变化
watch(() => props.items, reflow, { deep: true });
watch(() => props.columnWidth, reflow);
watch(() => containerWidth.value, reflow);
watch(() => props.rtl, reflow);

onMounted(() => {
  updateContainerWidth();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.masonry-wall {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.masonry-wall-inner {
  display: flex;
  flex-wrap: nowrap;
}

.masonry-column {
  display: flex;
  flex-direction: column;
}

.masonry-item {
  width: 100%;
}
</style>