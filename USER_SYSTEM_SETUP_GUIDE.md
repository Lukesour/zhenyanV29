# 箴言留学用户系统配置指南

## 概述

本指南将帮助您完成箴言留学用户认证系统的配置，包括：
- 用户注册/登录功能
- 邮箱验证码系统
- Hunter.io邮箱验证服务
- 邀请码机制
- 分析次数管理
- Brevo邮件服务集成

## 1. 数据库配置

### 1.1 Supabase数据库表创建

1. 登录您的Supabase控制台
2. 进入SQL编辑器
3. 执行 `backend/database_setup.sql` 文件中的所有SQL语句
4. 确认以下表已创建：
   - `users` - 用户表
   - `email_verification_codes` - 邮箱验证码表
   - `invitation_codes` - 邀请码表
   - `user_analysis_records` - 用户分析记录表

### 1.2 验证数据库连接

```bash
cd backend
python -c "
from services.user_service import UserService
service = UserService()
print('Database connection:', service.test_connection())
"
```

## 2. Gmail SMTP邮件服务配置

### 2.1 设置Gmail应用专用密码

1. 登录您的Gmail账号
2. 进入 [Google账号设置](https://myaccount.google.com/)
3. 点击"安全性" → "两步验证"（必须先启用两步验证）
4. 在"两步验证"页面，点击"应用专用密码"
5. 选择"邮件"和您的设备，生成16位应用专用密码
6. 复制生成的密码备用

### 2.2 配置邮件服务

编辑 `backend/config.env` 文件：

```env
# Gmail SMTP Configuration
GMAIL_SENDER_EMAIL=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
GMAIL_SENDER_NAME=箴言留学

# Hunter.io Email Verification
HUNTER_API_KEY=608d4319bc561f47a3ee6445ab1d3c3b54fddb08

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
```

### 2.3 测试邮件服务

```bash
cd backend
python -c "
from services.email_service import EmailService
service = EmailService()
print('Gmail SMTP connection:', service.test_connection())
"
```

## 3. Hunter.io邮箱验证服务配置

### 3.1 Hunter.io服务说明

Hunter.io是一个专业的邮箱验证服务，用于：
- 验证邮箱地址的有效性
- 检测临时邮箱和垃圾邮箱
- 评估邮箱质量分数
- 防止无效邮箱注册

### 3.2 API密钥配置

API密钥已经在配置文件中设置：
```env
HUNTER_API_KEY=608d4319bc561f47a3ee6445ab1d3c3b54fddb08
```

### 3.3 测试Hunter.io服务

```bash
cd backend
python -c "
import asyncio
from services.email_verification_service import email_verification_service

async def test():
    result = await email_verification_service.verify_email('test@example.com')
    print('Hunter.io verification result:', result)

asyncio.run(test())
"
```

## 4. 后端依赖安装

### 4.1 安装新的Python包

```bash
cd backend
pip install PyJWT==2.8.0 email-validator==2.1.0 aiohttp==3.9.1
```

### 4.2 验证依赖

```bash
pip list | grep -E "(PyJWT|email-validator|aiohttp)"
```

## 5. 前端配置

### 5.1 确认API基础URL

检查 `frontend/src/services/api.ts` 中的API_BASE_URL配置：

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

### 5.2 构建前端

```bash
cd frontend
npm install
npm run build
```

## 6. 系统启动

### 6.1 启动后端服务

```bash
cd backend
python start_server.py
```

### 6.2 启动前端服务（开发模式）

```bash
cd frontend
npm start
```

### 6.3 启动Cloudflare Tunnel

```bash
cloudflared tunnel --config cloudflared_config.yml run zhenyanasia
```

## 7. 功能测试

### 6.1 用户注册流程测试

1. 访问 https://zhenyan.asia
2. 点击"注册"标签
3. 输入手机号和邮箱
4. 点击"发送验证码"
5. 检查邮箱收到验证码
6. 输入验证码完成注册
7. 确认获得3次分析机会

### 6.2 用户登录流程测试

1. 点击"登录"标签
2. 输入注册时的手机号和邮箱
3. 点击"发送验证码"
4. 输入验证码完成登录
5. 确认显示用户信息面板

### 6.3 邀请码功能测试

1. 登录后查看用户面板中的邀请码
2. 使用另一个手机号和邮箱注册
3. 在注册时输入邀请码
4. 确认邀请者获得额外3次分析机会

### 6.4 分析功能测试

1. 登录后填写留学申请表单
2. 提交表单开始分析
3. 确认消耗1次分析机会
4. 等待分析完成并查看结果

## 7. 系统监控

### 7.1 健康检查

访问以下端点检查系统状态：
- `GET /api/auth/health` - 认证系统健康状态
- `GET /api/health` - 整体系统健康状态

### 7.2 日志监控

检查以下日志文件：
- 后端日志：控制台输出
- 前端日志：浏览器开发者工具
- Cloudflare Tunnel日志：终端输出

## 8. 常见问题解决

### 8.1 邮件发送失败

**问题**：验证码邮件发送失败
**解决方案**：
1. 检查Gmail应用专用密码是否正确
2. 确认已启用Gmail两步验证
3. 检查网络连接到Gmail SMTP服务器

### 8.2 数据库连接失败

**问题**：用户服务初始化失败
**解决方案**：
1. 检查Supabase URL和密钥
2. 确认数据库表已正确创建
3. 检查网络连接到Supabase

### 8.3 JWT令牌问题

**问题**：用户登录后立即退出
**解决方案**：
1. 检查JWT_SECRET_KEY配置
2. 确认系统时间正确
3. 清除浏览器本地存储

### 8.4 前端认证问题

**问题**：前端无法获取用户信息
**解决方案**：
1. 检查API请求是否包含Authorization头
2. 确认后端CORS配置正确
3. 检查浏览器网络请求

## 9. 安全建议

### 9.1 生产环境配置

1. **更改默认密钥**：
   ```env
   JWT_SECRET_KEY=生成一个强随机密钥
   ```

2. **启用HTTPS**：确保所有通信都通过HTTPS

3. **配置CORS**：限制允许的域名

4. **数据库安全**：启用Supabase RLS策略

### 9.2 监控和日志

1. 设置错误监控（如Sentry）
2. 配置访问日志
3. 监控API调用频率
4. 设置异常告警

## 10. 维护任务

### 10.1 定期清理

1. **清理过期验证码**：
   ```sql
   SELECT cleanup_expired_verification_codes();
   ```

2. **监控用户增长**：
   ```sql
   SELECT COUNT(*) FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days';
   ```

### 10.2 数据备份

1. 定期备份Supabase数据库
2. 备份配置文件
3. 备份邮件模板

## 11. 支持联系

如果在配置过程中遇到问题，请联系：
- 技术支持：通过GitHub Issues
- 邮件支持：技术团队邮箱
- 微信客服：Godeternitys / MalachiSuan

---

**配置完成后，您的箴言留学平台将具备完整的用户认证和管理功能！**
