# 账单小屋（Bookkeeping）

一个面向个人记账场景的前后端分离应用，提供从登录到账本管理、预算控制、账单 CRUD、统计分析的完整闭环体验。

当前版本已接入真实后端：前端使用 Vue 3，后端使用 Java 17 + Spring Boot 3 + MyBatis，并通过 MySQL 持久化用户、账本和账单数据。

## 功能特性

### 登录与用户

- 账号密码登录、注册、登出
- Session Cookie 会话校验
- 路由守卫拦截未登录访问
- 支持修改密码
- 密码使用 BCrypt 哈希后入库

### 账本管理

- 每个登录用户可拥有多个账本
- 支持新增、重命名、删除、切换账本
- 每个账本拥有独立预算、筛选偏好和账单记录
- 删除账本时会同步删除该账本下的账单记录

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
- 多级预警策略：`>= 75%` 关注提示、`>= 90%` 高风险预警、`>= 100%` 超支告警

## 技术栈

- 前端：Vue 3、Vite 5、Vue Router 4、Pinia、Axios、Element Plus、ECharts
- 后端：Java 17、Spring Boot 3、Spring Web、Spring Validation、MyBatis、MySQL Connector/J
- 数据库：MySQL 8.x
- 认证：Spring Session Cookie + 服务端 HttpSession
- 密码：BCrypt 哈希

## 目录结构

```text
backend/
  pom.xml
  sql/schema.sql
  src/main/java/com/bookkeeping/ledger/
    controller/    # HTTP API
    service/       # 业务逻辑
    mapper/        # MyBatis SQL 映射
    model/         # 数据库实体
    dto/           # 请求与响应对象
    config/        # Web、密码、拦截器配置
  src/main/resources/
    application.yml
    application-local.example.yml

src/
  api/          # Axios 实例与接口函数
  components/   # 复用组件
  layouts/      # 主布局
  router/       # 路由配置
  stores/       # Pinia 状态
  utils/        # 日期/金额工具
  views/        # 登录、账单、统计、账本、我的
```

## MySQL 配置

先创建数据库表：

```bash
mysql -u root -p < backend/sql/schema.sql
```

项目中已经准备好本地占位配置 `backend/src/main/resources/application-local.yml`，你只需要填写自己的 MySQL 用户名和密码：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ledger_app?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: YOUR_MYSQL_USERNAME
    password: YOUR_MYSQL_PASSWORD
```

`application-local.yml` 已被 `.gitignore` 忽略，不会提交到仓库；`application-local.example.yml` 作为模板会保留在仓库中。

## 本地运行

启动后端：

```bash
cd backend
mvn spring-boot:run
```

启动前端：

```bash
npm install
npm run dev
```

开发期前端请求 `/api/*` 会通过 Vite proxy 转发到 `http://localhost:8080`。

## 构建与检查

前端构建：

```bash
npm run build
```

后端测试：

```bash
cd backend
mvn test
```

## API 概览

所有接口统一以 `/api` 开头，由 Spring Boot 后端提供。响应格式保持统一：

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "错误信息" }
```

### 认证

- `GET /api/auth/session`：获取当前会话
- `POST /api/auth/login`：登录
- `POST /api/auth/register`：注册并登录
- `POST /api/auth/logout`：退出登录
- `PUT /api/auth/password`：修改密码

### 账本

- `GET /api/accounts`：获取当前用户的账本列表
- `POST /api/accounts`：创建账本
- `PUT /api/accounts/:id`：重命名账本
- `DELETE /api/accounts/:id`：删除账本
- `PUT /api/accounts/active`：切换当前账本
- `GET /api/ledger`：获取当前账本快照

### 账单与偏好

- `GET /api/records`：查询账单
- `POST /api/records`：新增账单
- `PUT /api/records/:id`：更新账单
- `DELETE /api/records/:id`：删除账单
- `PUT /api/budget`：更新预算
- `PUT /api/preferences`：更新筛选偏好

## 初始化账号

当前版本不再内置浏览器 localStorage 演示账号。你可以直接在登录页注册账号，系统会自动为新用户创建第一个默认账本。

更多后端改造细节见 [真实后端改造说明.md](./真实后端改造说明.md)。
