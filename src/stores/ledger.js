import { computed, ref } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { createRecord, deleteRecord, fetchLedger, saveBudget, savePreferences, updateRecord } from "../api/ledger";
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
  const initialized = ref(false);

  const monthLabel = computed(() => formatMonthLabel(month.value));
  const typeFilterLabel = computed(() => typeFilterName(typeFilter.value));
  const dateFilterLabel = computed(() => dateFilterName(dateFilter.value, dateValue.value));

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

  async function initialize() {
    if (initialized.value) return;
    const snapshot = await fetchLedger();
    month.value = snapshot.month || month.value;
    budget.value = Number(snapshot.budget || 0);
    typeFilter.value = snapshot.typeFilter || "all";
    dateFilter.value = "today";
    dateValue.value = "";
    records.value = Array.isArray(snapshot.records) ? snapshot.records : [];
    initialized.value = true;
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

  return {
    month,
    budget,
    typeFilter,
    dateFilter,
    dateValue,
    records,
    initialized,
    monthLabel,
    typeFilterLabel,
    dateFilterLabel,
    monthRecords,
    summaryIncome,
    summaryExpense,
    summaryRemain,
    budgetBarPercent,
    groupedRecords,
    statsItems,
    initialize,
    setMonthFromInput,
    setDateFilterFromInput,
    setTypeFilter,
    setBudget,
    addEntry,
    updateEntry,
    removeEntry
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLedgerStore, import.meta.hot));
}
