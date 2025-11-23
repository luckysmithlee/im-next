# 简单在线聊天系统

一个基于 Next.js、Node.js、Express、Socket.IO 和 Supabase 的实时聊天应用。

## 功能特性

- ✅ 用户身份验证（Supabase Auth）
- ✅ 实时消息传递（Socket.IO）
- ✅ 在线用户状态跟踪
- ✅ 一对一私聊功能
- ✅ 响应式设计（Tailwind CSS）
- ✅ 现代化用户界面

## 快速开始

### 环境要求

- Docker 和 Docker Compose（推荐）
- Node.js（开发模式）

### 开发模式启动

1. **启动后端服务：**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **启动前端服务：**
   ```bash
   cd frontend
   npm install
   npm run dev -- -p 3001
   ```

3. **访问应用：**
   - 前端：http://localhost:3001
   - 后端 WebSocket：http://localhost:4000

### Docker 部署（推荐）

1. **构建和启动服务：**
   ```bash
   docker compose build
   docker compose up -d
   ```

2. **创建测试用户：**
   ```bash
   chmod +x setup-test-users.sh
   ./setup-test-users.sh
   ```

3. **访问应用：**
   - 前端：http://localhost:3000
   - 后端 WebSocket：http://localhost:4000
   - Supabase 认证：http://localhost:9999

## 测试账号

| 用户名 | 密码 | 用户ID |
|--------|------|--------|
| test1@example.com | 123456 | user1 |
| test2@example.com | 123456 | user2 |
| test3@example.com | 123456 | user3 |

## 系统架构

### 技术栈
- **前端**：Next.js 16.0.3 + React 19 + Socket.IO Client
- **后端**：Node.js + Express + Socket.IO
- **数据库**：Supabase（PostgreSQL + Auth + Realtime）
- **部署**：Docker Compose

### 系统架构图
```
[客户端]
  ├── 登录认证 (Supabase Auth)
  └── WebSocket 连接 (Socket.IO)
           │
           └── [服务端]
               ├── Express REST API
               ├── Socket.IO 消息处理
               ├── 在线用户注册表
               └── 消息路由转发
```

### Socket.IO 事件定义

| 事件名 | 方向 | 描述 |
|--------|------|------|
| login | 客户端→服务端 | 用户登录 socket 标识 |
| online_users | 服务端→客户端 | 推送所有在线用户 |
| private_message | 双向 | 私聊信息 |
| user_online | 服务端→客户端 | 用户上线通知 |
| user_offline | 服务端→客户端 | 用户下线通知 |

## 项目结构

```
chat-project/
├── backend/                  # 后端服务
│   ├── server.js            # Express + Socket.IO 服务器
│   ├── package.json         # 后端依赖配置
│   └── Dockerfile           # 后端 Docker 配置
├── frontend/                # 前端应用
│   ├── pages/               # Next.js 页面
│   ├── components/          # React 组件
│   ├── styles/              # CSS 样式
│   ├── package.json         # 前端依赖配置
│   └── Dockerfile           # 前端 Docker 配置
├── docker-compose.yml       # Docker 服务编排
├── .env                     # 环境变量配置
└── setup-test-users.sh      # 测试用户创建脚本
```

## API 接口

### 认证接口
- `POST /api/login` - 用户登录
- `GET /api/online-users` - 获取在线用户列表

### WebSocket 事件
- `login` - 用户登录认证
- `online_users` - 在线用户列表更新
- `private_message` - 私聊消息发送/接收
- `user_online` - 用户上线通知
- `user_offline` - 用户下线通知

## 数据模型

### 用户模型
```javascript
User {
  id: string,        // 用户唯一标识
  email: string,     // 用户邮箱
  username: string,  // 用户名
  online: boolean    // 在线状态
}
```

### 消息模型
```javascript
Message {
  from: string,      // 发送者ID
  to: string,        // 接收者ID
  content: string,   // 消息内容
  timestamp: number  // 时间戳
}
```

## 界面设计

### 登录页面
- 邮箱密码输入框
- 登录按钮
- 简约蓝灰色风格
- 居中卡片布局

### 聊天主界面
- **左侧**：在线用户列表（不显示自己）
- **右侧**：聊天窗口
  - 顶部：聊天对象或提示信息
  - 中间：消息气泡（左右对齐区分发送/接收）
  - 底部：消息输入框和发送按钮

### 用户体验优化
- ✅ 未选择用户时禁用消息输入
- ✅ 智能按钮状态（禁用/启用）
- ✅ 空状态提示（无其他用户在线）
- ✅ 当前用户信息顶部显示
- ✅ 消息气泡颜色区分（发送蓝色/接收灰色）

