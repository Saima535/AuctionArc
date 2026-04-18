export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}
