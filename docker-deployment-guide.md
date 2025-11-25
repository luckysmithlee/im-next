# IM应用Docker化部署方案

## 概述

本方案为IM（即时通讯）应用提供完整的数据持久化和Docker化部署解决方案，支持一键部署、数据备份恢复、高可用架构。

## 架构设计

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx                              │
│                  (反向代理+负载均衡)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐        ┌────▼────┐       ┌───▼───┐
│Vite前端│        │Next.js前端│       │后端API│
│:5173  │        │:3000    │       │:4000  │
└───┬───┘        └────┬────┘       └───┬───┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
    ┌─────────────────▼─────────────────┐
    │         PostgreSQL                │
    │      (主数据库:5432)              │
    └─────────────────┬─────────────────┘
                      │
    ┌─────────────────▼─────────────────┐
    │           Redis                   │
    │      (缓存+会话:6379)             │
    └─────────────────┬─────────────────┘
                      │
    ┌─────────────────▼─────────────────┐
    │           MinIO                   │
    │     (对象存储:9000/9001)          │
    └───────────────────────────────────┘
```

### 数据持久化策略

1. **PostgreSQL**: 主数据库，存储用户信息、聊天记录、系统配置
2. **Redis**: 缓存层，存储会话、实时数据、热点数据
3. **MinIO**: 对象存储，存储文件、图片、媒体资源
4. **Docker Volumes**: 数据卷持久化，确保容器重启数据不丢失

## 快速开始

### 1. 环境要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ 可用磁盘空间

### 2. 一键部署

```bash
# 克隆项目
git clone <项目地址>
cd im-next_副本

