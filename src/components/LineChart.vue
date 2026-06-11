<template>
  <div class="chart-container" ref="containerRef">
    <svg :width="width" :height="height" class="line-chart">
      <!-- Grid Lines -->
      <g class="grid">
        <line v-for="i in 5" :key="`h-${i}`" x1="40" :y1="getY(i)" :x2="width - 10" :y2="getY(i)" stroke="#4c566a" stroke-dasharray="4" />
      </g>
      
      <!-- Axis -->
      <g class="axis">
        <line x1="40" :y1="height - 30" :x2="width - 10" :y2="height - 30" stroke="#d8dee9" />
        <line x1="40" y1="10" x2="40" :y2="height - 30" stroke="#d8dee9" />
      </g>

      <!-- Y Axis Labels -->
      <g class="y-labels">
        <text v-for="i in 5" :key="`yt-${i}`" x="35" :y="getY(i) + 4" fill="#88c0d0" font-size="10" text-anchor="end">
          {{ formatLabel(getLogValue(i)) }}
        </text>
      </g>

      <!-- Line Path -->
      <path v-if="history.length > 1" :d="linePath" fill="none" stroke="#a3be8c" stroke-width="2" />
      
      <!-- Data Points -->
      <circle v-for="(point, index) in history" :key="index" :cx="getPointX(index)" :cy="getPointY(point)" r="3" fill="#ebcb8b" />
    </svg>
    <div v-if="history.length === 0" class="empty-state">데이터를 수집 중입니다...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
});

const containerRef = ref(null);
const width = ref(600);
const height = ref(300);

// 화면 크기에 맞게 리사이징
const updateSize = () => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth;
    // 높이는 고정하거나 비율로 조정 가능
  }
};

onMounted(() => {
  updateSize();
  window.addEventListener('resize', updateSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSize);
});

// 값 매핑 로직 (history에는 이미 log10 값이 저장됨)
const minLog = computed(() => {
  if (props.history.length === 0) return 0;
  const minVal = Math.min(...props.history);
  return minVal <= 0 ? 0 : minVal;
});

const maxLog = computed(() => {
  if (props.history.length === 0) return 10;
  const maxVal = Math.max(...props.history);
  return Math.max(minLog.value + 2, maxVal * 1.1); // 최소 2스케일 차이는 두기, 위로 10% 여유
});

const logRange = computed(() => maxLog.value - minLog.value);

const getPointX = (index) => {
  const maxPoints = 60; // 60초 기준
  const usableWidth = width.value - 50;
  const step = usableWidth / (maxPoints - 1);
  return 40 + index * step;
};

const getPointY = (logValue) => {
  const usableHeight = height.value - 40;
  if (logRange.value === 0) return height.value - 30; // 바닥
  const ratio = (logValue - minLog.value) / logRange.value;
  return height.value - 30 - (ratio * usableHeight);
};

const getY = (i) => {
  // 1 to 5
  const ratio = (i - 1) / 4;
  const usableHeight = height.value - 40;
  return height.value - 30 - (ratio * usableHeight);
};

const getLogValue = (i) => {
  const ratio = (i - 1) / 4;
  return minLog.value + (ratio * logRange.value);
};

const formatLabel = (logVal) => {
  if (!Number.isFinite(logVal) || logVal <= 0) return '1';

  const exponent = Math.floor(logVal);
  if (exponent < 3) {
    const value = Math.pow(10, logVal);
    return value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1);
  }

  const mantissa = Math.pow(10, logVal - exponent);
  if (Math.abs(mantissa - 1) < 0.05) return `1e${exponent}`;
  return `${mantissa.toFixed(1)}e${exponent}`;
};

const linePath = computed(() => {
  if (props.history.length === 0) return '';
  return props.history.reduce((acc, logValue, index) => {
    const x = getPointX(index);
    const y = getPointY(logValue);
    if (index === 0) return `M ${x} ${y}`;
    return `${acc} L ${x} ${y}`;
  }, '');
});

</script>

<style scoped>
.chart-container {
  width: 100%;
  position: relative;
  background-color: #2e3440;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #88c0d0;
  font-size: 0.9rem;
}
</style>
