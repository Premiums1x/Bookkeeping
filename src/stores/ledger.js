import { computed, ref } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import {
  changePassword as changePasswordApi,
  createAccount as createAccountApi,
  createRecord,
  deleteAccount as deleteAccountApi,
  deleteRecord,
  fetchAccounts,
  fetchLedger,
  fetchSession,
  login as loginApi,
  logout as logoutApi,
  renameAccount as renameAccountApi,
  register as registerApi,
  saveBudget,
  savePreferences,
  switchAccount as switchAccountApi,
  updateRecord
} from "../api/ledger";
import { formatMonthLabel, formatDay, isToday, isValidDate, isValidMonth, isoDate } from "../utils/date";

function typeFilterName(type) {
  if (type === "expense") return "支出";
  if (type === "income") return "收入";
  return "全部";
}

function dateFilterName(dateFilter, dateValue) {
  if (dateFilter === "today") return "今天";
  if (dateFilter === "last7") return "近7天";
  if (dateFilter === "custom" && dateValue) return dateValue;
  return "本月全部";
}

function normalizeDateInput(input) {
  const value = String(input || "").trim().toLowerCase();
  if (value === "all" || value === "全部") return { dateFilter: "all", dateValue: "" };
  if (value === "today" || value === "今天") return { dateFilter: "today", dateValue: "" };
  if (value === "7" || value === "week" || value === "近7天") return { dateFilter: "last7", dateValue: "" };
  if (isValidDate(value)) return { dateFilter: "custom", dateValue: value };
  return null;
}

