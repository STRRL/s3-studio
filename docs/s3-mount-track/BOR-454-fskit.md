# BOR-454 · FSKit 调研

## 结论（先看）

- **方向正确**：FSKit 是 macOS 挂载体验的关键层。
- **执行策略**：先把 FS callback 和对象存储适配层解耦，不要让 FSKit 直接理解 S3 细节。
- **首批目标**：先跑通 browse/read/write 基础路径，再补 rename/move/权限细节。

## 调研要点

### 1) 分层建议

建议 3 层：

1. **FSKitAdapter**
   - 处理目录枚举、文件读取、写入、元信息回调
2. **MountCore**
   - 统一路径解析、缓存、错误转换
3. **ObjectStoreClient**
   - 对接 OpenDAL Swift binding（S3 后端）

这样可以把平台 API 变动风险和存储后端变动风险隔离开。

### 2) 最小回调闭环（POC）

POC 阶段必须覆盖：

- `list directory`
- `read file`
- `write file`
- `stat metadata`

可延后：

- rename/move（跨目录语义复杂）
- 批量操作优化
- 高级权限映射

### 3) 权限与沙盒

关键点：

- 权限模型需从 day-1 设计（最少权限）
- 认证信息不能散落在 callback 层
- 日志里严禁打印密钥/敏感头

### 4) 一致性与缓存

对象存储不是本地 POSIX 盘，需明确：

- 列表与读取可能存在短暂不一致
- 缓存策略要有 TTL 和失效机制
- 写后读语义要在文档里定义清楚

## 对 BOR-455 的直接输入

- 先上“可跑通的 FSKitAdapter + Mock/OpenDAL adapter”
- 先验证 Finder 侧最常见操作路径
- 逐步补齐复杂文件系统语义

## 下一步清单

- [ ] FS callback -> MountCore 接口定义
- [ ] 错误码映射（FS 层错误到业务错误）
- [ ] 缓存策略（目录/元信息）
- [ ] 小规模真实 bucket 冒烟（读写/并发）
