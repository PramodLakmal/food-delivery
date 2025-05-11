const { StatusCodes } = require('http-status-codes');

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === StatusCodes.OK ? 
    StatusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFound,
  errorHandler
}; 
 
 
 
 