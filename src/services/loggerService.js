/**
 * @fileoverview Servicio de logging usando Winston
 * @author Marcela
 */

const winston = require('winston');
const { format } = winston;

// Configurar formato de logs
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Configurar transportes
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  })
];

// Agregar file transport en producción
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // No salir en caso de error
  exitOnError: false
});

class LoggerService {
  /**
   * Log de nivel error
   * @param {string} message - Mensaje del log
   * @param {Object} details - Detalles adicionales
   * @param {string} userId - ID del usuario (opcional)
   */
  static error(message, details = null, userId = null) {
    const logData = {
      message,
      details,
      userId,
      timestamp: new Date().toISOString()
    };
    
    logger.error(message, logData);
  }

  /**
   * Log de nivel warn
   * @param {string} message - Mensaje del log
   * @param {Object} details - Detalles adicionales
   * @param {string} userId - ID del usuario (opcional)
   */
  static warn(message, details = null, userId = null) {
    const logData = {
      message,
      details,
      userId,
      timestamp: new Date().toISOString()
    };
    
    logger.warn(message, logData);
  }

  /**
   * Log de nivel info
   * @param {string} message - Mensaje del log
   * @param {Object} details - Detalles adicionales
   * @param {string} userId - ID del usuario (opcional)
   */
  static info(message, details = null, userId = null) {
    const logData = {
      message,
      details,
      userId,
      timestamp: new Date().toISOString()
    };
    
    logger.info(message, logData);
  }

  /**
   * Log de nivel debug
   * @param {string} message - Mensaje del log
   * @param {Object} details - Detalles adicionales
   * @param {string} userId - ID del usuario (opcional)
   */
  static debug(message, details = null, userId = null) {
    const logData = {
      message,
      details,
      userId,
      timestamp: new Date().toISOString()
    };
    
    logger.debug(message, logData);
  }

  /**
   * Log genérico
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje del log
   * @param {Object} details - Detalles adicionales
   * @param {string} userId - ID del usuario (opcional)
   */
  static log(level, message, details = null, userId = null) {
    const logData = {
      message,
      details,
      userId,
      timestamp: new Date().toISOString()
    };
    
    logger.log(level, message, logData);
  }

  /**
   * Log de actividad del usuario
   * @param {string} userId - ID del usuario
   * @param {string} action - Acción realizada
   * @param {Object} details - Detalles de la acción
   */
  static userActivity(userId, action, details = {}) {
    this.info(`User activity: ${action}`, {
      ...details,
      action,
      type: 'user_activity'
    }, userId);
  }

  /**
   * Log de error de API
   * @param {string} endpoint - Endpoint de la API
   * @param {Error} error - Error ocurrido
   * @param {string} userId - ID del usuario (opcional)
   */
  static apiError(endpoint, error, userId = null) {
    this.error(`API Error in ${endpoint}`, {
      endpoint,
      error: error.message,
      stack: error.stack,
      type: 'api_error'
    }, userId);
  }

  /**
   * Log de performance
   * @param {string} operation - Operación medida
   * @param {number} duration - Duración en milisegundos
   * @param {Object} details - Detalles adicionales
   */
  static performance(operation, duration, details = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...details,
      type: 'performance'
    });
  }

  /**
   * Log de seguridad
   * @param {string} event - Evento de seguridad
   * @param {Object} details - Detalles del evento
   * @param {string} userId - ID del usuario (opcional)
   */
  static security(event, details = {}, userId = null) {
    this.warn(`Security event: ${event}`, {
      ...details,
      event,
      type: 'security'
    }, userId);
  }

  /**
   * Log de auditoría
   * @param {string} action - Acción auditada
   * @param {Object} details - Detalles de la acción
   * @param {string} userId - ID del usuario
   */
  static audit(action, details = {}, userId) {
    this.info(`Audit: ${action}`, {
      ...details,
      action,
      type: 'audit'
    }, userId);
  }

  /**
   * Log de métricas
   * @param {string} metric - Nombre de la métrica
   * @param {number} value - Valor de la métrica
   * @param {Object} tags - Tags adicionales
   */
  static metric(metric, value, tags = {}) {
    this.info(`Metric: ${metric}`, {
      metric,
      value,
      tags,
      type: 'metric'
    });
  }

  /**
   * Log de inicio de sesión
   * @param {string} userId - ID del usuario
   * @param {Object} details - Detalles del login
   */
  static login(userId, details = {}) {
    this.info('User login', {
      ...details,
      type: 'login'
    }, userId);
  }

  /**
   * Log de cierre de sesión
   * @param {string} userId - ID del usuario
   * @param {Object} details - Detalles del logout
   */
  static logout(userId, details = {}) {
    this.info('User logout', {
      ...details,
      type: 'logout'
    }, userId);
  }

  /**
   * Log de creación de recurso
   * @param {string} resourceType - Tipo de recurso
   * @param {string} resourceId - ID del recurso
   * @param {string} userId - ID del usuario
   */
  static resourceCreated(resourceType, resourceId, userId) {
    this.info(`Resource created: ${resourceType}`, {
      resourceType,
      resourceId,
      type: 'resource_created'
    }, userId);
  }

  /**
   * Log de actualización de recurso
   * @param {string} resourceType - Tipo de recurso
   * @param {string} resourceId - ID del recurso
   * @param {string} userId - ID del usuario
   */
  static resourceUpdated(resourceType, resourceId, userId) {
    this.info(`Resource updated: ${resourceType}`, {
      resourceType,
      resourceId,
      type: 'resource_updated'
    }, userId);
  }

  /**
   * Log de eliminación de recurso
   * @param {string} resourceType - Tipo de recurso
   * @param {string} resourceId - ID del recurso
   * @param {string} userId - ID del usuario
   */
  static resourceDeleted(resourceType, resourceId, userId) {
    this.info(`Resource deleted: ${resourceType}`, {
      resourceType,
      resourceId,
      type: 'resource_deleted'
    }, userId);
  }

  /**
   * Log de error de base de datos
   * @param {string} operation - Operación de BD
   * @param {Error} error - Error ocurrido
   * @param {string} userId - ID del usuario (opcional)
   */
  static databaseError(operation, error, userId = null) {
    this.error(`Database error in ${operation}`, {
      operation,
      error: error.message,
      stack: error.stack,
      type: 'database_error'
    }, userId);
  }

  /**
   * Log de error de IA
   * @param {string} operation - Operación de IA
   * @param {Error} error - Error ocurrido
   * @param {string} userId - ID del usuario (opcional)
   */
  static aiError(operation, error, userId = null) {
    this.error(`AI error in ${operation}`, {
      operation,
      error: error.message,
      stack: error.stack,
      type: 'ai_error'
    }, userId);
  }

  /**
   * Log de inicio de aplicación
   * @param {Object} config - Configuración de la app
   */
  static appStart(config = {}) {
    this.info('Application started', {
      ...config,
      type: 'app_start'
    });
  }

  /**
   * Log de cierre de aplicación
   * @param {string} reason - Razón del cierre
   */
  static appShutdown(reason = 'Unknown') {
    this.info('Application shutdown', {
      reason,
      type: 'app_shutdown'
    });
  }
}

module.exports = { LoggerService, logger }; 