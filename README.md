# 电力配网抢修工单系统

面向供电所的配网故障报修、抢修派工、备件领用和停电恢复跟踪平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20104>

后端健康检查：<http://localhost:21104/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `grid-repair`
- `FRONTEND_PORT`: 前端端口，默认 `20104`
- `BACKEND_PORT`: 后端端口，默认 `21104`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: grid-repair`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FaultType: constants/FaultType、types/FaultType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- TicketStatus: constants/TicketStatus、types/TicketStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- AssetHealthStatus: constants/AssetHealthStatus、types/AssetHealthStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- Severity（故障严重度 LOW/MEDIUM/HIGH/CRITICAL，只升不降）:
  - 后端：`constants/Severity.ts`、`constants/TicketPriority.ts`、`constants/FaultStatus.ts`、`models/FaultReport`、`models/RepairTicket`、`services/FaultReportService`、`utils/faultReportValidator`、`constructors/*`、`seed.ts`。
  - 前端：`constants/Severity.ts`、`constants/TicketPriority.ts`、`constants/FaultStatus.ts`、`types/FaultReport`、`types/RepairTicket`、`utils/formatters`、`constructors/*`、`stores/FaultReportStore`、`pages/FaultsPage.vue`、`components/common/StatusBadge.vue`、`components/common/PriorityTag.vue`、`mocks/seedData`。

## 重复报修合并与严重度升级规则

- 同一资产 30 分钟（`config/merge.ts` / 前端 `constants/FaultStatus.ts` 的 `MERGE_WINDOW_MINUTES`）内存在**未关闭（OPEN）主故障**时，新报修标记为 `MERGED` 并入原故障，主故障 `merged_count` 累加，**不另建工单**。
- 新报修严重度更高时：主故障等级只升不降（`severity_before` / `severity_upgraded_to` 记录升级前后等级）；关联的**未复电**工单优先级随严重度只升不降（`priority_before` 留痕）；`RESTORED`/`CLOSED` 工单保持原样。
- 并发提交同一报修：前端为每次提交生成 `client_request_id`（也可用 `x-idempotency-key` 请求头），后端串行事务 + 幂等键缓存保证**只合并一次**；事务内任何失败整体回滚，故障、工单和计数全部不变。
- `GET /api/fault-report` 支持 `asset_id`、`status` 筛选；`GET /api/fault-report/:id` 返回 `merged_reports`（并入报修）和 `tickets`（已关联工单）。故障页按资产分组展示合并次数、升级前后等级与关联工单，提交/刷新后均以接口返回为准。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
