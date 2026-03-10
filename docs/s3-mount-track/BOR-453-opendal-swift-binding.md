# BOR-453 · OpenDAL Swift Binding 调研

## 结论（先看）

- **可行**：用 OpenDAL Rust 核心 + Swift 调用层构建 S3 mount 数据面是可行的。
- **当前建议**：先做“最小可行 binding”（只覆盖 list/read/write/stat/delete），不要一开始追求全量 API。
- **Google Drive 支持**：OpenDAL 后端本身支持范围在扩展中，但对 mount 场景应先以 S3 为主线，GDrive 作为后续后端接入，不放在 BOR-455 的首批验收。

## 调研要点

### 1) 绑定策略

优先级建议：

1. **C ABI 包一层 Rust facade**（推荐）
   - Rust 暴露稳定 C 接口
   - Swift 通过 modulemap/bridging header 调用
   - 优点：边界清晰，便于控制错误码与内存管理

2. 直接 Swift 调用更复杂 FFI（不推荐作为第一步）
   - 开发速度慢，调试复杂度高

### 2) API 最小面（BOR-455 需要）

建议先封装以下方法：

- `list(prefix)`
- `read(path, range?)`
- `write(path, bytes)`
- `stat(path)`
- `delete(path)`
- `mkdir(path)`（如语义需要）

这组接口已经足够支撑 mount POC 的主流程。

### 3) 错误模型

必须统一 error mapping，否则 FSKit 回调层会非常难维护：

- OpenDAL 错误 → 内部错误码（如 NotFound / PermissionDenied / Timeout / Conflict）
- 内部错误码 → FSKit 层可识别返回

### 4) 性能/并发

建议落地前就约束：

- 读路径必须支持 range read
- 写路径要有 chunk/stream 方案
- 引入连接复用和重试策略（含 backoff）

## 是否需要 fork

- **短期**：不建议先 fork OpenDAL 主仓。先在本仓维护轻量 binding wrapper。
- **中期**：若遇到必须改 OpenDAL 内核行为再评估 upstream PR / fork。

## 对 BOR-455 的直接输入

- 用 C ABI facade + Swift adapter 的两层结构
- 先交付 S3 的 read/write/list 流程跑通
- 暂不把 GDrive 纳入首批 mount DoD

## 下一步清单

- [ ] 建立 `OpenDALBridge` C 接口草案
- [ ] Swift 侧 `ObjectStoreClient` 协议 + OpenDAL 实现
- [ ] 错误码映射表（文档 + 单测）
- [ ] list/read/write 三条 e2e 冒烟测试
