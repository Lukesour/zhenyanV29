// 检测当前环境并设置相应的API基础URL
const getApiBaseUrl = (): string => {
  // 如果在生产环境（通过Cloudflare访问）
  if (window.location.hostname === 'zhenyan.asia' || window.location.hostname === 'www.zhenyan.asia') {
    return 'https://api.zhenyan.asia';
  }
  
  // 开发环境或本地访问
  return process.env.REACT_APP_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();