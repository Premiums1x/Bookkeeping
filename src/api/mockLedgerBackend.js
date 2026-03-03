import { isoDate, isValidDate, isValidMonth } from "../utils/date";

const STORAGE_KEY = "ledger-project-v2";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

function createDefaultState() {
  const now = new Date();
  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    budget: 7000,
    typeFilter: "all",
    dateFilter: "today",
    dateValue: "",
    records: [
      { id: 1, type: "expense", amount: 210, category: "餐饮", note: "午餐", date: daysAgo(1) },
      { id: 2, type: "expense", amount: 32, category: "交通", note: "地铁", date: daysAgo(1) },
      { id: 3, type: "expense", amount: 88, category: "餐饮", note: "晚餐", date: daysAgo(2) },
      { id: 4, type: "expense", amount: 199, category: "购物", note: "生活用品", date: daysAgo(4) },
      { id: 5, type: "income", amount: 8200, category: "工资", note: "月薪", date: daysAgo(7) }
    ]
  };
}

function parseBody(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    return { ...createDefaultState(), ...parsed, records: Array.isArray(parsed.records) ? parsed.records : [] };
  } catch {
    return createDefaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ok(config, data, status = 200) {
  return {
    data: { success: true, data },
    status,
    statusText: "OK",
    headers: {},
    config,
    request: {}
  };
}

function fail(config, message, status = 400) {
  return {
    data: { success: false, message },
    status,
    statusText: "Error",
    headers: {},
    config,
    request: {}
  };
}

function normalizePath(url) {
  if (!url) return "/";
  let value = url;
  if (/^https?:\/\//.test(url)) {
    const parsed = new URL(url);
    value = `${parsed.pathname}${parsed.search}`;
  }
  if (!value.startsWith("/")) value = `/${value}`;
  return value;
}

function normalizeDateFilter(next) {
  const value = String(next || "").trim().toLowerCase();
  if (value === "all" || value === "全部") return { dateFilter: "all", dateValue: "" };
  if (value === "today" || value === "今天") return { dateFilter: "today", dateValue: "" };
  if (value === "7" || value === "week" || value === "近7天") return { dateFilter: "last7", dateValue: "" };
  if (isValidDate(value)) return { dateFilter: "custom", dateValue: value };
  return null;
}

function findRecordIndexById(records, id) {
  return records.findIndex((item) => String(item.id) === String(id));
}

export async function mockLedgerAdapter(config) {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const method = String(config.method || "get").toLowerCase();
  const normalized = normalizePath(config.url);
  const [pathname, queryString = ""] = normalized.split("?");
  const path = pathname.replace(/^\/api/, "") || "/";
  const query = new URLSearchParams(queryString);
  const body = parseBody(config.data);
  const state = loadState();

  if (method === "get" && path === "/ledger") {
    return ok(config, state);
  }

  if (method === "get" && path === "/records") {
    const month = query.get("month") || "";
    const type = query.get("type") || "all";
    const dateFilter = query.get("dateFilter") || "all";
    const dateValue = query.get("dateValue") || "";
    let list = state.records.slice();

    if (month) list = list.filter((item) => item.date.startsWith(month));
    if (type === "expense" || type === "income") list = list.filter((item) => item.type === type);
    if (dateFilter === "today") {
      const today = isoDate(new Date());
      list = list.filter((item) => item.date === today);
    } else if (dateFilter === "last7") {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      list = list.filter((item) => {
        const date = new Date(`${item.date}T00:00:00`);
        return date >= start && date <= end;
      });
    } else if (dateFilter === "custom" && isValidDate(dateValue)) {
      list = list.filter((item) => item.date === dateValue);
    }

    list.sort((a, b) => (a.date === b.date ? b.id - a.id : b.date.localeCompare(a.date)));
    return ok(config, list);
  }

  if (method === "post" && path === "/records") {
    const amount = Number(body.amount);
    const category = String(body.category || "").trim();
    const note = String(body.note || "").trim();
    const date = String(body.date || "");
    const type = body.type === "income" ? "income" : "expense";

    if (!Number.isFinite(amount) || amount <= 0) return fail(config, "金额必须大于 0。");
    if (!category) return fail(config, "分类不能为空。");
    if (!isValidDate(date)) return fail(config, "日期格式无效。");

    const record = {
      id: Date.now(),
      type,
      amount,
      category,
      note,
      date
    };
    state.records.push(record);
    saveState(state);
    return ok(config, record, 201);
  }

  const recordMatch = path.match(/^\/records\/(.+)$/);
  if (recordMatch) {
    const id = recordMatch[1];
    const index = findRecordIndexById(state.records, id);
    if (index < 0) return fail(config, "未找到该账单记录。", 404);

    if (method === "put") {
      const amount = Number(body.amount);
      const category = String(body.category || "").trim();
      const note = String(body.note || "").trim();
      const date = String(body.date || "");
      const type = body.type === "income" ? "income" : "expense";

      if (!Number.isFinite(amount) || amount <= 0) return fail(config, "金额必须大于 0。");
      if (!category) return fail(config, "分类不能为空。");
      if (!isValidDate(date)) return fail(config, "日期格式无效。");

      const prev = state.records[index];
      const updated = {
        ...prev,
        type,
        amount,
        category,
        note,
        date
      };
      state.records[index] = updated;
      saveState(state);
      return ok(config, updated);
    }

    if (method === "delete") {
      const [removed] = state.records.splice(index, 1);
      saveState(state);
      return ok(config, removed);
    }
  }

  if (method === "put" && path === "/budget") {
    const budget = Number(body.budget);
    if (!Number.isFinite(budget) || budget < 0) return fail(config, "预算必须大于等于 0。");
    state.budget = budget;
    saveState(state);
    return ok(config, { budget: state.budget });
  }

  if (method === "put" && path === "/preferences") {
    if (body.month !== undefined) {
      if (!isValidMonth(body.month)) return fail(config, "月份格式错误，应为 YYYY-MM。");
      state.month = body.month;
    }
    if (body.typeFilter !== undefined) {
      const nextType = body.typeFilter;
      if (!["all", "expense", "income"].includes(nextType)) return fail(config, "类型筛选无效。");
      state.typeFilter = nextType;
    }
    if (body.dateInput !== undefined) {
      const parsed = normalizeDateFilter(body.dateInput);
      if (!parsed) return fail(config, "日期筛选输入无效。");
      state.dateFilter = parsed.dateFilter;
      state.dateValue = parsed.dateValue;
    }
    if (body.dateFilter !== undefined) {
      if (!["all", "today", "last7", "custom"].includes(body.dateFilter)) return fail(config, "日期筛选无效。");
      if (body.dateFilter === "custom" && !isValidDate(String(body.dateValue || ""))) {
        return fail(config, "自定义日期格式无效。");
      }
      state.dateFilter = body.dateFilter;
      state.dateValue = body.dateFilter === "custom" ? String(body.dateValue || "") : "";
    }
    saveState(state);
    return ok(config, {
      month: state.month,
      typeFilter: state.typeFilter,
      dateFilter: state.dateFilter,
      dateValue: state.dateValue
    });
  }

  if (method === "put" && path === "/ledger") {
    if (!body || typeof body !== "object") return fail(config, "请求体错误。");
    const next = { ...state, ...body };
    if (!isValidMonth(next.month)) return fail(config, "月份格式错误。");
    if (!Number.isFinite(Number(next.budget)) || Number(next.budget) < 0) return fail(config, "预算无效。");
    if (!Array.isArray(next.records)) return fail(config, "records 必须是数组。");
    saveState(next);
    return ok(config, next);
  }

  return fail(config, `未实现的接口：${method.toUpperCase()} ${path}`, 404);
}
