# 数学题验证码 Cloudflare 部署修复指南

## 问题描述

数学题文本验证码在本地开发环境正常显示，但通过 Cloudflare 部署到生产环境后无法显示。

## 问题原因分析

经过分析，问题的根本原因是：

1. **API 调用路径问题**：前端组件使用相对路径（如 `/api/auth/captcha`）调用 API
2. **环境配置不一致**：本地开发时前后端在同一域名下，生产环境分别部署在不同域名
3. **代理配置差异**：开发环境使用 `package.json` 中的 `proxy` 配置，生产环境需要直接调用后端域名

### 架构对比

**开发环境：**
- 前端：`http://localhost:3000`
- 后端：`http://localhost:8000`
- 代理：`package.json` 中配置 `"proxy": "http://localhost:8000"`

**生产环境：**
- 前端：`https://zhenyan.asia`
- 后端：`https://api.zhenyan.asia`
- 无代理：需要直接调用后端域名

## 修复方案

### 1. 统一 API 基础 URL 配置

创建了智能的环境检测配置 `frontend/src/config.ts`：

```typescript
const getApiBaseUrl = (): string => {
  // 生产环境检测
  if (window.location.hostname === 'zhenyan.asia' || window.location.hostname === 'www.zhenyan.asia') {
    return 'https://api.zhenyan.asia';
  }
  
  // 开发环境
  return process.env.REACT_APP_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
```

### 2. 修复所有相对路径 API 调用

修复了以下文件中的 API 调用：

#### `frontend/src/components/CaptchaInput.tsx`
```typescript
// 修复前
const response = await fetch('/api/auth/captcha');

// 修复后
import { API_BASE_URL } from '../config';
const response = await fetch(`${API_BASE_URL}/api/auth/captcha`);
```

#### `frontend/src/components/AuthForm.tsx`
```typescript
// 修复了三个 API 调用
- `/api/auth/send-verification-code` → `${API_BASE_URL}/api/auth/send-verification-code`
- `/api/auth/register` → `${API_BASE_URL}/api/auth/register`
- `/api/auth/login` → `${API_BASE_URL}/api/auth/login`
```

#### `frontend/src/services/api.ts`
```typescript
// 统一使用配置的 API_BASE_URL
import { API_BASE_URL } from '../config';
```

#### 其他修复的文件
- `frontend/src/components/SystemTest.tsx`
- `frontend/src/components/DebugPanel.tsx`
- `frontend/src/services/authService.ts`

## 验证修复效果

### 1. 构建测试

```bash
cd frontend
npm run build
```

构建成功，无错误。

### 2. API 连通性测试

```bash
curl -X GET https://api.zhenyan.asia/api/auth/captcha -v
```

返回正确的验证码数据：
```json
{
  "success": true,
  "captcha_id": "645ac26be8e504d5",
  "question": "5 - 3 = ?",
  "session_id": "5d9678a1-f3cb-40c1-8fcb-5cb95a6bc22d"
}
```

### 3. 使用测试页面验证

项目根目录下的 `test_captcha_fix.html` 提供了完整的测试套件：

1. **直接 API 调用测试**：验证后端 API 是否正常工作
2. **环境检测测试**：验证 API URL 配置是否正确
3. **前端组件模拟测试**：模拟 CaptchaInput 组件的调用方式
4. **网络连通性测试**：测试所有相关端点的连通性

## 部署步骤

### 1. 重新构建前端

```bash
cd frontend
npm run build
```

### 2. 部署到 Cloudflare Pages

将 `frontend/build` 目录的内容部署到 Cloudflare Pages。

### 3. 确保后端服务运行

```bash
cd backend
python start_server.py
```

### 4. 启动 Cloudflare Tunnel

```bash
cloudflared tunnel --config cloudflared_config.yml run zhenyanasia
```

## 验证部署结果

### 方法 1：直接访问网站

访问 `https://zhenyan.asia`，在登录/注册页面查看验证码是否正常显示。

### 方法 2：使用测试页面

将 `test_captcha_fix.html` 上传到网站根目录，访问 `https://zhenyan.asia/test_captcha_fix.html` 进行全面测试。

### 方法 3：浏览器开发者工具

1. 打开 `https://zhenyan.asia`
2. 按 F12 打开开发者工具
3. 切换到 Network 标签页
4. 尝试获取验证码
5. 查看网络请求是否成功调用 `https://api.zhenyan.asia/api/auth/captcha`

## 预期结果

修复后，验证码应该能够：

1. ✅ 在生产环境正常显示数学题
2. ✅ 正确调用后端 API
3. ✅ 支持刷新验证码功能
4. ✅ 在本地开发环境继续正常工作

## 故障排除

如果验证码仍然无法显示：

1. **检查网络请求**：在浏览器开发者工具中查看是否有 API 调用失败
2. **检查 CORS 配置**：确认后端 CORS 设置允许前端域名
3. **检查 Cloudflare Tunnel**：确认 tunnel 正常运行且配置正确
4. **检查后端服务**：确认后端服务在 localhost:8000 正常运行

## 技术细节

### CORS 配置

后端已正确配置 CORS：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Cloudflare Tunnel 配置

```yaml
tunnel: zhenyanasia
protocol: http2

ingress:
  - hostname: zhenyan.asia
    service: http://localhost:3000
  - hostname: api.zhenyan.asia
    service: http://localhost:8000
  - service: http_status:404
```

这个修复方案确保了验证码功能在所有环境下都能正常工作，同时保持了代码的可维护性和环境适应性。
