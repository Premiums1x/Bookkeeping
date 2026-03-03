<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px" destroy-on-close>
    <el-form label-position="top">
      <el-form-item label="类型">
        <el-select v-model="form.type">
          <el-option label="支出" value="expense" />
          <el-option label="收入" value="income" />
        </el-select>
      </el-form-item>
      <el-form-item label="金额">
        <el-input-number v-model="form.amount" :min="0.01" :step="1" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="分类">
        <el-input v-model.trim="form.category" maxlength="10" placeholder="如：餐饮/交通" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model.trim="form.note" maxlength="20" placeholder="可选" />
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">{{ submitLabel }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useLedgerStore } from "../stores/ledger";
import { isoDate } from "../utils/date";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: "create"
  },
  record: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["update:visible"]);
const store = useLedgerStore();
const submitting = ref(false);
const form = reactive({
  type: "expense",
  amount: null,
  category: "",
  note: "",
  date: isoDate(new Date())
});

const isEditMode = computed(() => props.mode === "edit");
const dialogTitle = computed(() => (isEditMode.value ? "编辑账单" : "新增账单"));
const submitLabel = computed(() => (isEditMode.value ? "保存修改" : "保存账单"));

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value)
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) fillForm();
  }
);

watch(
  () => props.record,
  () => {
    if (props.visible) fillForm();
  }
);

function fillForm() {
  if (isEditMode.value && props.record) {
    form.type = props.record.type === "income" ? "income" : "expense";
    form.amount = Number(props.record.amount || 0) || null;
    form.category = String(props.record.category || "");
    form.note = String(props.record.note || "");
    form.date = String(props.record.date || isoDate(new Date()));
    return;
  }
  form.type = "expense";
  form.amount = null;
  form.category = "";
  form.note = "";
  form.date = isoDate(new Date());
}

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    if (isEditMode.value) {
      await store.updateEntry({ id: props.record?.id, ...form });
      ElMessage.success("账单已更新");
    } else {
      await store.addEntry(form);
      ElMessage.success("账单已保存");
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    submitting.value = false;
  }
}
</script>
