# 项目运行指南

## 概述

本指南将教您如何分别运行 Cloudflare Tunnel 和项目后端服务。

## 1. 运行 Cloudflare Tunnel

### 1.1 检查 Cloudflared 安装

```bash
# 检查是否已安装
which cloudflared

# 如果未安装，使用 Homebrew 安装
brew install cloudflare/cloudflare/cloudflared
```

### 1.2 配置 Cloudflare Tunnel

项目根目录下的 `cloudflared_config.yml` 文件已经配置好了：

```yaml
tunnel: zhenyanasia
protocol: http2

ingress:
  # 前端服务
  - hostname: zhenyan.asia
    service: http://localhost:3000
  # 后端 API 服务
  - hostname: api.zhenyan.asia
    service: http://localhost:8000
  # 404 处理
  - service: http_status:404
```

### 1.3 启动 Cloudflare Tunnel

```bash
# 在项目根目录下运行
cloudflared tunnel --config cloudflared_config.yml run zhenyanasia
```

**说明**：
- 这个命令会启动 Cloudflare Tunnel
- 将本地服务暴露到公网
- 前端通过 `zhenyan.asia` 访问
- 后端 API 通过 `api.zhenyan.asia` 访问

### 1.4 验证 Tunnel 状态

启动后，您应该看到类似输出：
```
2024-01-01T00:00:00Z INF Starting tunnel tunnelID=xxx
2024-01-01T00:00:00Z INF Version 2024.1.0
2024-01-01T00:00:00Z INF Requesting new quick tunnel on trycloudflare.com
```

## 2. 运行项目后端

### 2.1 进入后端目录

```bash
cd backend
```

### 2.2 设置环境变量

```bash
# 复制环境配置文件
cp config.env.example config.env

# 编辑配置文件（如果需要修改）
nano config.env
```

**重要配置项**：
- `SUPABASE_URL`: Supabase 数据库地址
- `SUPABASE_KEY`: Supabase API 密钥
- `GEMINI_API_KEY`: Google Gemini API 密钥
- `DEBUG`: 调试模式开关
- `LOG_LEVEL`: 日志级别

### 2.3 安装依赖（如果需要）

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 或者使用 conda
conda install --file requirements.txt
```

### 2.4 启动后端服务

```bash
# 使用启动脚本
python start_server.py

# 或者直接使用 uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2.5 验证后端服务

```bash
# 健康检查
curl http://localhost:8000/health

# 查看 API 文档
open http://localhost:8000/docs
```

**预期输出**：
```json
{
  "app": {"ok": true, "message": "service online"},
  "model_available": {"ok": true, "message": "api key configured"},
  "similarity_data_loaded": {"ok": true, "message": "loaded"},
  "config_ok": {"ok": true, "message": "config loaded"}
}
```

## 3. 运行前端（可选）

### 3.1 进入前端目录

```bash
cd frontend
```

### 3.2 安装依赖

```bash
npm install
```

### 3.3 启动开发服务器

```bash
npm start
```

前端将在 `http://localhost:3000` 启动。

## 4. 完整的启动流程

### 4.1 终端 1：启动 Cloudflare Tunnel

```bash
# 在项目根目录
cloudflared tunnel --config cloudflared_config.yml run zhenyanasia
```

### 4.2 终端 2：启动后端服务

```bash
# 进入后端目录
cd backend

# 启动后端
python start_server.py
```

### 4.3 终端 3：启动前端服务（可选）

```bash
# 进入前端目录
cd frontend

# 启动前端
npm start
```

## 5. 访问地址

启动完成后，您可以通过以下地址访问：

- **前端**: https://zhenyan.asia
- **后端 API**: https://api.zhenyan.asia
- **API 文档**: https://api.zhenyan.asia/docs
- **健康检查**: https://api.zhenyan.asia/health

## 6. 故障排除

### 6.1 Cloudflare Tunnel 问题

```bash
# 检查 tunnel 状态
cloudflared tunnel list

# 查看 tunnel 日志
cloudflared tunnel info zhenyanasia

# 重新认证（如果需要）
cloudflared tunnel login
```

### 6.2 后端服务问题

```bash
# 检查端口占用
lsof -i :8000

# 检查日志
tail -f backend.log

# 重启服务
pkill -f "python start_server.py"
python start_server.py
```

### 6.3 环境变量问题

```bash
# 检查环境变量
echo $GEMINI_API_KEY
echo $SUPABASE_URL

# 重新加载环境变量
source config.env
```

## 7. 开发模式

### 7.1 后端开发

```bash
# 启用调试模式
export DEBUG=True
export LOG_LEVEL=DEBUG

# 启动服务
python start_server.py
```

### 7.2 前端开发

```bash
# 启动开发服务器
npm start

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 8. 生产部署

### 8.1 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动生产服务
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 8.2 使用 Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 9. 监控和日志

### 9.1 查看服务状态

```bash
# 检查所有服务状态
ps aux | grep -E "(cloudflared|python|node)"

# 检查端口占用
netstat -tulpn | grep -E "(3000|8000)"
```

### 9.2 查看日志

```bash
# 后端日志
tail -f backend.log

# Cloudflare Tunnel 日志
cloudflared tunnel logs zhenyanasia
```

## 10. 安全注意事项

1. **API 密钥**: 确保 `config.env` 文件不被提交到版本控制
2. **端口安全**: 确保只开放必要的端口
3. **访问控制**: 在生产环境中设置适当的访问控制
4. **HTTPS**: Cloudflare Tunnel 自动提供 HTTPS

## 总结

按照以上步骤，您可以成功运行：
- ✅ Cloudflare Tunnel（公网访问）
- ✅ 后端 API 服务（异步任务支持）
- ✅ 前端开发服务器（可选）

所有服务启动后，您的异步任务解决方案就可以正常工作了！
