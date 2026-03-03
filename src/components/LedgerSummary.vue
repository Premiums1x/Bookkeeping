<template>
  <section class="summary-card">
    <p class="summary-label">本月支出</p>
    <p class="summary-main">{{ formatCNY(store.summaryExpense) }}</p>
    <div class="summary-grid">
      <div>
        <p class="sub-label">本月收入</p>
        <p class="sub-value">+{{ formatCNY(store.summaryIncome) }}</p>
      </div>
      <div>
        <p class="sub-label">预算剩余</p>
        <p class="sub-value">{{ formatCNY(store.summaryRemain) }}</p>
      </div>
    </div>
    <el-progress :percentage="store.budgetBarPercent" :show-text="false" :stroke-width="8" />
  </section>
</template>

<script setup>
import { useLedgerStore } from "../stores/ledger";
import { formatCNY } from "../utils/format";

const store = useLedgerStore();
</script>
