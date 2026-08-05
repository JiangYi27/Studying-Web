/**
 * 请求日志中间件
 * 记录每个 HTTP 请求的方法、路径、状态码和耗时，便于排查问题。
 * 挂载后打印到控制台，本地开发/自用足够，无需引入完整日志库。
 */
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    // 简化：静态资源（非 /api）不刷屏，仅 API 与 4xx/5xx 打印
    const isApi = req.path.startsWith('/api');
    if (isApi || status >= 400) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${status} (${ms}ms)`);
    }
  });
  next();
};
