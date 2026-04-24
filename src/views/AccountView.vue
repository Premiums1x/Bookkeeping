<template>
  <section class="account-wrap">
    <h2>账本管理</h2>
    <el-card shadow="never" class="account-card">
      <div class="account-create">
        <el-input v-model.trim="newAccountName" maxlength="20" placeholder="账本名称，如：生活费账本" />
        <el-button type="primary" :loading="creating" @click="onCreateAccount">新增账本</el-button>
      </div>

      <div class="account-list">
        <div v-for="account in store.accounts" :key="account.id" class="account-item">
          <div class="account-meta">
            <strong>{{ account.name }}</strong>
            <p>
              账单 {{ account.recordsCount }} 条 · 预算 {{ formatCNY(account.budget) }} · 月份
              {{ account.month }}
            </p>
          </div>

          <div class="account-actions">
            <el-tag v-if="account.id === store.activeAccountId" type="success" effect="plain">当前账本</el-tag>
            <el-button v-else size="small" @click="onSwitch(account)">切换</el-button>
            <el-button text size="small" @click="onRename(account)">重命名账本</el-button>
            <el-popconfirm
              title="确认删除这个账本吗？账本下的账单会一起删除。"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="onDelete(account.id)"
            >
              <template #reference>
                <el-button text size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </el-card>

    <h2>预算设置</h2>
    <el-card shadow="never">
      <el-form label-position="top">
        <el-form-item label="每月预算（元）">
          <el-input-number v-model="draftBudget" :min="0" :step="1" :precision="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div class="budget-action">
        <el-button type="primary" :loading="savingBudget" @click="onSaveBudget">保存预算</el-button>
      </div>
      <p class="budget-hint">
        当前账本：{{ store.currentAccountName }} · 当前预算：{{ formatCNY(store.budget) }}
      </p>
    </el-card>

    <h2>安全设置</h2>
    <el-card shadow="never">
      <el-form label-position="top">
        <el-form-item label="旧密码">
          <el-input v-model="oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
      </el-form>
      <div class="security-actions">
        <el-button type="primary" :loading="changingPassword" @click="onChangePassword">修改密码</el-button>
        <el-button @click="onLogout">退出登录</el-button>
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useLedgerStore } from "../stores/ledger";
import { formatCNY } from "../utils/format";

const router = useRouter();
const store = useLedgerStore();
const draftBudget = ref(store.budget);
const savingBudget = ref(false);
const creating = ref(false);
const changingPassword = ref(false);
const newAccountName = ref("");
const oldPassword = ref("");
const newPassword = ref("");

watch(
  () => store.budget,
  (value) => {
    draftBudget.value = value;
  }
);

async function onSaveBudget() {
  if (savingBudget.value) return;
  savingBudget.value = true;
  try {
    await store.setBudget(draftBudget.value);
    ElMessage.success("预算已保存");
  } catch (error) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    savingBudget.value = false;
  }
}

async function onCreateAccount() {
  if (creating.value) return;
  creating.value = true;
  try {
    await store.createAccount({
      name: newAccountName.value
    });
    newAccountName.value = "";
    ElMessage.success("账本已创建并切换");
  } catch (error) {
    ElMessage.error(error.message || "创建失败");
  } finally {
    creating.value = false;
  }
}

async function onSwitch(account) {
  try {
    await store.setActiveAccount(account.id);
    ElMessage.success("已切换账本");
  } catch (error) {
    ElMessage.error(error.message || "切换失败");
  }
}

async function onRename(account) {
  try {
    const { value } = await ElMessageBox.prompt("请输入新的账本名称", "重命名账本", {
      inputValue: account.name,
      inputPlaceholder: "最多 20 字",
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: "请输入 1-20 字名称"
    });
    await store.renameAccount(account.id, value);
    ElMessage.success("账本名称已更新");
  } catch (error) {
    if (error === "cancel" || error === "close" || error?.action === "cancel" || error?.action === "close") return;
    ElMessage.error(error.message || "重命名失败");
  }
}

async function onDelete(id) {
  try {
    await store.removeAccount(id);
    ElMessage.success("账本已删除");
  } catch (error) {
    ElMessage.error(error.message || "删除失败");
  }
}

async function onChangePassword() {
  if (changingPassword.value) return;
  changingPassword.value = true;
  try {
    await store.changePassword(oldPassword.value, newPassword.value);
    oldPassword.value = "";
    newPassword.value = "";
    ElMessage.success("密码已更新");
  } catch (error) {
    ElMessage.error(error.message || "修改失败");
  } finally {
    changingPassword.value = false;
  }
}

async function onLogout() {
  try {
    await store.logout();
    ElMessage.success("已退出登录");
    router.replace("/login");
  } catch (error) {
    ElMessage.error(error.message || "退出失败");
  }
}
</script>
