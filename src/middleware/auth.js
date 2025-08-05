/**
 * @fileoverview Middleware de autenticación usando JWT
 * @author Marcela
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DatabaseService } = require('../services/databaseService');
const { logger } = require('../services/loggerService');

class AuthMiddleware {
  /**
   * Middleware de autenticación principal
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static authenticate(req, res, next) {
    try {
      // Rutas públicas que no requieren autenticación
      const publicRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/health'
      ];

      if (publicRoutes.includes(req.path)) {
        return next();
      }

      // Obtener token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token de autenticación requerido',
            code: 401
          }
        });
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el usuario existe en la base de datos
      DatabaseService.findById('users', decoded.userId)
        .then(user => {
          if (!user) {
            return res.status(401).json({
              success: false,
              error: {
                message: 'Usuario no encontrado',
                code: 401
              }
            });
          }

          // Agregar usuario al request
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            goal: user.goal,
            experienceLevel: user.experienceLevel,
            equipment: user.equipment,
            onboardingCompleted: user.onboardingCompleted
          };

          logger.info('User authenticated', { 
            userId: user.id, 
            path: req.path 
          });

          next();
        })
        .catch(error => {
          logger.error('Error verifying user', error);
          return res.status(401).json({
            success: false,
            error: {
              message: 'Token inválido',
              code: 401
            }
          });
        });

    } catch (error) {
      logger.error('Authentication error', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token inválido',
            code: 401
          }
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token expirado',
            code: 401
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Error de autenticación',
          code: 500
        }
      });
    }
  }

  /**
   * Middleware para verificar que el usuario ha completado el onboarding
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static requireOnboarding(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Usuario no autenticado',
          code: 401
        }
      });
    }

    if (!req.user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Debes completar el onboarding antes de continuar',
          code: 400
        }
      });
    }

    next();
  }

  /**
   * Middleware para verificar permisos de administrador
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Usuario no autenticado',
          code: 401
        }
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Acceso denegado: se requieren permisos de administrador',
          code: 403
        }
      });
    }

    next();
  }

  /**
   * Middleware para verificar que el usuario puede acceder a un recurso específico
   * @param {string} resourceUserIdField - Campo que contiene el userId del recurso
   * @returns {Function} Middleware function
   */
  static requireOwnership(resourceUserIdField = 'userId') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Usuario no autenticado',
            code: 401
          }
        });
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'ID de usuario del recurso requerido',
            code: 400
          }
        });
      }

      if (req.user.id !== resourceUserId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'No tienes permisos para acceder a este recurso',
            code: 403
          }
        });
      }

      next();
    };
  }

  /**
   * Genera un token JWT
   * @param {string} userId - ID del usuario
   * @returns {string} Token JWT
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Verifica si un usuario existe
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si el usuario existe
   */
  static async userExists(userId) {
    try {
      const user = await DatabaseService.findById('users', userId);
      return !!user;
    } catch (error) {
      logger.error('Error checking if user exists', error);
      return false;
    }
  }

  /**
   * Obtiene información del usuario actual
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Información del usuario
   */
  static async getUserInfo(userId) {
    try {
      const user = await DatabaseService.findById('users', userId);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        experienceLevel: user.experienceLevel,
        equipment: user.equipment,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('Error getting user info', error);
      return null;
    }
  }

  /**
   * Hashea una contraseña
   * @param {string} password - Contraseña a hashear
   * @returns {Promise<string>} Contraseña hasheada
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica una contraseña
   * @param {string} password - Contraseña sin hashear
   * @param {string} hashedPassword - Contraseña hasheada
   * @returns {Promise<boolean>} True si la contraseña es correcta
   */
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Middleware para verificar que el usuario está activo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static requireActiveUser(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Usuario no autenticado',
          code: 401
        }
      });
    }

    if (req.user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Cuenta inactiva. Contacta al administrador.',
          code: 403
        }
      });
    }

    next();
  }

  /**
   * Middleware para verificar permisos específicos
   * @param {Array} requiredPermissions - Permisos requeridos
   * @returns {Function} Middleware function
   */
  static requirePermissions(requiredPermissions) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Usuario no autenticado',
            code: 401
          }
        });
      }

      const userPermissions = req.user.permissions || [];
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Permisos insuficientes',
            code: 403
          }
        });
      }

      next();
    };
  }
}

module.exports = { AuthMiddleware }; 