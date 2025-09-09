from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import json
import uuid
from typing import Dict, Optional

from pathlib import Path
from contextlib import asynccontextmanager
from models.schemas import UserBackground, AnalysisReport
from models.user_models import UserInfo
from api.errors import InvalidInput, NotFound, RateLimited, Timeout, DependencyUnavailable
from api.auth import router as auth_router, get_current_user, get_user_service
from services.analysis_service import AnalysisService
from services.user_service import UserService
from config.settings import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
analysis_service = None
user_service = None

# 存储异步任务状态
analysis_tasks: Dict[str, Dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global analysis_service, user_service
    logger.info("Starting up application...")
    try:
        analysis_service = AnalysisService()
        logger.info("Analysis service initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize analysis service: {e}")
        analysis_service = None

    try:
        user_service = UserService()
        logger.info("User service initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize user service: {e}")
        user_service = None

    logger.info("Application startup completed")
    yield
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title="留学定位与选校规划系统",
    description="基于AI和大数据的个性化留学申请分析平台",
    version="1.0.0",
    lifespan=lifespan
)

# 包含认证路由
app.include_router(auth_router)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Global error handling
# -----------------------------

def _build_error_response(
    *,
    code: str,
    http_status: int,
    message: str,
    reason: str | None = None,
    details: dict | None = None,
    retryable: bool | None = None,
):
    payload = {
        "code": code,
        "httpStatus": http_status,
        "message": message,
    }
    if reason is not None:
        payload["reason"] = reason
    if details is not None:
        payload["details"] = details
    if retryable is not None:
        payload["retryable"] = retryable
    return JSONResponse(status_code=http_status, content=payload)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    # 400 Invalid input with field-level details
    return _build_error_response(
        code="INVALID_INPUT",
        http_status=400,
        message="请求参数校验失败",
        reason="validation_error",
        details={"errors": exc.errors()},
        retryable=False,
    )


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    status = exc.status_code
    detail = exc.detail if isinstance(exc.detail, str) else "请求失败"
    if status == 400:
        return _build_error_response(
            code="INVALID_INPUT", http_status=400, message=detail, retryable=False
        )
    if status == 401:
        return _build_error_response(
            code="UNAUTHORIZED", http_status=401, message=detail, retryable=False
        )
    if status == 403:
        return _build_error_response(
            code="FORBIDDEN", http_status=403, message=detail, retryable=False
        )
    if status == 404:
        return _build_error_response(
            code="NOT_FOUND", http_status=404, message=detail, retryable=False
        )
    if status == 429:
        return _build_error_response(
            code="RATE_LIMITED", http_status=429, message=detail, retryable=True
        )
    if status == 503:
        return _build_error_response(
            code="DEPENDENCY_UNAVAILABLE", http_status=503, message=detail, retryable=True
        )
    if status == 408:
        return _build_error_response(
            code="TIMEOUT", http_status=408, message=detail, retryable=True
        )
    return _build_error_response(
        code="INTERNAL_ERROR", http_status=500, message=detail, retryable=False
    )


