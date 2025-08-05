/**
 * @fileoverview Controlador de usuarios
 * @author Marcela
 */

const { DatabaseService } = require('../services/databaseService');
const { AuthMiddleware } = require('../middleware/auth');
const { ValidationMiddleware } = require('../middleware/validation');
const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class UserController {
  /**
   * Registra un nuevo usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Usuario creado
   */
  static async register(req, res) {
    try {
      const userData = ValidationMiddleware.validateUserRegistration(req.body);
      
      // Verificar si el email ya existe
      const existingUser = DatabaseService.find('Users', { email: userData.email });
      if (existingUser.length > 0) {
        throw ErrorHandler.conflictError('El email ya está registrado');
      }

      // Crear usuario
      const newUser = DatabaseService.insert('Users', {
        ...userData,
        createdAt: new Date().toISOString()
      });

      // Generar token
      const token = AuthMiddleware.generateToken(newUser.id);

      LoggerService.info('User registered successfully', { userId: newUser.id });

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          goal: newUser.goal,
          experienceLevel: newUser.experienceLevel,
          onboardingCompleted: newUser.onboardingCompleted
        },
        token: token
      };
    } catch (error) {
      LoggerService.error('Error registering user', error);
      throw error;
    }
  }

  /**
   * Autentica un usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Usuario autenticado
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw ErrorHandler.validationError('Email y contraseña son requeridos');
      }

      // Buscar usuario por email
      const users = DatabaseService.find('Users', { email: email.toLowerCase() });
      if (users.length === 0) {
        throw ErrorHandler.authenticationError('Credenciales inválidas');
      }

      const user = users[0];

      // En un entorno real, aquí verificarías la contraseña
      // Para esta implementación, asumimos que la autenticación es exitosa
      
      // Generar token
      const token = AuthMiddleware.generateToken(user.id);

      LoggerService.info('User logged in successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          goal: user.goal,
          experienceLevel: user.experienceLevel,
          onboardingCompleted: user.onboardingCompleted
        },
        token: token
      };
    } catch (error) {
      LoggerService.error('Error logging in user', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Perfil del usuario
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos actualizados del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      LoggerService.info('User profile retrieved', { userId: user.id });

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        goal: userData.goal,
        experienceLevel: userData.experienceLevel,
        equipment: userData.equipment,
        onboardingCompleted: userData.onboardingCompleted,
        createdAt: userData.createdAt
      };
    } catch (error) {
      LoggerService.error('Error getting user profile', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Usuario encontrado
   */
  static async getUser(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw ErrorHandler.validationError('ID de usuario requerido');
      }

      const user = DatabaseService.findById('Users', id);
      if (!user) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      LoggerService.info('User retrieved by ID', { userId: id });

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
      LoggerService.error('Error getting user by ID', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Usuario actualizado
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw ErrorHandler.validationError('ID de usuario requerido');
      }

      // Verificar que el usuario existe
      const existingUser = DatabaseService.findById('Users', id);
      if (!existingUser) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Validar datos de actualización
      const validatedData = {};
      
      if (updateData.name) {
        if (updateData.name.trim().length < 2) {
          throw ErrorHandler.validationError('El nombre debe tener al menos 2 caracteres');
        }
        validatedData.name = updateData.name.trim();
      }

      if (updateData.email) {
        if (!ValidationMiddleware.isValidEmail(updateData.email)) {
          throw ErrorHandler.validationError('El email debe ser válido');
        }
        validatedData.email = updateData.email.toLowerCase().trim();
      }

      if (updateData.goal) {
        if (!ValidationMiddleware.isValidGoal(updateData.goal)) {
          throw ErrorHandler.validationError('El objetivo debe ser válido');
        }
        validatedData.goal = updateData.goal;
      }

      if (updateData.experienceLevel) {
        if (!ValidationMiddleware.isValidExperienceLevel(updateData.experienceLevel)) {
          throw ErrorHandler.validationError('El nivel de experiencia debe ser válido');
        }
        validatedData.experienceLevel = updateData.experienceLevel;
      }

      if (updateData.equipment) {
        validatedData.equipment = Array.isArray(updateData.equipment) ? updateData.equipment : [];
      }

      // Actualizar usuario
      const updatedUser = DatabaseService.update('Users', id, validatedData);

      LoggerService.info('User updated successfully', { userId: id });

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        goal: updatedUser.goal,
        experienceLevel: updatedUser.experienceLevel,
        equipment: updatedUser.equipment,
        onboardingCompleted: updatedUser.onboardingCompleted,
        createdAt: updatedUser.createdAt
      };
    } catch (error) {
      LoggerService.error('Error updating user', error);
      throw error;
    }
  }

  /**
   * Completa el onboarding del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Usuario con onboarding completado
   */
  static async completeOnboarding(req, res) {
    try {
      const { id } = req.params;
      const onboardingData = req.body;

      if (!id) {
        throw ErrorHandler.validationError('ID de usuario requerido');
      }

      // Verificar que el usuario existe
      const existingUser = DatabaseService.findById('Users', id);
      if (!existingUser) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Validar datos del onboarding
      const validatedData = ValidationMiddleware.validateOnboardingData(onboardingData);

      // Actualizar usuario con datos del onboarding
      const updatedUser = DatabaseService.update('Users', id, {
        ...validatedData,
        onboardingCompleted: true
      });

      LoggerService.info('User onboarding completed', { userId: id });

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        goal: updatedUser.goal,
        experienceLevel: updatedUser.experienceLevel,
        equipment: updatedUser.equipment,
        onboardingCompleted: updatedUser.onboardingCompleted,
        age: updatedUser.age,
        weight: updatedUser.weight,
        height: updatedUser.height,
        measurements: updatedUser.measurements,
        createdAt: updatedUser.createdAt
      };
    } catch (error) {
      LoggerService.error('Error completing user onboarding', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Confirmación de eliminación
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        throw ErrorHandler.validationError('ID de usuario requerido');
      }

      // Verificar que el usuario existe
      const existingUser = DatabaseService.findById('Users', id);
      if (!existingUser) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Eliminar usuario
      DatabaseService.delete('Users', id);

      LoggerService.info('User deleted successfully', { userId: id });

      return {
        message: 'Usuario eliminado correctamente',
        userId: id
      };
    } catch (error) {
      LoggerService.error('Error deleting user', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de usuarios
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Estadísticas de usuarios
   */
  static async getUserStats(req, res) {
    try {
      const allUsers = DatabaseService.getAll('Users');
      
      const stats = {
        total: allUsers.length,
        onboardingCompleted: allUsers.filter(u => u.onboardingCompleted).length,
        onboardingPending: allUsers.filter(u => !u.onboardingCompleted).length,
        byGoal: {},
        byExperienceLevel: {}
      };

      // Agrupar por objetivo
      allUsers.forEach(user => {
        if (user.goal) {
          stats.byGoal[user.goal] = (stats.byGoal[user.goal] || 0) + 1;
        }
        if (user.experienceLevel) {
          stats.byExperienceLevel[user.experienceLevel] = (stats.byExperienceLevel[user.experienceLevel] || 0) + 1;
        }
      });

      LoggerService.info('User stats retrieved');

      return stats;
    } catch (error) {
      LoggerService.error('Error getting user stats', error);
      throw error;
    }
  }
}

module.exports = UserController; 