export const useLedgerStore = defineStore("ledger", () => {
  const month = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const budget = ref(7000);
  const typeFilter = ref("all");
  const dateFilter = ref("today");
  const dateValue = ref("");
  const records = ref([]);
  const accounts = ref([]);
  const activeAccountId = ref("");
  const authenticated = ref(false);
  const sessionChecked = ref(false);
  const initialized = ref(false);

  const monthLabel = computed(() => formatMonthLabel(month.value));
  const typeFilterLabel = computed(() => typeFilterName(typeFilter.value));
  const dateFilterLabel = computed(() => dateFilterName(dateFilter.value, dateValue.value));
  const accountCount = computed(() => accounts.value.length);
  const currentAccountName = computed(() => {
    const current = accounts.value.find((item) => item.id === activeAccountId.value);
    return current?.name || "默认账户";
  });
  const currentUsername = computed(() => {
    const current = accounts.value.find((item) => item.id === activeAccountId.value);
    return current?.username || "";
  });

  const monthRecords = computed(() => {
    return records.value
      .filter((item) => item.date.startsWith(month.value))
      .sort((a, b) => (a.date === b.date ? b.id - a.id : b.date.localeCompare(a.date)));
  });

  const summaryIncome = computed(() => {
    return monthRecords.value
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  });

  const summaryExpense = computed(() => {
    return monthRecords.value
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  });

  const summaryRemain = computed(() => budget.value - summaryExpense.value);

  const budgetBarPercent = computed(() => {
    if (budget.value <= 0) return 0;
    return Math.min(100, Math.round((summaryExpense.value / budget.value) * 100));
  });

  const budgetUsageRate = computed(() => {
    if (budget.value <= 0) return summaryExpense.value > 0 ? 1 : 0;
    return summaryExpense.value / budget.value;
  });

  const budgetWarningLevel = computed(() => {
    if (budget.value <= 0) return summaryExpense.value > 0 ? "warning" : "safe";
    if (budgetUsageRate.value >= 1) return "danger";
    if (budgetUsageRate.value >= 0.9) return "warning";
    if (budgetUsageRate.value >= 0.75) return "attention";
    return "safe";
  });

  const budgetWarningText = computed(() => {
    if (budget.value <= 0) {
      return summaryExpense.value > 0 ? "尚未设置预算，建议先在“账户”页设置每月预算。" : "未设置预算。";
    }
    if (budgetWarningLevel.value === "danger") {
      const over = summaryExpense.value - budget.value;
      return `预算已超支 ${Math.round(over)} 元，请控制后续支出。`;
    }
    if (budgetWarningLevel.value === "warning") {
      return "预算使用已达 90%，进入高风险区间。";
    }
    if (budgetWarningLevel.value === "attention") {
      return "预算使用已超过 75%，建议关注支出节奏。";
    }
    return "预算状态良好。";
  });

  const trendSeries = computed(() => {
    const groupedByDate = new Map();
    monthRecords.value.forEach((item) => {
      const bucket = groupedByDate.get(item.date) || { income: 0, expense: 0 };
      if (item.type === "income") {
        bucket.income += Number(item.amount || 0);
      } else {
        bucket.expense += Number(item.amount || 0);
      }
      groupedByDate.set(item.date, bucket);
    });

    const dates = Array.from(groupedByDate.keys()).sort((a, b) => a.localeCompare(b));
    const labels = dates.map((date) => date.slice(5));
    const income = dates.map((date) => groupedByDate.get(date).income);
    const expense = dates.map((date) => groupedByDate.get(date).expense);
    const net = dates.map((date, index) => income[index] - expense[index]);

    return { dates, labels, income, expense, net };
  });

  const recordsAfterFilter = computed(() => {
    let list = monthRecords.value.slice();

    if (typeFilter.value !== "all") {
      list = list.filter((item) => item.type === typeFilter.value);
    }

    if (dateFilter.value === "today") {
      const today = isoDate(new Date());
      list = list.filter((item) => item.date === today);
    } else if (dateFilter.value === "last7") {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      list = list.filter((item) => {
        const date = new Date(`${item.date}T00:00:00`);
        return date >= start && date <= end;
      });
    } else if (dateFilter.value === "custom" && isValidDate(dateValue.value)) {
      list = list.filter((item) => item.date === dateValue.value);
    }

    return list;
  });

  const groupedRecords = computed(() => {
    const map = new Map();
    recordsAfterFilter.value.forEach((item) => {
      const arr = map.get(item.date) || [];
      arr.push(item);
      map.set(item.date, arr);
    });
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      dayLabel: formatDay(date),
      today: isToday(date),
      items,
      total: items.reduce((sum, it) => sum + (it.type === "expense" ? -it.amount : it.amount), 0)
    }));
  });

  const statsItems = computed(() => {
    const expenseRecords = monthRecords.value.filter((it) => it.type === "expense");
    const total = expenseRecords.reduce((acc, it) => acc + Number(it.amount || 0), 0);
    const bucket = new Map();
    expenseRecords.forEach((it) => {
      bucket.set(it.category, (bucket.get(it.category) || 0) + Number(it.amount || 0));
    });

    return Array.from(bucket.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        ratio: total > 0 ? Math.round((amount / total) * 100) : 0
      }));
  });

  function resetLedgerState() {
    month.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    budget.value = 7000;
    typeFilter.value = "all";
    dateFilter.value = "today";
    dateValue.value = "";
    records.value = [];
    accounts.value = [];
    activeAccountId.value = "";
    initialized.value = false;
  }

  function applySnapshot(snapshot) {
    month.value = snapshot.month || month.value;
    budget.value = Number(snapshot.budget || 0);
    typeFilter.value = snapshot.typeFilter || "all";
    dateFilter.value = snapshot.dateFilter || "today";
    dateValue.value = dateFilter.value === "custom" ? String(snapshot.dateValue || "") : "";
    records.value = Array.isArray(snapshot.records) ? snapshot.records : [];
    if (Array.isArray(snapshot.accounts)) {
      accounts.value = snapshot.accounts;
    }
    activeAccountId.value = String(snapshot.activeAccountId || snapshot.accountId || activeAccountId.value || "");
  }

  async function refreshLedger() {
    if (!authenticated.value) return null;
    const snapshot = await fetchLedger();
    applySnapshot(snapshot);
    return snapshot;
  }

  async function refreshAccounts() {
    const result = await fetchAccounts();
    accounts.value = Array.isArray(result.accounts) ? result.accounts : [];
    activeAccountId.value = String(result.activeAccountId || activeAccountId.value || "");
  }

  async function initialize() {
    if (initialized.value) return;
    if (!authenticated.value) throw new Error("请先登录。");
    await refreshLedger();
    initialized.value = true;
  }

  async function ensureSession() {
    if (sessionChecked.value) return authenticated.value;
    const session = await fetchSession();
    authenticated.value = Boolean(session?.authenticated);
    sessionChecked.value = true;
    if (!authenticated.value) {
      resetLedgerState();
      return false;
    }
    await initialize();
    return true;
  }

  async function login(payload) {
    const username = String(payload?.username || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    if (!username) throw new Error("请输入账号。");
    if (!password) throw new Error("请输入密码。");
    const snapshot = await loginApi({ username, password });
    authenticated.value = true;
    sessionChecked.value = true;
    applySnapshot(snapshot);
    initialized.value = true;
  }

  async function register(payload) {
    const name = String(payload?.name || "").trim().slice(0, 20);
    const username = String(payload?.username || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    if (!name) throw new Error("请输入账户名称。");
    if (!username) throw new Error("请输入账号。");
    if (password.length < 6) throw new Error("密码至少 6 位。");
    const snapshot = await registerApi({ name, username, password });
    authenticated.value = true;
    sessionChecked.value = true;
    applySnapshot(snapshot);
    initialized.value = true;
  }

  async function logout() {
    await logoutApi();
    authenticated.value = false;
    sessionChecked.value = true;
    resetLedgerState();
  }

  async function changePassword(oldPassword, newPassword) {
    const oldValue = String(oldPassword || "");
    const newValue = String(newPassword || "");
    if (!oldValue) throw new Error("请输入旧密码。");
    if (newValue.length < 6) throw new Error("新密码至少 6 位。");
    await changePasswordApi({ oldPassword: oldValue, newPassword: newValue });
  }

  async function updatePreferences(payload) {
    const next = await savePreferences(payload);
    month.value = next.month ?? month.value;
    typeFilter.value = next.typeFilter ?? typeFilter.value;
    dateFilter.value = next.dateFilter ?? dateFilter.value;
    dateValue.value = next.dateValue ?? dateValue.value;
  }

  async function setMonthFromInput(input) {
    const nextMonth = String(input || "").trim();
    if (!isValidMonth(nextMonth)) {
      throw new Error("格式错误，请输入 YYYY-MM，例如 2026-03");
    }
    await updatePreferences({ month: nextMonth });
  }

  async function setDateFilterFromInput(input) {
    const normalized = normalizeDateInput(input);
    if (!normalized) {
      throw new Error("输入无效，请使用 all / today / 7 / YYYY-MM-DD。");
    }
    await updatePreferences({ dateFilter: normalized.dateFilter, dateValue: normalized.dateValue });
  }

  async function setTypeFilter(nextType) {
    if (!["all", "expense", "income"].includes(nextType)) return;
    await updatePreferences({ typeFilter: nextType });
  }

  async function setBudget(nextBudget) {
    const value = Number(nextBudget);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("请输入有效预算（大于等于 0）。");
    }
    const result = await saveBudget({ budget: value });
    budget.value = Number(result.budget || 0);
  }

  async function addEntry(entry) {
    const payload = {
      type: entry.type === "income" ? "income" : "expense",
      amount: Number(entry.amount),
      category: String(entry.category || "").trim(),
      note: String(entry.note || "").trim(),
      date: String(entry.date || "")
    };

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) throw new Error("金额必须大于 0。");
    if (!payload.category) throw new Error("分类不能为空。");
    if (!isValidDate(payload.date)) throw new Error("请选择有效日期。");

    const record = await createRecord(payload);
    records.value.push(record);
    const nextMonth = record.date.slice(0, 7);
    if (nextMonth !== month.value) {
      await updatePreferences({ month: nextMonth });
    }
  }

  async function updateEntry(entry) {
    const id = entry.id;
    if (id === undefined || id === null || id === "") throw new Error("缺少账单 ID。");

    const payload = {
      type: entry.type === "income" ? "income" : "expense",
      amount: Number(entry.amount),
      category: String(entry.category || "").trim(),
      note: String(entry.note || "").trim(),
      date: String(entry.date || "")
    };

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) throw new Error("金额必须大于 0。");
    if (!payload.category) throw new Error("分类不能为空。");
    if (!isValidDate(payload.date)) throw new Error("请选择有效日期。");

    const updated = await updateRecord(id, payload);
    const index = records.value.findIndex((item) => String(item.id) === String(id));
    if (index >= 0) {
      records.value[index] = updated;
    } else {
      records.value.push(updated);
    }
  }

  async function removeEntry(id) {
    if (id === undefined || id === null || id === "") throw new Error("缺少账单 ID。");
    await deleteRecord(id);
    records.value = records.value.filter((item) => String(item.id) !== String(id));
  }

  async function createAccount(payload) {
    const name = String(payload?.name || "").trim().slice(0, 20);
    const username = String(payload?.username || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    if (!name) throw new Error("账户名称不能为空。");
    if (!username) throw new Error("账号不能为空。");
    if (password.length < 6) throw new Error("密码至少 6 位。");
    const snapshot = await createAccountApi({ name, username, password });
    authenticated.value = true;
    applySnapshot(snapshot);
    initialized.value = true;
  }

  async function renameAccount(id, name) {
    if (!id) throw new Error("缺少账户 ID。");
    const value = String(name || "").trim().slice(0, 20);
    if (!value) throw new Error("账户名称不能为空。");
    await renameAccountApi(id, { name: value });
    await refreshAccounts();
  }

  async function removeAccount(id) {
    if (!id) throw new Error("缺少账户 ID。");
    const snapshot = await deleteAccountApi(id);
    applySnapshot(snapshot);
  }

  async function setActiveAccount(id, password) {
    if (!id) throw new Error("缺少账户 ID。");
    const secret = String(password || "");
    if (!secret) throw new Error("切换账户需要输入密码。");
    const snapshot = await switchAccountApi({ accountId: id, password: secret });
    authenticated.value = true;
    applySnapshot(snapshot);
    initialized.value = true;
  }

  return {
    month,
    budget,
    typeFilter,
    dateFilter,
    dateValue,
    records,
    accounts,
    activeAccountId,
    authenticated,
    sessionChecked,
    initialized,
    monthLabel,
    typeFilterLabel,
    dateFilterLabel,
    accountCount,
    currentAccountName,
    currentUsername,
    monthRecords,
    summaryIncome,
    summaryExpense,
    summaryRemain,
    budgetBarPercent,
    budgetUsageRate,
    budgetWarningLevel,
    budgetWarningText,
    groupedRecords,
    statsItems,
    trendSeries,
    ensureSession,
    login,
    register,
    logout,
    changePassword,
    initialize,
    refreshLedger,
    setMonthFromInput,
    setDateFilterFromInput,
    setTypeFilter,
    setBudget,
    addEntry,
    updateEntry,
    removeEntry,
    createAccount,
    renameAccount,
    removeAccount,
    setActiveAccount
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLedgerStore, import.meta.hot));
}
