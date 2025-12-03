# Flutter 即时通讯客户端

基于现有 REST + Socket.IO 后端的跨平台 Flutter 客户端，支持 Android、iOS、Web。实现 JWT 认证、会话列表、消息历史、实时消息、用户搜索等功能。

## 1. 前置条件
- Flutter SDK 3.16+、Dart 3.2+
- Android/iOS 平台开发环境（可选）

## 2. 项目结构
```
lib/
├── constants/            # 后端地址与常量（api_constants.dart）
├── models/               # 数据模型（User/Message/Conversation）
├── services/             # 认证/聊天/用户/Socket/Hive/安全存储
├── providers/            # 状态管理（Auth/Chat/User/Theme）
├── pages/                # 页面（Login/Chat/Search/Profile/Settings）
├── routes/               # 路由（GoRouter 配置）
├── widgets/              # 通用组件（AppBar/Loading/Error 等）
├── utils/                # 异常与工具
└── main.dart             # 应用入口
```

## 3. 后端地址配置
编辑 `lib/constants/api_constants.dart`：
```dart
class ApiConstants {
  // 推荐：直连后端（端口 4000）
  static const String baseUrl = 'http://localhost:4000/api';
  static const String socketUrl = 'http://localhost:4000';

  // 可选：Next BFF 开发（端口 3001）
  // static const String baseUrl = 'http://localhost:3001/api';
  // static const String socketUrl = 'http://localhost:3001';

  // 可选：Next 生产（端口 3000）
  // static const String baseUrl = 'http://localhost:3000/api';
  // static const String socketUrl = 'http://localhost:3000';
}
```

## 4. 安装与运行
```bash
cd flutter_im_client
flutter pub get

# Web 开发
flutter run -d chrome

# Android（示例）
flutter run -d android

# iOS（需配置签名/设备）
flutter run -d ios
```

### 4.1 iOS 模拟器
```bash
# 预缓存 iOS 引擎
flutter precache --ios

# 安装 CocoaPods（推荐 Homebrew）
brew install cocoapods
pod setup

# 安装 iOS 依赖
cd ios
pod repo update
pod install
cd ..

# 启动模拟器并运行
open -a Simulator
flutter run -d ios
```
- 如需明确平台版本，在 `ios/Podfile` 顶部添加：`platform :ios, '13.0'`

### 4.2 macOS 桌面（可选）
```bash
flutter config --enable-macos-desktop
flutter create --platforms=macos .   # 若缺少 macos 目录
flutter pub get
flutter run -d macos
```

### 4.3 ATS 网络配置
- 为允许访问 `http://localhost:4000`，在 `ios/Runner/Info.plist` 与 `macos/Runner/Info.plist` 添加：
  - `NSAppTransportSecurity` → `NSAllowsArbitraryLoads = true`
  - 或在 `NSExceptionDomains` 为 `localhost` 添加例外，允许不安全 HTTP 加载


## 5. 功能概览
- 登录/登出与自动登录（JWT + 安全存储）
- 会话列表（置顶、未读计数、最近消息）
- 消息历史分页、实时消息收发（Socket.IO）
- 用户搜索（按邮箱/昵称/拼音）
- 在线状态与输入状态展示
- 设置页（通知、主题、清缓存、账号管理）

## 6. API 与事件映射（参考）
- 认证：`POST /api/auth/login`、`POST /api/auth/refresh`、`POST /api/auth/logout`、`GET /api/me`
- 消息：`GET /api/messages/:peer?limit=<n>&before=<ts>`、Socket 事件 `private_message`
- 会话：`GET /api/conversations`、`POST /api/read/:peer`、`DELETE /api/conversations/:peer`、`POST /api/conversations/:peer/pin`
- Socket 事件监听：`private_message`、`online_users`、`unread_counts`

## 7. 状态管理
- Provider/Riverpod 组合：`AuthProvider`、`ChatProvider`、`UserProvider`、`ThemeProvider`
- 路由守卫：未认证跳转登录，已认证进入聊天主页面

## 8. 文档
- 产品需求文档：`../.trae/documents/flutter_client_prd.md`
- 技术架构文档：`../.trae/documents/flutter_client_technical_architecture.md`

## 10. 诊断与自动化测试
- 诊断页：从聊天页右上角工具按钮进入 `/chat/diagnostics`
- Cypress：在项目根目录运行 `npm run cy:run` 或 `npm run cy:open`（基址 `http://localhost:5174`）

## 9. 常见问题
- 连接失败：确认 `api_constants.dart` 的地址与后端端口一致，并确保 CORS 放行
- 登录失败：检查后端是否启用 JWT 或 mock 认证，尝试测试账号
- Web 平台：如需部署到生产，请使用 HTTPS 并配置合法的后端域名
