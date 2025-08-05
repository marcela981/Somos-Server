/**
 * @fileoverview Middleware de manejo de errores para Express
 * @author Marcela
 */

const { logger } = require('../services/loggerService');

/**
 * Middleware de manejo de errores centralizado
 * @param {Error} error - Error capturado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const errorHandler = (error, req, res, next) => {
  logger.error('Error handled by errorHandler', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  let statusCode = 500;
  let message = 'Error interno del servidor';

  // Clasificar errores
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'AuthenticationError') {
    statusCode = 401;
    message = 'No autorizado';
  } else if (error.name === 'AuthorizationError') {
    statusCode = 403;
    message = 'Acceso denegado';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Recurso no encontrado';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = error.message;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  } else if (error.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Servicio no disponible';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Error de conexión';
  }

  const errorResponse = {
    success: false,
    error: {
      message: message,
      code: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores de validación de express-validator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const validationErrorHandler = (req, res, next) => {
  const errors = req.validationErrors();
  if (errors) {
    const error = new Error('Error de validación');
    error.name = 'ValidationError';
    error.details = errors;
    return next(error);
  }
  next();
};

/**
 * Middleware para manejar errores de async/await
 * @param {Function} fn - Función async a envolver
 * @returns {Function} Función envuelta con manejo de errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Crea un error de validación
 * @param {string} message - Mensaje de error
 * @returns {Error} Error de validación
 */
const createValidationError = (message) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  return error;
};

/**
 * Crea un error de autenticación
 * @param {string} message - Mensaje de error
 * @returns {Error} Error de autenticación
 */
const createAuthenticationError = (message = 'No autorizado') => {
  const error = new Error(message);
  error.name = 'AuthenticationError';
  return error;
};

/**
 * Crea un error de autorización
 * @param {string} message - Mensaje de error
 * @returns {Error} Error de autorización
 */
const createAuthorizationError = (message = 'Acceso denegado') => {
  const error = new Error(message);
  error.name = 'AuthorizationError';
  return error;
};

/**
 * Crea un error de recurso no encontrado
 * @param {string} message - Mensaje de error
 * @returns {Error} Error de not found
 */
const createNotFoundError = (message = 'Recurso no encontrado') => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  return error;
};

/**
 * Crea un error de conflicto
 * @param {string} message - Mensaje de error
 * @returns {Error} Error de conflicto
 */
const createConflictError = (message) => {
  const error = new Error(message);
  error.name = 'ConflictError';
  return error;
};

/**
 * Valida que un objeto exista
 * @param {Object} obj - Objeto a validar
 * @param {string} name - Nombre del objeto para el mensaje de error
 * @throws {Error} Error si el objeto no existe
 */
const requireExists = (obj, name = 'Recurso') => {
  if (!obj) {
    throw createNotFoundError(`${name} no encontrado`);
  }
};

/**
 * Valida que un campo sea requerido
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @throws {Error} Error si el campo está vacío
 */
const requireField = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw createValidationError(`El campo '${fieldName}' es requerido`);
  }
};

/**
 * Valida que un valor esté en un rango
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @param {string} fieldName - Nombre del campo
 * @throws {Error} Error si el valor está fuera del rango
 */
const requireRange = (value, min, max, fieldName) => {
  if (value < min || value > max) {
    throw createValidationError(`El campo '${fieldName}' debe estar entre ${min} y ${max}`);
  }
};

/**
 * Valida que un valor sea un email válido
 * @param {string} email - Email a validar
 * @param {string} fieldName - Nombre del campo
 * @throws {Error} Error si el email no es válido
 */
const requireValidEmail = (email, fieldName = 'email') => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError(`El campo '${fieldName}' debe ser un email válido`);
  }
};

/**
 * Valida que un valor tenga una longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @param {string} fieldName - Nombre del campo
 * @throws {Error} Error si el valor es muy corto
 */
const requireMinLength = (value, minLength, fieldName) => {
  if (!value || value.length < minLength) {
    throw createValidationError(`El campo '${fieldName}' debe tener al menos ${minLength} caracteres`);
  }
};

/**
 * Valida que un valor tenga una longitud máxima
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @throws {Error} Error si el valor es muy largo
 */
const requireMaxLength = (value, maxLength, fieldName) => {
  if (value && value.length > maxLength) {
    throw createValidationError(`El campo '${fieldName}' no puede tener más de ${maxLength} caracteres`);
  }
};

module.exports = {
  errorHandler,
  validationErrorHandler,
  asyncHandler,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  requireExists,
  requireField,
  requireRange,
  requireValidEmail,
  requireMinLength,
  requireMaxLength
}; 