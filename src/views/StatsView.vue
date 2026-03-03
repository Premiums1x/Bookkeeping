<template>
  <section class="stats-wrap">
    <h2>分类支出</h2>
    <div v-if="store.statsItems.length" class="stats-list">
      <el-card v-for="item in store.statsItems" :key="item.category" shadow="never">
        <div class="stat-head">
          <strong>{{ item.category }}</strong>
          <span>{{ formatCNY(item.amount) }} · {{ item.ratio }}%</span>
        </div>
        <el-progress :percentage="Math.max(6, item.ratio)" :show-text="false" :stroke-width="8" />
      </el-card>
    </div>
    <el-empty v-else description="本月暂无支出统计。" />
  </section>
</template>

<script setup>
import { useLedgerStore } from "../stores/ledger";
import { formatCNY } from "../utils/format";

const store = useLedgerStore();
</script>
