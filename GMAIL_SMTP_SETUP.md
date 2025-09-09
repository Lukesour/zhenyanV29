# Gmail SMTP 邮件服务配置指南

## 概述

箴言留学系统现在使用Gmail SMTP来发送验证码邮件。您需要配置Gmail应用专用密码来启用邮件发送功能。

## 1. 启用Gmail两步验证

### 1.1 登录Google账号
1. 访问 [Google账号设置](https://myaccount.google.com/)
2. 使用您要用作发送邮箱的Gmail账号登录

### 1.2 启用两步验证
1. 点击左侧菜单中的"安全性"
2. 在"登录Google"部分，点击"两步验证"
3. 点击"开始使用"
4. 按照提示完成两步验证设置（通常需要手机号码）

## 2. 生成应用专用密码

### 2.1 访问应用专用密码页面
1. 在"安全性"页面，确保两步验证已启用
2. 在"两步验证"下方，点击"应用专用密码"
3. 可能需要再次输入Google账号密码

### 2.2 生成密码
1. 在"选择应用"下拉菜单中选择"邮件"
2. 在"选择设备"下拉菜单中选择"其他（自定义名称）"
3. 输入名称，例如"箴言留学系统"
4. 点击"生成"
5. **重要**：复制显示的16位密码（格式类似：abcd efgh ijkl mnop）
6. 保存这个密码，关闭窗口后将无法再次查看

## 3. 配置系统

### 3.1 编辑配置文件
编辑 `backend/config.env` 文件，添加以下配置：

```env
# Gmail SMTP Configuration
GMAIL_SENDER_EMAIL=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
GMAIL_SENDER_NAME=箴言留学
```

**注意**：
- `GMAIL_SENDER_EMAIL`：您的完整Gmail地址
- `GMAIL_APP_PASSWORD`：刚才生成的16位应用专用密码（去掉空格）
- `GMAIL_SENDER_NAME`：邮件发送者显示名称

### 3.2 示例配置
```env
# Gmail SMTP Configuration
GMAIL_SENDER_EMAIL=noreply@yourdomain.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
GMAIL_SENDER_NAME=箴言留学

# 其他配置...
JWT_SECRET_KEY=your-super-secret-jwt-key
```

## 4. 测试配置

### 4.1 运行测试脚本
```bash
cd backend
python test_email_service.py
```

### 4.2 测试输出示例
```
🧪 Gmail SMTP邮件服务测试
==================================================
📋 检查配置...
✅ 发送邮箱: noreply@yourdomain.com
✅ 应用密码: ****************

🚀 初始化邮件服务...
✅ 邮件服务初始化成功

🔗 测试SMTP连接...
✅ Gmail SMTP连接成功

🔢 生成验证码...
✅ 验证码生成成功: 123456

📧 是否发送测试邮件？
请输入测试邮箱地址（回车跳过）: test@example.com
📤 发送测试邮件到: test@example.com
✅ 测试邮件发送成功！
📬 请检查您的邮箱（包括垃圾邮件文件夹）

🎉 所有测试通过！Gmail SMTP邮件服务配置正确。
```

## 5. 常见问题

### 5.1 "应用专用密码"选项不可见
**原因**：未启用两步验证
**解决**：必须先启用两步验证才能生成应用专用密码

### 5.2 SMTP连接失败
**可能原因**：
1. 应用专用密码错误
2. Gmail地址错误
3. 网络连接问题

**解决方案**：
1. 重新生成应用专用密码
2. 检查Gmail地址拼写
3. 检查网络连接

### 5.3 邮件发送失败但连接成功
**可能原因**：
1. 收件人邮箱地址无效
2. Gmail发送限制
3. 邮件内容被拦截

**解决方案**：
1. 检查收件人邮箱地址
2. 等待一段时间后重试
3. 检查垃圾邮件文件夹

### 5.4 邮件进入垃圾邮件文件夹
**原因**：新的发送域名可能被标记为垃圾邮件
**解决方案**：
1. 建议收件人将发送邮箱加入白名单
2. 考虑使用自定义域名邮箱
3. 逐步建立发送信誉

## 6. 安全建议

### 6.1 保护应用专用密码
1. 不要在代码中硬编码密码
2. 使用环境变量存储密码
3. 定期更换应用专用密码
4. 不要与他人分享密码

### 6.2 监控邮件发送
1. 定期检查Gmail发送统计
2. 监控邮件发送失败率
3. 关注收件人反馈

## 7. 生产环境建议

### 7.1 使用专用邮箱
建议为系统创建专用的Gmail账号，例如：
- `noreply@yourdomain.com`
- `system@yourdomain.com`
- `notifications@yourdomain.com`

### 7.2 配置发送限制
Gmail有发送限制：
- 每天最多500封邮件
- 每分钟最多100封邮件

如需更高发送量，考虑：
1. 使用Google Workspace
2. 使用专业邮件服务（如SendGrid、Mailgun）
3. 配置多个发送账号轮换

## 8. 完成确认

配置完成后，您应该能够：
1. ✅ 用户注册时收到验证码邮件
2. ✅ 用户登录时收到验证码邮件
3. ✅ 新用户收到欢迎邮件
4. ✅ 系统健康检查显示邮件服务正常

---

**配置完成后，您的箴言留学系统将能够正常发送验证码邮件！**
