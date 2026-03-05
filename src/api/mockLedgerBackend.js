import { isoDate, isValidDate, isValidMonth } from "../utils/date";

const STORAGE_KEY = "ledger-project-v4";
const LEGACY_KEYS = ["ledger-project-v3", "ledger-project-v2"];
const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;
const DEFAULT_PASSWORD = "123456";

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function toSafeName(value, fallback = "未命名账户") {
  return String(value || "").trim().slice(0, 20) || fallback;
}

function toSafePassword(value) {
  const password = String(value || "");
  return password.length >= 6 ? password : DEFAULT_PASSWORD;
}

function isValidTypeFilter(type) {
  return ["all", "expense", "income"].includes(type);
}

function isValidDateFilter(type) {
  return ["all", "today", "last7", "custom"].includes(type);
}

function normalizeRecord(raw, index) {
  const amount = Number(raw?.amount);
  const date = String(raw?.date || "");
  if (!Number.isFinite(amount) || amount <= 0 || !isValidDate(date)) return null;

  return {
    id: raw?.id ?? `${Date.now()}${index}`,
    type: raw?.type === "income" ? "income" : "expense",
    amount,
    category: String(raw?.category || "").trim() || "未分类",
    note: String(raw?.note || "").trim(),
    date
  };
}

function normalizeRecords(records) {
  return records.map((item, index) => normalizeRecord(item, index)).filter(Boolean);
}

function createSeedRecords() {
  return normalizeRecords([
    { id: 1, type: "expense", amount: 210, category: "餐饮", note: "午餐", date: daysAgo(1) },
    { id: 2, type: "expense", amount: 32, category: "交通", note: "地铁", date: daysAgo(1) },
    { id: 3, type: "expense", amount: 88, category: "餐饮", note: "晚餐", date: daysAgo(2) },
    { id: 4, type: "expense", amount: 199, category: "购物", note: "生活用品", date: daysAgo(4) },
    { id: 5, type: "income", amount: 8200, category: "工资", note: "月薪", date: daysAgo(7) }
  ]);
}

function buildUniqueUsername(input, index, used) {
  const fallbackBase = `user${Math.max(1, index + 1)}`;
  const rawBase = normalizeUsername(input);
  const base = USERNAME_RULE.test(rawBase) ? rawBase : fallbackBase;
  let candidate = base;
  let cursor = 1;
  while (used.has(candidate)) {
    cursor += 1;
    const suffix = String(cursor);
    candidate = `${base.slice(0, Math.max(1, 20 - suffix.length))}${suffix}`;
  }
  used.add(candidate);
  return candidate;
}

function createAccount(raw = {}, options = {}) {
  const now = new Date();
  const fallbackMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dateFilter = isValidDateFilter(raw.dateFilter) ? raw.dateFilter : "today";
  const dateValue = dateFilter === "custom" && isValidDate(String(raw.dateValue || "")) ? String(raw.dateValue) : "";

  return {
    id: String(raw.id || uid("acc")),
    name: toSafeName(raw.name, "未命名账户"),
    username: normalizeUsername(raw.username),
    password: toSafePassword(raw.password),
    month: isValidMonth(String(raw.month || "")) ? String(raw.month) : fallbackMonth,
    budget: Number.isFinite(Number(raw.budget)) && Number(raw.budget) >= 0 ? Number(raw.budget) : 7000,
    typeFilter: isValidTypeFilter(raw.typeFilter) ? raw.typeFilter : "all",
    dateFilter,
    dateValue,
    records: Array.isArray(raw.records) ? normalizeRecords(raw.records) : options.withSeedRecords ? createSeedRecords() : []
  };
}

function createDefaultState() {
  const account = createAccount(
    {
      name: "默认账户",
      username: "demo",
      password: DEFAULT_PASSWORD
    },
    { withSeedRecords: true }
  );
  return {
    activeAccountId: account.id,
    loggedInAccountId: "",
    accounts: [account]
  };
}

