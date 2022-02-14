const ErrorHandler = require('../utils/ErrorHandler');

const handleJwtError = () =>
  new ErrorHandler(401, 'Invalid token!.. Please login again 😊');

const handleJwtExpiredError = () =>
  new ErrorHandler(401, 'Expired token!.. Please login again 😊');

const handleDuplicateFieldsDB = err => {
  const valueObj = err.keyValue;
  const value = Object.values(valueObj)[0];
  const message = `Duplicate field value: ${value}.. Please use another value! 😊`;
  return new ErrorHandler(404, message);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')} 😊`;
  return new ErrorHandler(404, message);
};
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}. 😊`;
  return new ErrorHandler(404, message);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    res.status(500).json({
      status: 'Error 💥',
      message: 'Something went wrong 😲'
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error 💥';
  if (process.env.NODE_ENV === 'development') sendErrorDev(err, res);
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJwtError();
    if (err.name === 'TokenExpiredError') error = handleJwtExpiredError();
    sendErrorProd(error, res);
  }
};
