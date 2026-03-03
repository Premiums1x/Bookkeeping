<template>
  <section class="account-wrap">
    <h2>账户设置</h2>
    <el-card shadow="never">
      <el-form label-position="top">
        <el-form-item label="每月预算（元）">
          <el-input-number v-model="draftBudget" :min="0" :step="1" :precision="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div class="budget-action">
        <el-button type="primary" :loading="saving" @click="onSave">保存预算</el-button>
      </div>
      <p class="budget-hint">当前预算：{{ formatCNY(store.budget) }}</p>
    </el-card>
  </section>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useLedgerStore } from "../stores/ledger";
import { formatCNY } from "../utils/format";

const store = useLedgerStore();
const draftBudget = ref(store.budget);
const saving = ref(false);

watch(
  () => store.budget,
  (value) => {
    draftBudget.value = value;
  }
);

async function onSave() {
  if (saving.value) return;
  saving.value = true;
  try {
    await store.setBudget(draftBudget.value);
    ElMessage.success("预算已保存");
  } catch (error) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>