function sanitizeState(raw) {
  if (!raw || typeof raw !== "object") return createDefaultState();

  const sourceAccounts = Array.isArray(raw.accounts) ? raw.accounts : [];
  if (!sourceAccounts.length) return createDefaultState();

  const usedIds = new Set();
  const usedUsernames = new Set();
  const accounts = sourceAccounts.map((item, index) => {
    const account = createAccount(item, { withSeedRecords: false });
    if (usedIds.has(account.id)) {
      account.id = uid("acc");
    }
    usedIds.add(account.id);
    account.username = buildUniqueUsername(account.username, index, usedUsernames);
    account.password = toSafePassword(account.password);
    return account;
  });

  const activeAccountId = accounts.some((item) => item.id === raw.activeAccountId) ? raw.activeAccountId : accounts[0].id;
  const loggedInAccountId = accounts.some((item) => item.id === raw.loggedInAccountId) ? raw.loggedInAccountId : "";

  return {
    activeAccountId,
    loggedInAccountId,
    accounts
  };
}

function migrateFromLegacyKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (Array.isArray(parsed.accounts)) {
      const next = sanitizeState(parsed);
      // 旧数据升级时默认保持已登录，减少一次人工登录步骤。
      next.loggedInAccountId = next.activeAccountId;
      return next;
    }

    const single = createAccount(
      {
        id: uid("acc"),
        name: parsed.accountName || "默认账户",
        username: "demo",
        password: DEFAULT_PASSWORD,
        month: parsed.month,
        budget: parsed.budget,
        typeFilter: parsed.typeFilter,
        dateFilter: parsed.dateFilter,
        dateValue: parsed.dateValue,
        records: parsed.records
      },
      { withSeedRecords: false }
    );

    return {
      activeAccountId: single.id,
      loggedInAccountId: single.id,
      accounts: [single]
    };
  } catch {
    return null;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeState(JSON.parse(raw));
  } catch {
    // ignore corrupted data and fallback to migration/default
  }

  for (const key of LEGACY_KEYS) {
    const migrated = migrateFromLegacyKey(key);
    if (migrated) {
      saveState(migrated);
      return migrated;
    }
  }

  const initial = createDefaultState();
  saveState(initial);
  return initial;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
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

function accountSummary(account) {
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    month: account.month,
    budget: account.budget,
    recordsCount: account.records.length
  };
}

function buildLedgerSnapshot(state, account) {
  return {
    authenticated: true,
    accountId: account.id,
    accountName: account.name,
    accountUsername: account.username,
    activeAccountId: account.id,
    accounts: state.accounts.map(accountSummary),
    month: account.month,
    budget: account.budget,
    typeFilter: account.typeFilter,
    dateFilter: account.dateFilter,
    dateValue: account.dateValue,
    records: account.records
  };
}

function findRecordIndexById(records, id) {
  return records.findIndex((item) => String(item.id) === String(id));
}

function findAccountByUsername(accounts, username) {
  const key = normalizeUsername(username);
  return accounts.find((item) => item.username === key);
}

