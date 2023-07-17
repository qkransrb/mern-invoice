const notFound = (req, res, next) => {
  const error = new Error(`That route does not exist - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    success: false,
    message: err.message,
    statusCode,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
