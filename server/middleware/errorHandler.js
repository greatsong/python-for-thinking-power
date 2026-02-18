export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || '서버 오류가 발생했습니다',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
