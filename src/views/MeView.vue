<template>
  <section class="me-wrap">
    <h2>我的</h2>
    <el-card shadow="never">
      <p class="me-line"><strong>当前账户：</strong>{{ store.currentAccountName }}</p>
      <p class="me-line"><strong>登录账号：</strong>@{{ store.currentUsername }}</p>
      <p class="me-line"><strong>账户数量：</strong>{{ store.accountCount }}</p>
      <p class="me-line"><strong>本月账单：</strong>{{ store.monthRecords.length }} 条</p>
      <p class="me-line"><strong>本月支出：</strong>{{ formatCNY(store.summaryExpense) }}</p>
      <p class="me-line"><strong>预算状态：</strong>{{ store.budgetWarningText }}</p>
    </el-card>

    <el-card shadow="never" class="me-tip-card">
      <p class="me-tip-title">本地存储说明</p>
      <p class="me-tip-text">当前多账户数据保存在浏览器 localStorage，清理浏览器缓存会导致数据丢失。</p>
    </el-card>
  </section>
</template>

<script setup>
import { useLedgerStore } from "../stores/ledger";
import { formatCNY } from "../utils/format";

const store = useLedgerStore();
</script>
