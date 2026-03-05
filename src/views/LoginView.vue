<template>
  <main class="auth-scene">
    <section class="auth-card">
      <h1>日常账本登录</h1>
      <p class="auth-subtitle">每个账户拥有独立的账单、预算和统计数据</p>

      <el-tabs v-model="mode">
        <el-tab-pane label="登录" name="login">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="账号">
              <el-input v-model.trim="loginForm.username" placeholder="例如：demo" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
          </el-form>
          <el-button type="primary" :loading="submitting" style="width: 100%" @click="onLogin">登录</el-button>
          <p class="auth-hint">首次可用演示账号：demo / 123456</p>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="账户名称">
              <el-input v-model.trim="registerForm.name" maxlength="20" placeholder="例如：小明账本" />
            </el-form-item>
            <el-form-item label="账号">
              <el-input v-model.trim="registerForm.username" maxlength="20" placeholder="3-20位字母数字下划线" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" show-password placeholder="至少 6 位" />
            </el-form-item>
          </el-form>
          <el-button type="primary" :loading="submitting" style="width: 100%" @click="onRegister">注册并登录</el-button>
        </el-tab-pane>
      </el-tabs>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useLedgerStore } from "../stores/ledger";

const router = useRouter();
const store = useLedgerStore();
const mode = ref("login");
const submitting = ref(false);

const loginForm = reactive({
  username: "",
  password: ""
});

const registerForm = reactive({
  name: "",
  username: "",
  password: ""
});

async function onLogin() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await store.login(loginForm);
    ElMessage.success("登录成功");
    router.replace("/records");
  } catch (error) {
    ElMessage.error(error.message || "登录失败");
  } finally {
    submitting.value = false;
  }
}

async function onRegister() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await store.register(registerForm);
    ElMessage.success("注册成功，已自动登录");
    router.replace("/records");
  } catch (error) {
    ElMessage.error(error.message || "注册失败");
  } finally {
    submitting.value = false;
  }
}
</script>
