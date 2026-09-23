# 电力配网抢修工单系统

面向供电所的配网故障报修、抢修派工、备件领用和停电恢复跟踪平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20104>

后端健康检查：<http://localhost:21104/health>

### 故障报修：重复合并与严重度升级

- **30 分钟重复合并**：同一资产在 30 分钟内存在未关闭（`OPEN`）故障时，新报修作为 `MERGED` 记录并入原故障（不另建工单），原故障 `merged_count` 累计 +1；窗口外或无未关闭故障时新建 `OPEN` 故障。
- **严重度只升不降**：新报修等级（`LOW < MEDIUM < HIGH < CRITICAL`）高于原故障时，原故障 `severity` 升级并记录 `previous_severity`；等级相同或更低时保持不变。
- **工单优先级只升不降**：故障升级时，仅未复电工单（无 `restored_at`，状态非 `RESTORED/CLOSED`）按 `LOW→ROUTINE / MEDIUM→URGENT / HIGH→EXPRESS / CRITICAL→EMERGENCY` 抬优先级；已复电或已关闭工单保持原样。
- **并发与事务**：同资产报修按资产串行处理；相同 `client_token`（或相同内容指纹）并发/重放只合并一次。合并写入失败时故障、工单与计数整体回滚，返回 `409 FAULT_MERGE_CONFLICT`。

```bash
# 窗口内同资产更严重报修 -> 合并 + 升级（返回 merged=true, escalated=true）
curl -s -X POST http://localhost:21104/api/fault-report \
  -H 'content-type: application/json' \
  -d '{"reporter_name":"张三","phone":"13900000001","asset_id":1,"fault_type":"OUTAGE","address_desc":"同台区","severity":"CRITICAL","client_token":"demo-1"}'

# 列表视图按资产带出 merged_count、previous_severity/severity、linked_ticket_ids
curl -s http://localhost:21104/api/fault-report
```

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。
- Vite 开发服务器把 `/api` 代理到 `http://localhost:21104`（与 nginx 的 `/api/` 代理一致）。


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
- `FAULT_MERGE_WINDOW_MINUTES`: 重复报修合并窗口（分钟），默认 `30`；经 `.env.example`、`docker-compose.yml`、`backend/src/config/mergePolicy.ts` 三处读取。

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: grid-repair`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FaultType: constants/FaultType、types/FaultType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- TicketStatus: constants/TicketStatus、types/TicketStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- AssetHealthStatus: constants/AssetHealthStatus、types/AssetHealthStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- FaultSeverity（LOW/MEDIUM/HIGH/CRITICAL，本次新增）：后端 `constants/FaultSeverity.ts`（等级序/比较）、`constants/TicketPriority.ts`（等级→优先级映射）、`models/FaultReport.ts`、`services/faultMergeEngine.ts`、`constructors/FaultReportDtoFactory.ts`；前端 `constants/FaultSeverity.ts`、`types/FaultReport.ts`、`utils/formatters.ts`、`pages/FaultsPage.vue`、`components/common/PriorityTag.vue`。
- FaultStatus（OPEN/MERGED/CLOSED，本次新增）：后端 `constants/FaultStatus.ts`、`repositories/FaultReportRepository.ts`（窗口判定）、service/seed；前端 `constants/FaultStatus.ts`、`constants/statusText.ts`、故障页分组与状态展示。
- TicketPriority（ROUTINE/URGENT/EXPRESS/EMERGENCY，本次新增）：后端 `constants/TicketPriority.ts`、`repositories/RepairTicketRepository.ts`（已复电/已关闭锁定）、`services/faultMergeEngine.ts`、seed；前端 `constants/TicketPriority.ts`、`utils/formatters.ts`、故障页工单时间线与 `PriorityTag`。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
