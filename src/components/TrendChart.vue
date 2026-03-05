<template>
  <div ref="chartEl" class="trend-chart"></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { init, use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  trend: {
    type: Object,
    required: true
  }
});

const chartEl = ref(null);
let chartInstance = null;
let resizeObserver = null;

function buildOption() {
  const trend = props.trend || {};
  return {
    color: ["#3b82f6", "#ef4444", "#10b981"],
    tooltip: {
      trigger: "axis"
    },
    legend: {
      top: 0
    },
    grid: {
      left: 12,
      right: 12,
      top: 36,
      bottom: 12,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: trend.labels || [],
      boundaryGap: false
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: "#e5e7eb"
        }
      }
    },
    series: [
      {
        name: "收入",
        type: "line",
        smooth: true,
        data: trend.income || []
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        data: trend.expense || []
      },
      {
        name: "净额",
        type: "line",
        smooth: true,
        data: trend.net || []
      }
    ]
  };
}

function render() {
  if (!chartEl.value) return;
  if (!chartInstance) {
    chartInstance = init(chartEl.value);
  }
  chartInstance.setOption(buildOption(), true);
}

onMounted(async () => {
  await nextTick();
  render();
  resizeObserver = new ResizeObserver(() => {
    if (chartInstance) chartInstance.resize();
  });
  resizeObserver.observe(chartEl.value);
});

watch(
  () => props.trend,
  () => {
    render();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>