function requireLogin(state, config) {
  const account = state.accounts.find((item) => item.id === state.loggedInAccountId);
  if (account) {
    state.activeAccountId = account.id;
    return { account };
  }

  if (state.loggedInAccountId) {
    state.loggedInAccountId = "";
    saveState(state);
  }

  return {
    error: fail(config, "请先登录。", 401)
  };
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

  if (method === "get" && path === "/auth/session") {
    const logged = state.accounts.find((item) => item.id === state.loggedInAccountId);
    if (!logged) return ok(config, { authenticated: false });
    return ok(config, {
      authenticated: true,
      account: {
        id: logged.id,
        name: logged.name,
        username: logged.username
      }
    });
  }

  if (method === "post" && path === "/auth/login") {
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    if (!USERNAME_RULE.test(username)) return fail(config, "账号格式无效（3-20位小写字母/数字/下划线）。");
    if (!password) return fail(config, "请输入密码。");

    const account = findAccountByUsername(state.accounts, username);
    if (!account) return fail(config, "账号不存在。", 404);
    if (account.password !== password) return fail(config, "密码错误。", 401);

    state.loggedInAccountId = account.id;
    state.activeAccountId = account.id;
    saveState(state);
    return ok(config, buildLedgerSnapshot(state, account));
  }

  if (method === "post" && path === "/auth/register") {
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const name = toSafeName(body.name || username, username);

    if (!USERNAME_RULE.test(username)) return fail(config, "账号格式无效（3-20位小写字母/数字/下划线）。");
    if (password.length < 6) return fail(config, "密码长度至少 6 位。");
    if (findAccountByUsername(state.accounts, username)) return fail(config, "账号已存在。");

    const account = createAccount(
      {
        name,
        username,
        password
      },
      { withSeedRecords: false }
    );

    state.accounts.push(account);
    state.loggedInAccountId = account.id;
    state.activeAccountId = account.id;
    saveState(state);
    return ok(config, buildLedgerSnapshot(state, account), 201);
  }

  if (method === "post" && path === "/auth/logout") {
    state.loggedInAccountId = "";
    saveState(state);
    return ok(config, { authenticated: false });
  }

  if (method === "put" && path === "/auth/password") {
    const session = requireLogin(state, config);
    if (session.error) return session.error;

    const oldPassword = String(body.oldPassword || "");
    const newPassword = String(body.newPassword || "");
    if (session.account.password !== oldPassword) return fail(config, "旧密码错误。", 401);
    if (newPassword.length < 6) return fail(config, "新密码至少 6 位。");

    session.account.password = newPassword;
    saveState(state);
    return ok(config, { success: true });
  }

  const session = requireLogin(state, config);
  if (session.error) return session.error;
  const activeAccount = session.account;

  if (method === "get" && path === "/ledger") {
    return ok(config, buildLedgerSnapshot(state, activeAccount));
  }

  if (method === "get" && path === "/accounts") {
    return ok(config, {
      activeAccountId: activeAccount.id,
      accounts: state.accounts.map(accountSummary)
    });
  }

  if (method === "post" && path === "/accounts") {
    const name = toSafeName(body.name, "");
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");

    if (!name) return fail(config, "账户名称不能为空。");
    if (!USERNAME_RULE.test(username)) return fail(config, "账号格式无效（3-20位小写字母/数字/下划线）。");
    if (password.length < 6) return fail(config, "密码长度至少 6 位。");
    if (findAccountByUsername(state.accounts, username)) return fail(config, "账号已存在。");

    const account = createAccount(
      {
        name,
        username,
        password
      },
      { withSeedRecords: false }
    );

    state.accounts.push(account);
    state.activeAccountId = account.id;
    state.loggedInAccountId = account.id;
    saveState(state);
    return ok(config, buildLedgerSnapshot(state, account), 201);
  }

  if (method === "put" && path === "/accounts/active") {
    const accountId = String(body.accountId || "");
    const password = String(body.password || "");
    const account = state.accounts.find((item) => item.id === accountId);
    if (!account) return fail(config, "账户不存在。", 404);
    if (account.password !== password) return fail(config, "密码错误。", 401);

    state.activeAccountId = account.id;
    state.loggedInAccountId = account.id;
    saveState(state);
    return ok(config, buildLedgerSnapshot(state, account));
  }

  const accountMatch = path.match(/^\/accounts\/([^/]+)$/);
  if (accountMatch) {
    const accountId = accountMatch[1];
    const index = state.accounts.findIndex((item) => item.id === accountId);
    if (index < 0) return fail(config, "账户不存在。", 404);

    if (method === "put") {
      const name = toSafeName(body.name, "");
      if (!name) return fail(config, "账户名称不能为空。");
      state.accounts[index].name = name;
      saveState(state);
      return ok(config, {
        activeAccountId: state.activeAccountId,
        accounts: state.accounts.map(accountSummary)
      });
    }

    if (method === "delete") {
      if (state.accounts.length <= 1) return fail(config, "至少保留一个账户。");

      state.accounts.splice(index, 1);
      if (!state.accounts.some((item) => item.id === state.loggedInAccountId)) {
        state.loggedInAccountId = state.accounts[0].id;
      }
      if (!state.accounts.some((item) => item.id === state.activeAccountId)) {
        state.activeAccountId = state.loggedInAccountId || state.accounts[0].id;
      }
      saveState(state);
      const next = state.accounts.find((item) => item.id === state.loggedInAccountId) || state.accounts[0];
      return ok(config, buildLedgerSnapshot(state, next));
    }
  }

  if (method === "get" && path === "/records") {
    const month = query.get("month") || "";
    const type = query.get("type") || "all";
    const dateFilter = query.get("dateFilter") || "all";
    const dateValue = query.get("dateValue") || "";
    let list = activeAccount.records.slice();

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

    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const numericGap = Number(b.id) - Number(a.id);
      return Number.isFinite(numericGap) ? numericGap : String(b.id).localeCompare(String(a.id));
    });
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
    activeAccount.records.push(record);
    saveState(state);
    return ok(config, record, 201);
  }

  const recordMatch = path.match(/^\/records\/(.+)$/);
  if (recordMatch) {
    const id = recordMatch[1];
    const index = findRecordIndexById(activeAccount.records, id);
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

      const prev = activeAccount.records[index];
      const updated = {
        ...prev,
        type,
        amount,
        category,
        note,
        date
      };
      activeAccount.records[index] = updated;
      saveState(state);
      return ok(config, updated);
    }

    if (method === "delete") {
      const [removed] = activeAccount.records.splice(index, 1);
      saveState(state);
      return ok(config, removed);
    }
  }

  if (method === "put" && path === "/budget") {
    const budget = Number(body.budget);
    if (!Number.isFinite(budget) || budget < 0) return fail(config, "预算必须大于等于 0。");
    activeAccount.budget = budget;
    saveState(state);
    return ok(config, { budget: activeAccount.budget });
  }

  if (method === "put" && path === "/preferences") {
    if (body.month !== undefined) {
      if (!isValidMonth(body.month)) return fail(config, "月份格式错误，应为 YYYY-MM。");
      activeAccount.month = body.month;
    }
    if (body.typeFilter !== undefined) {
      if (!isValidTypeFilter(body.typeFilter)) return fail(config, "类型筛选无效。");
      activeAccount.typeFilter = body.typeFilter;
    }
    if (body.dateInput !== undefined) {
      const parsed = normalizeDateFilter(body.dateInput);
      if (!parsed) return fail(config, "日期筛选输入无效。");
      activeAccount.dateFilter = parsed.dateFilter;
      activeAccount.dateValue = parsed.dateValue;
    }
    if (body.dateFilter !== undefined) {
      if (!isValidDateFilter(body.dateFilter)) return fail(config, "日期筛选无效。");
      if (body.dateFilter === "custom" && !isValidDate(String(body.dateValue || ""))) {
        return fail(config, "自定义日期格式无效。");
      }
      activeAccount.dateFilter = body.dateFilter;
      activeAccount.dateValue = body.dateFilter === "custom" ? String(body.dateValue || "") : "";
    }
    saveState(state);
    return ok(config, {
      month: activeAccount.month,
      typeFilter: activeAccount.typeFilter,
      dateFilter: activeAccount.dateFilter,
      dateValue: activeAccount.dateValue
    });
  }

  if (method === "put" && path === "/ledger") {
    if (!body || typeof body !== "object") return fail(config, "请求体错误。");
    const next = { ...activeAccount, ...body };
    if (!isValidMonth(next.month)) return fail(config, "月份格式错误。");
    if (!Number.isFinite(Number(next.budget)) || Number(next.budget) < 0) return fail(config, "预算无效。");
    if (!Array.isArray(next.records)) return fail(config, "records 必须是数组。");
    activeAccount.month = next.month;
    activeAccount.budget = Number(next.budget);
    activeAccount.typeFilter = isValidTypeFilter(next.typeFilter) ? next.typeFilter : "all";
    activeAccount.dateFilter = isValidDateFilter(next.dateFilter) ? next.dateFilter : "today";
    activeAccount.dateValue =
      activeAccount.dateFilter === "custom" && isValidDate(String(next.dateValue || ""))
        ? String(next.dateValue)
        : "";
    activeAccount.records = normalizeRecords(next.records);
    saveState(state);
    return ok(config, buildLedgerSnapshot(state, activeAccount));
  }

  return fail(config, `未实现的接口：${method.toUpperCase()} ${path}`, 404);
}
