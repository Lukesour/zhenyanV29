// 获取API基础URL
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 在浏览器环境中进行动态检测
  if (typeof window !== 'undefined') {
    // 如果在生产环境（通过Cloudflare访问）
    if (window.location.hostname === 'zhenyan.asia' || window.location.hostname === 'www.zhenyan.asia') {
      return 'https://api.zhenyan.asia';
    }
  }

  // 默认开发环境
  return 'http://localhost:8000';
};