## 环境变量

更新 `.env` 文件中的配置：

```bash
# Supabase 配置
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOTRUE_JWT_SECRET=your_jwt_secret

# 开发环境默认值
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:9999
```

## 开发指南

### 前端开发
```bash
cd frontend
npm install
npm run dev        # 开发模式
npm run build      # 构建生产版本
```

### 后端开发
```bash
cd backend
npm install
npm start          # 启动服务
npm run dev        # 开发模式（带热重载）
```

## Docker 配置

### 服务说明
- **supabase-db**: PostgreSQL 数据库
- **supabase-auth**: Supabase 认证服务（GoTrue）
- **supabase-realtime**: Supabase 实时服务
- **backend**: Node.js 后端服务
- **frontend**: Next.js 前端应用

### 端口映射
- `3000/3001`: 前端应用
- `4000`: 后端服务
- `9999`: Supabase 认证服务
- `5432`: PostgreSQL 数据库
- `4001`: Supabase 实时服务

## 部署说明

### 生产环境部署
1. 配置真实的环境变量
2. 使用强密码和密钥
3. 配置 HTTPS 证书
4. 设置防火墙规则
5. 配置数据库备份

### 安全建议
- 使用强 JWT 密钥
- 配置 CORS 策略
- 启用 HTTPS
- 定期更新依赖包
- 配置输入验证

## 故障排除

### 常见问题

1. **端口占用错误**
   - 检查端口是否被其他应用占用
   - 修改 docker-compose.yml 中的端口映射

2. **认证失败**
   - 检查 Supabase 配置是否正确
   - 验证 JWT 密钥是否匹配

3. **WebSocket 连接失败**
   - 检查防火墙设置
   - 验证 CORS 配置

4. **Docker 启动失败**
   - 检查 Docker 服务状态
   - 验证镜像是否完整

## 扩展功能

未来可扩展的功能：
- [ ] 群聊功能
- [ ] 文件传输
- [ ] 消息已读状态
- [ ] 离线消息存储
- [ ] 用户头像上传
- [ ] 消息搜索功能
- [ ] 通知推送
- [ ] 移动端适配

## 许可证

MIT License - 详见 LICENSE 文件

## 支持与联系

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 技术社区讨论

---

**享受实时聊天的乐趣！** 🚀💬
### 认证与API

- 认证服务：Supabase GoTrue（本地容器）或云端 Supabase
- 前端：使用 `@supabase/supabase-js` 完整登录/登出
- 后端：Express + Socket.IO，提供受保护 API 与 JWT 校验

#### 环境变量

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase Auth 基础地址，例如 `http://localhost:9999`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名密钥（本地可填写占位值）
- `NEXT_PUBLIC_BACKEND_URL`：后端地址，例如 `http://localhost:4000`
- `GOTRUE_URL`：后端访问 GoTrue 的地址，需包含 `/auth/v1`，例如 `http://supabase-auth:9999/auth/v1`
- `SUPABASE_SERVICE_ROLE_KEY`：用于创建测试用户的服务密钥

#### 后端受保护路由

- `GET /api/me` 返回认证用户信息，需要 `Authorization: Bearer <token>`
- Socket.IO 在握手阶段校验 `auth.token`

### Docker 部署

1. 准备 `.env` 文件：
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOTRUE_JWT_SECRET`（仅本地 GoTrue 使用）
2. 启动服务：
   - `docker compose up -d supabase-db supabase-auth`
   - `./setup-test-users.sh` 创建测试用户（`test1@example.com/123456` 等）
   - `docker compose up -d backend frontend`
3. 前端访问 `http://localhost:3000`，使用测试账户登录即可进入聊天页。

### 端到端测试

1. 在 `frontend/tests/auth.e2e.mjs` 提供了 E2E 测试脚本：
   - 登录 Supabase
   - 调用后端受保护接口 `/api/me`
   - 建立 Socket.IO 连接并接收 `online_users`
2. 运行测试：
   - `cd frontend && node tests/auth.e2e.mjs`
3. 验证通过后删除测试文件：
   - `rm frontend/tests/auth.e2e.mjs`

### 认证流程

- 登录：`supabase.auth.signInWithPassword`，获取 `access_token` 与 `user.id`
- 持久化：勾选“记住登录状态”写入 `localStorage`，否则写入 `sessionStorage`
- 跳转：登录后进入 `/chat`
- 登出：`supabase.auth.signOut()`，清理存储并返回首页
