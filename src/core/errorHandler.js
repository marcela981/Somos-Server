/**
 * @fileoverview Manejador centralizado de errores
 * @author Marcela
 */

const { LoggerService } = require('../services/loggerService');

class ErrorHandler {
  /**
   * Maneja errores de la aplicación
   * @param {Error} error - Error a manejar
   * @returns {ContentService} Respuesta HTTP con error
   */
  static handle(error) {
    LoggerService.error('Error handled by ErrorHandler', error);

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
    } else if (error.message.includes('Ruta no encontrada')) {
      statusCode = 404;
      message = 'Endpoint no encontrado';
    } else if (error.message.includes('Método HTTP no soportado')) {
      statusCode = 405;
      message = 'Método HTTP no permitido';
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

    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /**
   * Crea un error de validación
   * @param {string} message - Mensaje de error
   * @returns {Error} Error de validación
   */
  static validationError(message) {
    const error = new Error(message);
    error.name = 'ValidationError';
    return error;
  }

  /**
   * Crea un error de autenticación
   * @param {string} message - Mensaje de error
   * @returns {Error} Error de autenticación
   */
  static authenticationError(message = 'No autorizado') {
    const error = new Error(message);
    error.name = 'AuthenticationError';
    return error;
  }

  /**
   * Crea un error de autorización
   * @param {string} message - Mensaje de error
   * @returns {Error} Error de autorización
   */
  static authorizationError(message = 'Acceso denegado') {
    const error = new Error(message);
    error.name = 'AuthorizationError';
    return error;
  }

  /**
   * Crea un error de recurso no encontrado
   * @param {string} message - Mensaje de error
   * @returns {Error} Error de not found
   */
  static notFoundError(message = 'Recurso no encontrado') {
    const error = new Error(message);
    error.name = 'NotFoundError';
    return error;
  }

  /**
   * Crea un error de conflicto
   * @param {string} message - Mensaje de error
   * @returns {Error} Error de conflicto
   */
  static conflictError(message) {
    const error = new Error(message);
    error.name = 'ConflictError';
    return error;
  }

  /**
   * Valida que un objeto exista
   * @param {Object} obj - Objeto a validar
   * @param {string} name - Nombre del objeto para el mensaje de error
   * @throws {Error} Error si el objeto no existe
   */
  static requireExists(obj, name = 'Recurso') {
    if (!obj) {
      throw this.notFoundError(`${name} no encontrado`);
    }
  }

  /**
   * Valida que un campo sea requerido
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nombre del campo
   * @throws {Error} Error si el campo está vacío
   */
  static requireField(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      throw this.validationError(`El campo '${fieldName}' es requerido`);
    }
  }

  /**
   * Valida que un valor esté en un rango
   * @param {number} value - Valor a validar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @param {string} fieldName - Nombre del campo
   * @throws {Error} Error si el valor está fuera del rango
   */
  static requireRange(value, min, max, fieldName) {
    if (value < min || value > max) {
      throw this.validationError(`El campo '${fieldName}' debe estar entre ${min} y ${max}`);
    }
  }
}

module.exports = { ErrorHandler }; 