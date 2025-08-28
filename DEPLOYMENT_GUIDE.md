# 异步分析功能部署指南

## 概述

本指南将帮助您部署异步分析功能，解决 Cloudflare 100秒超时限制问题。

## 系统要求

- Python 3.8+
- Node.js 16+
- 支持长时间运行后台任务的服务器环境

## 部署步骤

### 1. 后端部署

#### 1.1 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 1.2 配置环境变量

复制并配置环境变量文件：

```bash
cp config.env.example config.env
# 编辑 config.env 文件，设置必要的环境变量
```

#### 1.3 启动后端服务

```bash
# 开发环境
python start_server.py

# 或者使用 uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 1.4 验证后端服务

访问以下端点验证服务是否正常：

- `http://localhost:8000/health` - 基础健康检查
- `http://localhost:8000/health/detailed` - 详细健康检查

### 2. 前端部署

#### 2.1 安装依赖

```bash
cd frontend
npm install
```

#### 2.2 配置 API 地址

编辑 `src/config.ts` 文件，设置正确的后端 API 地址：

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

#### 2.3 启动前端服务

```bash
# 开发环境
npm start

# 生产构建
npm run build
```

### 3. 测试验证

#### 3.1 后端功能测试

使用提供的测试脚本验证后端功能：

```bash
cd backend
python test_async_analysis.py
```

预期输出：
```
🧪 异步分析功能测试套件
==================================================
🏥 测试健康检查端点...
✅ 基础健康检查: {'status': 'healthy', 'timestamp': '2024-01-01T00:00:00Z'}
✅ 详细健康检查: {...}

🚀 开始测试异步分析功能...
📝 步骤 1: 启动分析任务
✅ 任务启动成功，任务ID: abc123...
   状态: pending
   消息: 分析任务已启动，请稍后查询结果

🔄 步骤 2: 轮询任务状态
   轮询 0.0s: 状态=processing, 进度=0%
   轮询 3.0s: 状态=processing, 进度=25%
   ...
✅ 任务完成！
```

#### 3.2 前端功能测试

1. 打开浏览器访问 `http://localhost:3000/test_async.html`
2. 填写测试数据
3. 点击"开始分析"按钮
4. 观察任务状态更新和进度条变化
5. 验证最终结果是否正确显示

#### 3.3 集成测试

1. 启动完整的 React 应用
2. 使用真实的用户表单提交分析请求
3. 验证进度显示组件是否正常工作
4. 检查异步任务轮询是否成功

## 生产环境部署

### 1. 后端生产部署

#### 1.1 使用 Gunicorn + Uvicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 1.2 使用 Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 1.3 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 前端生产部署

#### 2.1 构建生产版本

```bash
npm run build
```

#### 2.2 部署到 Cloudflare Pages

1. 将构建后的 `build` 目录内容上传到 Cloudflare Pages
2. 配置环境变量 `REACT_APP_API_URL` 指向您的后端服务
3. 确保后端服务可以通过公网访问

#### 2.3 使用 Docker

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 监控和日志

### 1. 日志配置

后端日志已配置为结构化格式，建议在生产环境中：

- 配置日志轮转
- 集成日志聚合服务（如 ELK Stack）
- 设置日志级别为 INFO 或 WARNING

### 2. 性能监控

监控以下指标：

- 任务执行时间
- 任务成功率
- 内存使用情况
- API 响应时间

### 3. 告警设置

设置告警规则：

- 任务失败率 > 5%
- 平均执行时间 > 15 分钟
- 内存使用率 > 80%

## 故障排除

### 1. 常见问题

#### 任务启动失败

**症状**: 启动分析任务时返回 500 错误

**解决方案**:
- 检查后端服务状态
- 验证环境变量配置
- 查看后端日志

#### 轮询超时

**症状**: 前端轮询任务状态超时

**解决方案**:
- 检查网络连接
- 验证后端服务可访问性
- 调整轮询间隔和超时时间

#### 任务状态不更新

**症状**: 任务状态一直显示为 "processing"

**解决方案**:
- 检查后台任务是否正常运行
- 验证任务状态存储机制
- 查看任务执行日志

### 2. 调试方法

#### 后端调试

```bash
# 启用详细日志
export LOG_LEVEL=DEBUG
python start_server.py

# 查看实时日志
tail -f backend.log
```

#### 前端调试

1. 打开浏览器开发者工具
2. 查看 Console 和 Network 标签页
3. 检查轮询请求的响应
4. 验证任务状态更新

### 3. 性能优化

#### 轮询优化

- 根据任务复杂度调整轮询间隔
- 实现指数退避策略
- 考虑使用 WebSocket 替代轮询

#### 任务管理优化

- 实现任务队列管理
- 添加任务优先级
- 支持任务并行执行

## 安全考虑

### 1. 访问控制

- 实现用户认证和授权
- 限制任务创建频率
- 验证用户输入数据

### 2. 数据保护

- 加密敏感数据
- 实现数据访问审计
- 定期清理过期任务

### 3. API 安全

- 实现速率限制
- 添加请求验证
- 使用 HTTPS 传输

## 扩展功能

### 1. 任务队列

考虑集成 Redis 或 RabbitMQ 来管理任务队列：

```python
# 使用 Redis 存储任务状态
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def store_task_status(task_id, status):
    redis_client.setex(f"task:{task_id}", 3600, status)  # 1小时过期
```

### 2. 进度更新

实现更细粒度的进度更新：

```python
async def update_task_progress(task_id, progress, message):
    if task_id in analysis_tasks:
        analysis_tasks[task_id]["progress"] = progress
        analysis_tasks[task_id]["message"] = message
```

### 3. 任务历史

添加任务历史记录功能：

```python
# 保存任务执行历史
def save_task_history(task_id, user_background, result, execution_time):
    # 保存到数据库
    pass
```

## 总结

通过本指南，您应该能够成功部署异步分析功能，解决 Cloudflare 100秒超时限制问题。如果在部署过程中遇到任何问题，请参考故障排除部分或查看相关日志信息。

记住，这个解决方案不仅解决了当前的技术问题，还为未来的功能扩展提供了良好的基础架构。
