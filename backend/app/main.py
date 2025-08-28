from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import json

from pathlib import Path
from contextlib import asynccontextmanager
from models.schemas import UserBackground, AnalysisReport
from api.errors import InvalidInput, NotFound, RateLimited, Timeout, DependencyUnavailable
from services.analysis_service import AnalysisService
from config.settings import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global analysis service instance
analysis_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global analysis_service
    logger.info("Starting up application...")
    try:
        analysis_service = AnalysisService()
        logger.info("Analysis service initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize analysis service: {e}")
        analysis_service = None
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
            code="DEPENDENCY_UNAVAILABLE",
            http_status=503,
            message=detail,
            retryable=True,
        )
    return _build_error_response(
        code="INTERNAL_ERROR", http_status=status or 500, message=detail, retryable=False
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return _build_error_response(
        code="INTERNAL_ERROR",
        http_status=500,
        message="服务器内部错误",
        reason="unhandled_exception",
        retryable=False,
    )


@app.exception_handler(InvalidInput)
async def handle_invalid_input(request: Request, exc: InvalidInput):
    return _build_error_response(
        code="INVALID_INPUT",
        http_status=400,
        message=exc.message,
        reason="invalid_input",
        details=exc.details,
        retryable=False,
    )


@app.exception_handler(NotFound)
async def handle_not_found(request: Request, exc: NotFound):
    return _build_error_response(
        code="NOT_FOUND",
        http_status=404,
        message=exc.message,
        retryable=False,
    )


@app.exception_handler(RateLimited)
async def handle_rate_limited(request: Request, exc: RateLimited):
    return _build_error_response(
        code="RATE_LIMITED",
        http_status=429,
        message=exc.message,
        retryable=True,
    )


@app.exception_handler(Timeout)
async def handle_timeout(request: Request, exc: Timeout):
    return _build_error_response(
        code="TIMEOUT",
        http_status=503,
        message=exc.message,
        reason="timeout",
        retryable=True,
    )


@app.exception_handler(DependencyUnavailable)
async def handle_dependency_unavailable(request: Request, exc: DependencyUnavailable):
    return _build_error_response(
        code="DEPENDENCY_UNAVAILABLE",
        http_status=503,
        message=exc.message,
        retryable=True,
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://zhenyan.asia",
        "https://www.zhenyan.asia"
    ],  # React dev server + Cloudflare domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "留学定位与选校规划系统 API", "status": "running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        app_ok = True
        model_available = bool(settings.GEMINI_API_KEY)
        similarity_loaded = False
        config_ok = True

        if analysis_service:
            try:
                # Do not trigger heavy loads; only read flags where available
                sim = analysis_service.similarity_matcher
                similarity_loaded = bool(getattr(sim, "_data_loaded", False))
            except Exception:
                similarity_loaded = False
            try:
                # UniversityScoringService loads config on init; assume ok if instance exists
                config_ok = analysis_service.similarity_matcher.university_scoring_service is not None
            except Exception:
                config_ok = False

        return {
            "app": {"ok": app_ok, "message": "service online"},
            "model_available": {"ok": model_available, "message": "api key configured" if model_available else "model not configured"},
            "similarity_data_loaded": {"ok": similarity_loaded, "message": "loaded" if similarity_loaded else "lazy or not loaded"},
            "config_ok": {"ok": config_ok, "message": "config loaded" if config_ok else "config error"}
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )



@app.post("/api/analyze", response_model=AnalysisReport)
async def analyze_user_background(user_background: UserBackground):
    """
    Analyze user background and generate comprehensive report
    """
    try:
        logger.info(f"Received analysis request from {user_background.undergraduate_university}")
        
        # Validate input
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
        
        # Check if analysis service is available
        if not analysis_service:
            logger.error("Analysis service is not available")
            raise HTTPException(
                status_code=503,
                detail="非常抱歉，因网络问题，大模型无法连接，请联系客服获得免费择校定位与规划"
            )
        
        # Call analysis service
        logger.info("Calling analysis service...")
        report = await analysis_service.generate_analysis_report(user_background)
        
        if not report:
            logger.error("Analysis service returned None")
            raise HTTPException(
                status_code=503,
                detail="非常抱歉，因网络问题，大模型无法连接，请联系客服获得免费择校定位与规划"
            )
        
        logger.info(f"Analysis completed successfully, similar_cases count: {len(report.similar_cases)}")
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        error_msg = str(e).lower()
        
        # Check if it's a database/network/connection/configuration error
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
