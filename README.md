# 账单小屋（Bookkeeping）

一个面向个人记账场景的 Vue 3 应用，提供从登录到账单管理、预算控制、统计分析的完整闭环体验。  
系统以“账户隔离、操作直观、反馈清晰”为核心设计目标，支持多账户独立数据存储与本地会话验证。

## 功能特性

### 账户与登录

- 账号密码登录、注册、登出
- 本地会话校验（路由守卫拦截未登录访问）
- 支持修改密码
- 支持多账户管理（新增、重命名、删除、切换）
- 账户数据完全隔离：预算、筛选条件、账单记录互不影响

### 账单管理

- 账单 CRUD：新增、编辑、删除
- 字段包含：收支类型、金额、分类、备注、日期
- 按日期分组展示流水与当日净额
- 删除操作二次确认，减少误操作

### 筛选与统计

- 月份筛选（YYYY-MM）
- 类型筛选（全部 / 支出 / 收入）
- 日期筛选（今天 / 本月全部 / 近 7 天 / 指定日期）
- 本月汇总：收入、支出、预算剩余
- 分类支出占比统计
- 收支趋势图（收入 / 支出 / 净额）

### 预算预警

- 预算使用进度可视化
- 多级预警策略：
  - `>= 75%` 关注提示
  - `>= 90%` 高风险预警
  - `>= 100%` 超支告警

## 技术栈

- Vue 3 + Composition API
- Vite 5
- Vue Router 4
- Pinia
- Axios
- Element Plus（按需引入）
- ECharts（趋势图）

## 工程与架构

- 视图层、状态层、接口层分离
- 路由懒加载与异步组件加载
- 统一请求拦截与错误处理
- Mock API Adapter 模拟后端协议
- localStorage 持久化数据与会话状态

## 目录结构

```text
src/
  api/          # 接口定义、http 实例、mock backend
  components/   # 复用组件（汇总卡片、弹窗、趋势图）
  layouts/      # 主布局
  router/       # 路由配置与页面拆分
  stores/       # Pinia 业务状态（认证、账本、统计）
  utils/        # 日期/金额工具
  views/        # 登录、账单、统计、账户、我的
```

## Mock API

当前接口统一走 `/api/*`，由本地 Mock Adapter 处理：

### 认证

- `GET /api/auth/session`：获取当前会话
- `POST /api/auth/login`：登录
- `POST /api/auth/register`：注册并登录
- `POST /api/auth/logout`：退出登录
- `PUT /api/auth/password`：修改密码

### 账户

- `GET /api/accounts`：获取账户列表
- `POST /api/accounts`：创建账户（含账号密码）
- `PUT /api/accounts/:id`：重命名账户
- `DELETE /api/accounts/:id`：删除账户
- `PUT /api/accounts/active`：校验密码并切换账户

### 账本

- `GET /api/ledger`：获取当前账户账本快照
- `GET /api/records`：查询账单
- `POST /api/records`：新增账单
- `PUT /api/records/:id`：更新账单
- `DELETE /api/records/:id`：删除账单
- `PUT /api/budget`：更新预算
- `PUT /api/preferences`：更新筛选偏好

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 体验账号

- 账号：`demo`
- 密码：`123456`
