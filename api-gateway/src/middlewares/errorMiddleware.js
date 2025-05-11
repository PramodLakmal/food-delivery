const { StatusCodes } = require('http-status-codes');

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? StatusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
  console.error(`Error: ${err.message}`);
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

module.exports = {
  notFound,
  errorHandler
}; 
 
 