# 设置执行权限
chmod +x scripts/*.sh

# 一键部署
./scripts/deploy.sh deploy

# 镜像加速（可选，提升拉取稳定性）
# 在 Docker Desktop → Settings → Docker Engine 中追加：
# {
#   "registry-mirrors": [
#     "https://registry.docker-cn.com",
#     "https://mirror.ccs.tencentyun.com",
#     "https://docker.mirrors.ustc.edu.cn"
#   ]
# }
# 保存并重启 Docker Desktop
```

### 3. 访问应用

部署完成后，可通过以下地址访问：

- **Next.js前端**: http://localhost:3000
- **Vite前端**: http://localhost:5173  
- **后端API**: http://localhost:4000
- **数据库管理**: http://localhost:3001
- **MinIO控制台**: http://localhost:9001

## 配置说明

### 环境变量配置

复制 `.env.example` 为 `.env` 并修改配置：

```bash
# 数据库配置
POSTGRES_DB=im_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Redis配置
REDIS_PORT=6379

# MinIO配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_minio_password_here

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# 外部访问URL
VITE_API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 端口映射

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| PostgreSQL | 5432 | 5432 | 主数据库 |
| Redis | 6379 | 6379 | 缓存服务 |
| MinIO API | 9000 | 9000 | 对象存储API |
| MinIO控制台 | 9001 | 9001 | 对象存储管理界面 |
| 后端API | 4000 | 4000 | REST API服务 |
| Next.js | 3000 | 3000 | Next.js前端 |
| Vite | 5173 | 5173 | Vite前端 |
| Supabase Studio | 3000 | 3001 | 数据库管理界面 |
| Nginx HTTP | 80 | 80 | Web服务器 |
| Nginx HTTPS | 443 | 443 | Web服务器SSL |

## 数据管理

### 自动备份

系统默认每天凌晨2点自动备份：

```bash
# 手动执行备份
./scripts/backup.sh

# 备份特定组件
./scripts/backup.sh postgres    # 仅备份数据库
./scripts/backup.sh minio       # 仅备份文件存储
```

备份文件存储在：
- `./database/backups/` - PostgreSQL备份
- `./backups/minio/` - MinIO文件备份
- `./backups/full/` - 完整系统备份

### 数据恢复

```bash
# 从备份文件恢复
./scripts/restore.sh /backups/full/backup_20241124_120000.tar.gz

# 仅恢复数据库
./scripts/restore.sh /backups/postgres/backup_20241124_120000.sql.gz --postgres-only

# 强制恢复（不询问确认）
./scripts/restore.sh /backups/full/backup_20241124_120000.tar.gz --force
```

### 备份策略

- **频率**: 每日全量备份
- **保留**: 7天滚动保留
- **存储**: 本地+远程双重备份
- **监控**: 备份状态实时监控

## 运维管理

### 服务管理

```bash
# 查看服务状态
./scripts/deploy.sh status

# 启动/停止/重启服务
./scripts/deploy.sh start
./scripts/deploy.sh stop
./scripts/deploy.sh restart

# 查看日志
./scripts/deploy.sh logs          # 查看所有日志
./scripts/deploy.sh logs backend  # 查看指定服务日志

# 健康检查
./scripts/deploy.sh health
```

### 更新升级

```bash
# 更新应用到最新版本
./scripts/deploy.sh update
```

## 说明与注意事项

- 默认后端持久化为文件存储（`backend/data/messages.json`），适合本地/开发验证；生产建议切换到 PostgreSQL/Supabase。
- `docker-compose.prod.yml` 提供 PostgreSQL、Redis、MinIO、Nginx 的编排示例，可按需启用。
- 前端消息列表支持顶部滚动自动按需加载历史，加载过程保持滚动位置稳定。

### 监控告警

系统内置健康检查：
- 数据库连接状态
- Redis缓存状态
- 后端API响应
- 磁盘空间监控
- 服务端口监听

## 安全加固

### 网络安全

1. **防火墙配置**: 只开放必要端口
2. **Nginx安全**: 配置安全头、防DDoS
3. **SSL/TLS**: 支持HTTPS配置
4. **网络隔离**: Docker网络隔离

### 数据安全

1. **数据库加密**: PostgreSQL数据加密
2. **访问控制**: 基于角色的访问控制(RBAC)
3. **数据备份**: 加密备份文件
4. **敏感信息**: 环境变量管理

### 认证授权

1. **JWT认证**: 无状态认证
2. **Supabase Auth**: 集成认证服务
3. **权限控制**: 细粒度权限管理
4. **会话管理**: Redis会话存储

## 性能优化

### 数据库优化

- **连接池**: PostgreSQL连接池优化
- **索引优化**: 自动索引建议
- **查询优化**: 慢查询监控
- **分区分表**: 大表分区策略

### 缓存策略

- **Redis缓存**: 多级缓存架构
- **CDN**: 静态资源CDN加速
- **浏览器缓存**: 前端缓存优化
- **数据库缓存**: 查询结果缓存

### 负载均衡

- **Nginx**: 反向代理负载均衡
- **容器编排**: Docker Compose服务发现
- **健康检查**: 自动故障转移
- **水平扩展**: 支持多实例部署

## 故障排查

### 常见问题

1. **服务启动失败**: 检查端口冲突、依赖服务
2. **数据库连接失败**: 验证数据库配置、网络连接
3. **内存不足**: 调整JVM参数、增加内存
4. **磁盘空间不足**: 清理日志、优化备份

### 日志分析

```bash
# 查看系统日志
docker-compose logs -f [service-name]

# 查看应用日志
tail -f logs/backend/app.log
tail -f logs/frontend/error.log
```

### 性能监控

- **资源使用**: CPU、内存、磁盘、网络
- **应用指标**: 响应时间、错误率、吞吐量
- **数据库性能**: 连接数、查询性能、锁等待
- **缓存命中率**: Redis性能指标

## 扩展功能

### 高可用部署

- **主从复制**: PostgreSQL主从架构
- **Redis集群**: Redis哨兵模式
- **负载均衡**: 多节点Nginx
- **故障转移**: 自动故障切换

### 微服务架构

- **服务拆分**: 业务服务解耦
- **API网关**: 统一入口管理
- **服务发现**: 服务注册发现
- **配置中心**: 集中配置管理

### 云原生支持

- **Kubernetes**: K8s部署支持
- **Helm Charts**: 包管理工具
- **服务网格**: Istio集成
- **监控集成**: Prometheus+Grafana

## 技术支持

### 文档资源

- [Docker官方文档](https://docs.docker.com/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Redis文档](https://redis.io/documentation)
- [Supabase文档](https://supabase.io/docs/)

### 社区支持

- GitHub Issues: 问题反馈
- 技术文档: 详细配置说明
- 最佳实践: 部署经验分享
- 更新日志: 版本发布说明

### 联系支持

如有问题，请通过以下方式联系：
- 邮箱: support@example.com
- 文档: https://docs.example.com
- 社区: https://community.example.com