@app.exception_handler(Exception)
async def handle_generic_exception(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return _build_error_response(
        code="INTERNAL_ERROR",
        http_status=500,
        message="服务器内部错误，请稍后重试",
        retryable=False
    )

# -----------------------------
# Health check endpoints
# -----------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with service status"""
    try:
        # Check analysis service
        analysis_status = "healthy" if analysis_service else "unavailable"
        
        # Check database connection (if applicable)
        # db_status = "healthy" if check_db_connection() else "unavailable"
        
        return {
            "status": "healthy" if analysis_status == "healthy" else "degraded",
            "timestamp": "2024-01-01T00:00:00Z",
            "services": {
                "analysis": analysis_status,
                # "database": db_status,
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "error": str(e)
        }

# -----------------------------
# Analysis endpoints
# -----------------------------

async def process_analysis_task(task_id: str, user_background: UserBackground, user_id: Optional[int] = None):
    """后台处理分析任务"""
    try:
        # 更新任务状态为进行中
        analysis_tasks[task_id]["status"] = "processing"
        analysis_tasks[task_id]["progress"] = 0
        
        # 调用分析服务
        logger.info(f"Processing analysis task {task_id}")
        report = await analysis_service.generate_analysis_report(user_background)
        
        if report:
            # 任务成功完成
            analysis_tasks[task_id]["status"] = "completed"
            analysis_tasks[task_id]["progress"] = 100
            analysis_tasks[task_id]["result"] = report
            analysis_tasks[task_id]["completed_at"] = "2024-01-01T00:00:00Z"

            # 更新用户分析结果
            if user_id and user_service:
                await user_service.update_analysis_result(task_id, report.dict(), "completed")

            logger.info(f"Analysis task {task_id} completed successfully")
        else:
            # 任务失败
            analysis_tasks[task_id]["status"] = "failed"
            analysis_tasks[task_id]["error"] = "分析服务返回空结果"

            # 更新用户分析结果
            if user_id and user_service:
                await user_service.update_analysis_result(task_id, {}, "failed")

            logger.error(f"Analysis task {task_id} failed: service returned None")

    except Exception as e:
        # 任务出错
        analysis_tasks[task_id]["status"] = "failed"
        analysis_tasks[task_id]["error"] = str(e)

        # 更新用户分析结果
        if user_id and user_service:
            try:
                await user_service.update_analysis_result(task_id, {"error": str(e)}, "failed")
            except:
                pass  # 避免二次异常

        logger.error(f"Analysis task {task_id} failed with error: {str(e)}")

@app.post("/api/analyze")
async def analyze_user_background(
    user_background: UserBackground,
    background_tasks: BackgroundTasks,
    current_user: UserInfo = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    """
    异步分析用户背景并生成报告（需要用户认证）
    立即返回任务ID，前端需要轮询获取结果
    """
    try:
        logger.info(f"Received analysis request from user {current_user.id} ({user_background.undergraduate_university})")

        # 检查用户分析次数
        if current_user.remaining_analyses <= 0:
            raise HTTPException(
                status_code=403,
                detail="分析次数已用完，请邀请好友获得更多机会"
            )

        # 验证输入
        if not user_background.undergraduate_university or not user_background.undergraduate_major:
            raise HTTPException(
                status_code=400,
                detail="本科院校和专业信息是必填项"
            )

        if not user_background.target_countries or not user_background.target_majors:
            raise HTTPException(
                status_code=400,
                detail="目标国家和专业信息是必填项"
            )

        # 检查分析服务是否可用
        if not analysis_service:
            logger.error("Analysis service is not available")
            raise HTTPException(
                status_code=503,
                detail="非常抱歉，因网络问题，大模型无法连接，请联系客服获得免费择校定位与规划"
            )

        # 消耗一次分析机会
        await service.consume_analysis_chance(current_user.id)

        # 生成任务ID
        task_id = str(uuid.uuid4())

        # 创建任务记录
        analysis_tasks[task_id] = {
            "status": "pending",
            "progress": 0,
            "created_at": "2024-01-01T00:00:00Z",
            "user_background": user_background.dict(),
            "user_id": current_user.id
        }

        # 记录用户分析
        await service.record_analysis(current_user.id, task_id, user_background.dict())

        # 在后台启动分析任务
        background_tasks.add_task(process_analysis_task, task_id, user_background, current_user.id)

        logger.info(f"Analysis task {task_id} started for user {current_user.id}")

        return {
            "task_id": task_id,
            "status": "pending",
            "message": "分析任务已启动，请稍后查询结果",
            "estimated_time": "预计需要5-10分钟",
            "remaining_analyses": current_user.remaining_analyses - 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        error_msg = str(e).lower()
        
        # 检查是否是数据库/网络/连接/配置错误
        if ("数据库" in error_msg or "案例" in error_msg or "网络" in error_msg or "连接" in error_msg or 
            "network" in error_msg or "connection" in error_msg or "timeout" in error_msg or 
            "quota" in error_msg or "rate limit" in error_msg or "429" in error_msg or
            "gemini_api_key" in error_msg or "environment variable" in error_msg or "required" in error_msg):
            raise HTTPException(
                status_code=503,
                detail="非常抱歉，因网络问题，大模型无法连接，请联系客服获得免费择校定位与规划"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="分析报告生成失败，请稍后重试"
            )

@app.get("/api/analyze/{task_id}")
async def get_analysis_result(task_id: str):
    """
    获取分析任务结果
    """
    if task_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = analysis_tasks[task_id]
    
    if task["status"] == "completed":
        return {
            "task_id": task_id,
            "status": "completed",
            "result": task["result"],
            "completed_at": task["completed_at"]
        }
    elif task["status"] == "failed":
        return {
            "task_id": task_id,
            "status": "failed",
            "error": task["error"],
            "created_at": task["created_at"]
        }
    else:
        # 任务仍在进行中
        return {
            "task_id": task_id,
            "status": task["status"],
            "progress": task["progress"],
            "created_at": task["created_at"],
            "message": "分析进行中，请稍后查询"
        }

@app.delete("/api/analyze/{task_id}")
async def cancel_analysis_task(task_id: str):
    """
    取消分析任务
    """
    if task_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = analysis_tasks[task_id]
    
    if task["status"] in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="任务已完成或失败，无法取消")
    
    # 标记任务为已取消
    analysis_tasks[task_id]["status"] = "cancelled"
    
    return {"message": "任务已取消"}







@app.post("/api/refresh-data")
async def refresh_similarity_data(background_tasks: BackgroundTasks):
    """Refresh similarity matching data"""
    try:
        if analysis_service:
            background_tasks.add_task(analysis_service.refresh_similarity_data)
        return {"message": "数据刷新任务已启动"}
        
    except Exception as e:
        logger.error(f"Error refreshing data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"数据刷新失败: {str(e)}"
        )







@app.get("/api/similar-cases")
async def get_similar_cases(limit: int = 50):
    """Return top-N similar cases for a minimal default background (for exploration).
    Note: In real usage, the frontend should call /api/analyze with full background.
    This endpoint exposes a bounded list primarily for 'load more' UX.
    """
    try:
        if not analysis_service:
            raise HTTPException(status_code=503, detail="分析服务不可用")

        # Construct a minimal neutral background to fetch ranked cases
        # For exploration endpoint, we don't use user-sensitive inputs.
        dummy = UserBackground(
            undergraduate_university="",
            undergraduate_major="",
            gpa=0,
            gpa_scale="4.0",
            graduation_year=2000,
            target_countries=[],
            target_majors=[],
            target_degree_type="Master",
        )

        # use matcher directly to avoid LLM
        cases = analysis_service.similarity_matcher.find_similar_cases(dummy, top_n=max(1, min(limit, 200)))
        return {"items": cases}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching similar cases: {str(e)}")
        raise HTTPException(status_code=500, detail="获取相似案例失败")
