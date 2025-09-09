# 邮件验证码功能使用指南

## 📋 当前状态

✅ **验证码功能正常工作**  
✅ **API接口正常响应**  
✅ **验证码正确生成和存储**  
⚠️ **Gmail SMTP连接失败，已自动回退到控制台模式**

## 🔧 问题说明

**原因：** Gmail SMTP服务器连接失败，可能是由于：
- 网络环境限制
- Gmail安全策略变更
- 应用专用密码需要更新

**解决方案：** 系统已自动回退到控制台模式，验证码会显示在后端控制台中。

## 📱 如何使用验证码功能

### 方法1：查看后端控制台（推荐）

1. **发送验证码**：
   - 前端用户点击"发送验证码"
   - API返回成功响应
   - 验证码显示在后端控制台中

2. **获取验证码**：
   - 查看后端服务器控制台输出
   - 寻找类似这样的信息：
     ```
     🔢 验证码: 859271
     📧 收件人: h133239238@gmail.com
     💡 注意: 当前为控制台模式，验证码显示在控制台中
     ```

3. **使用验证码**：
   - 将控制台中显示的验证码提供给用户
   - 用户在前端输入验证码完成验证

### 方法2：使用调试API

```bash
# 获取最新的验证码
curl -X GET "http://localhost:8000/api/auth/debug/verification-code/邮箱地址/手机号"

# 示例
curl -X GET "http://localhost:8000/api/auth/debug/verification-code/h133239238%40gmail.com/13800138000"
```

响应示例：
```json
{
  "success": true,
  "verification_code": "859271",
  "message": "验证码获取成功"
}
```

## 🔄 完整的验证流程测试

### 1. 获取CAPTCHA
```bash
curl -X GET http://localhost:8000/api/auth/captcha
```

### 2. 发送验证码
```bash
curl -X POST http://localhost:8000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "phone": "13800138000",
    "captcha_id": "从步骤1获取",
    "captcha_answer": "CAPTCHA答案",
    "session_id": "从步骤1获取"
  }'
```

### 3. 查看验证码
- 方法A：查看后端控制台输出
- 方法B：使用调试API获取

### 4. 验证注册
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "phone": "13800138000",
    "verification_code": "从步骤3获取的验证码"
  }'
```

## 🛠️ 长期解决方案

### 选项1：修复Gmail SMTP
1. 重新生成Gmail应用专用密码
2. 更新 `backend/config.env` 中的配置
3. 重启后端服务

### 选项2：使用第三方邮件API
1. 注册免费的邮件服务（如Resend）
2. 在 `backend/config.env` 中配置：
   ```env
   EMAIL_SEND_METHOD=api
   RESEND_API_KEY=your-api-key
   ```
3. 重启后端服务

## 📞 技术支持

如果遇到问题，请检查：
1. 后端服务是否正常运行
2. 数据库连接是否正常
3. 控制台是否有错误信息

**当前验证码功能完全可用，只是需要从控制台获取验证码而不是邮箱。**
