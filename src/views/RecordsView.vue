<template>
  <div class="records-list">
    <template v-if="store.groupedRecords.length">
      <el-card v-for="group in store.groupedRecords" :key="group.date" class="day-group" shadow="never">
        <template #header>
          <div class="day-title">
            <span>{{ group.dayLabel }} <small v-if="group.today">今天</small></span>
            <strong class="day-total">{{ withSign(group.total) }}</strong>
          </div>
        </template>

        <div v-for="item in group.items" :key="item.id" class="record-item">
          <div class="record-meta">
            <h3>{{ displayTitle(item) }}</h3>
            <div class="record-subline">
              <el-tag :type="item.type === 'expense' ? 'warning' : 'success'" effect="plain" size="small">
                {{ item.type === "expense" ? "支出" : "收入" }}
              </el-tag>
              <span class="record-date">{{ item.date }}</span>
            </div>
          </div>
          <div class="record-right">
            <span :class="['record-amount', item.type]">
              {{ item.type === "expense" ? "-" : "+" }}{{ formatCNY(item.amount) }}
            </span>
            <div class="record-actions">
              <el-button text size="small" @click="onEdit(item)">编辑</el-button>
              <el-popconfirm title="确定删除这条账单吗？" confirm-button-text="删除" cancel-button-text="取消" @confirm="onDelete(item)">
                <template #reference>
                  <el-button text size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </el-card>
    </template>
    <el-empty v-else description="本月没有记录，点击底部 + 添加一笔。" />
  </div>

  <entry-dialog v-model:visible="editVisible" mode="edit" :record="editingRecord" />
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import EntryDialog from "../components/EntryDialog.vue";
import { useLedgerStore } from "../stores/ledger";
import { formatCNY, withSign } from "../utils/format";

const store = useLedgerStore();
const editVisible = ref(false);
const editingRecord = ref(null);

function onEdit(item) {
  editingRecord.value = { ...item };
  editVisible.value = true;
}

async function onDelete(item) {
  try {
    await store.removeEntry(item.id);
    ElMessage.success("已删除账单");
  } catch (error) {
    ElMessage.error(error.message || "删除失败");
  }
}

function displayTitle(item) {
  const category = String(item.category || "").trim();
  const note = String(item.note || "").trim();
  if (!note || note === category) return category || "未分类";
  return `${category} · ${note}`;
}
</script>
