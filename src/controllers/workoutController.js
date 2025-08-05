/**
 * @fileoverview Controlador de entrenamientos
 * @author Marcela
 */

const { DatabaseService } = require('../services/databaseService');
const { ValidationMiddleware } = require('../middleware/validation');
const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class WorkoutController {
  /**
   * Obtiene los entrenamientos del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Array} Lista de entrenamientos
   */
  static async getWorkouts(req, res) {
    try {
      const user = req.user;
      const { limit, offset, startDate, endDate } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      let workouts = DatabaseService.find('Workouts', { userId: user.id });

      // Filtrar por fechas si se especifican
      if (startDate || endDate) {
        workouts = workouts.filter(workout => {
          const workoutDate = new Date(workout.timestamp);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return workoutDate >= start && workoutDate <= end;
        });
      }

      // Ordenar por fecha (más reciente primero)
      workouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Aplicar paginación
      const start = offset ? parseInt(offset) : 0;
      const limitNum = limit ? parseInt(limit) : 50;
      const paginatedWorkouts = workouts.slice(start, start + limitNum);

      LoggerService.info('Workouts retrieved', { 
        userId: user.id, 
        count: paginatedWorkouts.length 
      });

      return {
        workouts: paginatedWorkouts,
        pagination: {
          total: workouts.length,
          limit: limitNum,
          offset: start,
          hasMore: start + limitNum < workouts.length
        }
      };
    } catch (error) {
      LoggerService.error('Error getting workouts', error);
      throw error;
    }
  }

  /**
   * Obtiene un entrenamiento específico
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Entrenamiento encontrado
   */
  static async getWorkout(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      if (!id) {
        throw ErrorHandler.validationError('ID de entrenamiento requerido');
      }

      const workout = DatabaseService.findById('Workouts', id);
      if (!workout) {
        throw ErrorHandler.notFoundError('Entrenamiento no encontrado');
      }

      // Verificar que el entrenamiento pertenece al usuario
      if (workout.userId !== user.id) {
        throw ErrorHandler.authorizationError('No tienes permisos para ver este entrenamiento');
      }

      LoggerService.info('Workout retrieved', { 
        userId: user.id, 
        workoutId: id 
      });

      return workout;
    } catch (error) {
      LoggerService.error('Error getting workout', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo entrenamiento
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Entrenamiento creado
   */
  static async createWorkout(req, res) {
    try {
      const user = req.user;
      const workoutData = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Validar datos del entrenamiento
      const validatedData = ValidationMiddleware.validateWorkoutLog(workoutData);

      // Crear entrenamiento
      const newWorkout = DatabaseService.insert('Workouts', {
        ...validatedData,
        userId: user.id
      });

      LoggerService.info('Workout created', { 
        userId: user.id, 
        workoutId: newWorkout.id 
      });

      return newWorkout;
    } catch (error) {
      LoggerService.error('Error creating workout', error);
      throw error;
    }
  }

  /**
   * Actualiza un entrenamiento
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Entrenamiento actualizado
   */
  static async updateWorkout(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const updateData = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      if (!id) {
        throw ErrorHandler.validationError('ID de entrenamiento requerido');
      }

      // Verificar que el entrenamiento existe
      const existingWorkout = DatabaseService.findById('Workouts', id);
      if (!existingWorkout) {
        throw ErrorHandler.notFoundError('Entrenamiento no encontrado');
      }

      // Verificar que el entrenamiento pertenece al usuario
      if (existingWorkout.userId !== user.id) {
        throw ErrorHandler.authorizationError('No tienes permisos para actualizar este entrenamiento');
      }

      // Validar datos de actualización
      const validatedData = ValidationMiddleware.validateWorkoutLog(updateData);

      // Actualizar entrenamiento
      const updatedWorkout = DatabaseService.update('Workouts', id, validatedData);

      LoggerService.info('Workout updated', { 
        userId: user.id, 
        workoutId: id 
      });

      return updatedWorkout;
    } catch (error) {
      LoggerService.error('Error updating workout', error);
      throw error;
    }
  }

  /**
   * Elimina un entrenamiento
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Confirmación de eliminación
   */
  static async deleteWorkout(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      if (!id) {
        throw ErrorHandler.validationError('ID de entrenamiento requerido');
      }

      // Verificar que el entrenamiento existe
      const existingWorkout = DatabaseService.findById('Workouts', id);
      if (!existingWorkout) {
        throw ErrorHandler.notFoundError('Entrenamiento no encontrado');
      }

      // Verificar que el entrenamiento pertenece al usuario
      if (existingWorkout.userId !== user.id) {
        throw ErrorHandler.authorizationError('No tienes permisos para eliminar este entrenamiento');
      }

      // Eliminar entrenamiento
      DatabaseService.delete('Workouts', id);

      LoggerService.info('Workout deleted', { 
        userId: user.id, 
        workoutId: id 
      });

      return {
        message: 'Entrenamiento eliminado correctamente',
        workoutId: id
      };
    } catch (error) {
      LoggerService.error('Error deleting workout', error);
      throw error;
    }
  }

  /**
   * Agrega feedback a un entrenamiento
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Entrenamiento con feedback
   */
  static async addFeedback(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { feedback, difficulty, enjoyment } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      if (!id) {
        throw ErrorHandler.validationError('ID de entrenamiento requerido');
      }

      // Verificar que el entrenamiento existe
      const existingWorkout = DatabaseService.findById('Workouts', id);
      if (!existingWorkout) {
        throw ErrorHandler.notFoundError('Entrenamiento no encontrado');
      }

      // Verificar que el entrenamiento pertenece al usuario
      if (existingWorkout.userId !== user.id) {
        throw ErrorHandler.authorizationError('No tienes permisos para agregar feedback a este entrenamiento');
      }

      // Validar feedback
      const feedbackData = {};
      
      if (feedback !== undefined) {
        feedbackData.feedback = ValidationMiddleware.sanitizeString(feedback);
      }

      if (difficulty !== undefined) {
        if (difficulty < 1 || difficulty > 10) {
          throw ErrorHandler.validationError('La dificultad debe estar entre 1 y 10');
        }
        feedbackData.difficulty = parseInt(difficulty);
      }

      if (enjoyment !== undefined) {
        if (enjoyment < 1 || enjoyment > 10) {
          throw ErrorHandler.validationError('El disfrute debe estar entre 1 y 10');
        }
        feedbackData.enjoyment = parseInt(enjoyment);
      }

      // Actualizar entrenamiento con feedback
      const updatedWorkout = DatabaseService.update('Workouts', id, feedbackData);

      LoggerService.info('Workout feedback added', { 
        userId: user.id, 
        workoutId: id 
      });

      return updatedWorkout;
    } catch (error) {
      LoggerService.error('Error adding workout feedback', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de entrenamientos
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Estadísticas de entrenamientos
   */
  static async getWorkoutStats(req, res) {
    try {
      const user = req.user;
      const { timeRange } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      let workouts = DatabaseService.find('Workouts', { userId: user.id });

      // Filtrar por rango de tiempo si se especifica
      if (timeRange) {
        const now = new Date();
        let startDate;

        switch (timeRange) {
          case '7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90_days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        workouts = workouts.filter(workout => new Date(workout.timestamp) >= startDate);
      }

      const stats = {
        total: workouts.length,
        totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
        averageDuration: workouts.length > 0 ? 
          Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length) : 0,
        byExercise: {},
        averageDifficulty: 0,
        averageEnjoyment: 0
      };

      // Agrupar por ejercicio
      workouts.forEach(workout => {
        if (workout.exerciseName) {
          stats.byExercise[workout.exerciseName] = (stats.byExercise[workout.exerciseName] || 0) + 1;
        }
      });

      // Calcular promedios de feedback
      const workoutsWithFeedback = workouts.filter(w => w.difficulty || w.enjoyment);
      if (workoutsWithFeedback.length > 0) {
        const totalDifficulty = workoutsWithFeedback.reduce((sum, w) => sum + (w.difficulty || 0), 0);
        const totalEnjoyment = workoutsWithFeedback.reduce((sum, w) => sum + (w.enjoyment || 0), 0);
        
        stats.averageDifficulty = Math.round(totalDifficulty / workoutsWithFeedback.length);
        stats.averageEnjoyment = Math.round(totalEnjoyment / workoutsWithFeedback.length);
      }

      LoggerService.info('Workout stats retrieved', { userId: user.id });

      return stats;
    } catch (error) {
      LoggerService.error('Error getting workout stats', error);
      throw error;
    }
  }
}

module.exports = WorkoutController; 