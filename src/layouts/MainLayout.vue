<template>
  <main class="scene">
    <section class="phone">
      <header class="top-bar">
        <el-date-picker
          v-model="monthValue"
          class="month-picker"
          type="month"
          value-format="YYYY-MM"
          format="YYYY-MM"
          :editable="false"
          :clearable="false"
          @change="onMonthChange"
        />
        <h1 class="book-title">日常账本</h1>
        <span class="header-spacer" aria-hidden="true"></span>
      </header>

      <div class="filter-row">
        <el-radio-group :model-value="store.typeFilter" size="small" @change="onTypeChange">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="expense">支出</el-radio-button>
          <el-radio-button label="income">收入</el-radio-button>
        </el-radio-group>
        <div class="date-filter-tools">
          <el-select v-model="dateMode" class="date-mode-select" size="small" @change="onDateModeChange">
            <el-option v-for="item in dateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-date-picker
            v-if="dateMode === 'custom'"
            v-model="customDate"
            class="date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            placeholder="选择日期"
            @change="onCustomDateChange"
          />
        </div>
      </div>

      <section class="content">
        <ledger-summary />
        <div v-if="booting" class="loading-wrap">
          <el-skeleton animated :rows="5" />
        </div>
        <router-view v-else />
      </section>

      <nav class="tab-bar">
        <el-button class="tab-item" :class="{ active: isActive('/records') }" @click="go('/records')">账单</el-button>
        <el-button class="tab-item" :class="{ active: isActive('/stats') }" @click="go('/stats')">统计</el-button>
        <el-button class="add-item" @click="entryVisible = true">+</el-button>
        <el-button class="tab-item" :class="{ active: isActive('/account') }" @click="go('/account')">账户</el-button>
        <el-button class="tab-item" disabled>我的</el-button>
      </nav>
    </section>
  </main>

  <entry-dialog v-model:visible="entryVisible" />
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useLedgerStore } from "../stores/ledger";
import LedgerSummary from "../components/LedgerSummary.vue";
import EntryDialog from "../components/EntryDialog.vue";

const store = useLedgerStore();
const route = useRoute();
const router = useRouter();
const entryVisible = ref(false);
const booting = ref(true);
const dateMode = ref("all");
const customDate = ref("");
const monthValue = ref("");
const dateOptions = [
  { label: "今天", value: "today" },
  { label: "本月全部", value: "all" },
  { label: "近7天", value: "last7" },
  { label: "指定日期", value: "custom" }
];

onMounted(async () => {
  try {
    await store.initialize();
  } catch (error) {
    ElMessage.error(error.message || "初始化失败");
  } finally {
    booting.value = false;
  }
});

watch(
  () => store.month,
  (value) => {
    monthValue.value = value;
  },
  { immediate: true }
);

watch(
  () => [store.dateFilter, store.dateValue],
  ([filter, value]) => {
    dateMode.value = filter;
    customDate.value = filter === "custom" ? value : "";
  },
  { immediate: true }
);

function isActive(path) {
  return route.path === path;
}

function go(path) {
  if (route.path === path) return;
  router.push(path);
}

async function onTypeChange(value) {
  try {
    await store.setTypeFilter(value);
  } catch (error) {
    ElMessage.error(error.message || "类型切换失败");
  }
}

async function onDateModeChange(value) {
  try {
    if (value === "custom") {
      if (customDate.value) await store.setDateFilterFromInput(customDate.value);
      return;
    }
    if (value === "all") await store.setDateFilterFromInput("all");
    if (value === "today") await store.setDateFilterFromInput("today");
    if (value === "last7") await store.setDateFilterFromInput("7");
  } catch (error) {
    ElMessage.error(error.message || "日期筛选设置失败");
  }
}

async function onCustomDateChange(value) {
  if (!value) return;
  try {
    await store.setDateFilterFromInput(value);
  } catch (error) {
    ElMessage.error(error.message || "日期筛选设置失败");
  }
}

async function onMonthChange(value) {
  if (!value) return;
  try {
    await store.setMonthFromInput(value);
  } catch (error) {
    monthValue.value = store.month;
    ElMessage.error(error.message || "月份设置失败");
  }
}
</script>
