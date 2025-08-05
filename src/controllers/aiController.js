/**
 * @fileoverview Controlador de IA para recomendaciones y análisis
 * @author Marcela
 */

const { AIService } = require('../services/aiService');
const { DatabaseService } = require('../services/databaseService');
const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class AIController {
  /**
   * Obtiene recomendaciones personalizadas
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Recomendaciones generadas
   */
  static async getRecommendations(req, res) {
    try {
      const user = req.user;
      const { type, context } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos actualizados del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      let recommendation;

      switch (type) {
        case 'workout':
          recommendation = await AIService.generateWorkoutRecommendation(userData, context);
          break;
        case 'nutrition':
          const nutritionData = await this.getUserNutritionData(user.id);
          recommendation = await AIService.generateNutritionAdvice(userData, nutritionData);
          break;
        case 'motivation':
          recommendation = await AIService.generateMotivation(userData, context);
          break;
        default:
          throw ErrorHandler.validationError('Tipo de recomendación no válido');
      }

      LoggerService.info('AI recommendation generated', { 
        userId: user.id, 
        type: type 
      });

      return {
        type: type,
        recommendation: recommendation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      LoggerService.error('Error generating AI recommendation', error);
      throw error;
    }
  }

  /**
   * Genera un plan de entrenamiento personalizado
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Plan de entrenamiento generado
   */
  static async generateWorkoutPlan(req, res) {
    try {
      const user = req.user;
      const { duration, focus, equipment } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos actualizados del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Obtener historial de entrenamientos
      const workoutHistory = await this.getUserWorkoutHistory(user.id);

      const context = {
        duration: duration || '4_weeks',
        focus: focus || userData.goal,
        equipment: equipment || userData.equipment,
        workoutHistory: workoutHistory,
        userPreferences: {
          preferredDuration: duration,
          preferredFocus: focus
        }
      };

      const workoutPlan = await AIService.generateWorkoutRecommendation(userData, context);

      LoggerService.info('Workout plan generated', { 
        userId: user.id, 
        duration: duration,
        focus: focus 
      });

      return {
        plan: workoutPlan,
        metadata: {
          generatedFor: userData.name,
          goal: userData.goal,
          experienceLevel: userData.experienceLevel,
          equipment: userData.equipment,
          duration: duration,
          focus: focus,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      LoggerService.error('Error generating workout plan', error);
      throw error;
    }
  }

  /**
   * Obtiene consejos nutricionales personalizados
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Consejos nutricionales
   */
  static async getNutritionAdvice(req, res) {
    try {
      const user = req.user;
      const { currentWeight, targetWeight, activityLevel } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos actualizados del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Obtener historial nutricional
      const nutritionHistory = await this.getUserNutritionHistory(user.id);

      const nutritionData = {
        currentWeight: currentWeight || userData.weight,
        targetWeight: targetWeight,
        activityLevel: activityLevel || 'moderate',
        goal: userData.goal,
        nutritionHistory: nutritionHistory
      };

      const nutritionAdvice = await AIService.generateNutritionAdvice(userData, nutritionData);

      LoggerService.info('Nutrition advice generated', { 
        userId: user.id 
      });

      return {
        advice: nutritionAdvice,
        userData: {
          currentWeight: nutritionData.currentWeight,
          targetWeight: nutritionData.targetWeight,
          goal: userData.goal
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      LoggerService.error('Error generating nutrition advice', error);
      throw error;
    }
  }

  /**
   * Analiza el progreso del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Análisis de progreso
   */
  static async analyzeProgress(req, res) {
    try {
      const user = req.user;
      const { timeRange } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos actualizados del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Obtener datos de progreso
      const progressData = await this.getUserProgressData(user.id, timeRange);

      const analysis = await AIService.analyzeProgress(userData, progressData);

      LoggerService.info('Progress analysis generated', { 
        userId: user.id,
        timeRange: timeRange 
      });

      return {
        analysis: analysis,
        progressData: {
          weightHistory: progressData.weightHistory,
          workoutHistory: progressData.workoutHistory,
          nutritionHistory: progressData.nutritionHistory
        },
        userGoal: userData.goal,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      LoggerService.error('Error analyzing progress', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de entrenamientos del usuario
   * @param {string} userId - ID del usuario
   * @returns {Array} Historial de entrenamientos
   */
  static async getUserWorkoutHistory(userId) {
    try {
      const workouts = DatabaseService.find('Workouts', { userId: userId });
      
      // Ordenar por fecha (más reciente primero)
      return workouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      LoggerService.error('Error getting user workout history', error);
      return [];
    }
  }

  /**
   * Obtiene los datos nutricionales del usuario
   * @param {string} userId - ID del usuario
   * @returns {Object} Datos nutricionales
   */
  static async getUserNutritionData(userId) {
    try {
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: userId });
      
      if (nutritionLogs.length === 0) {
        return {
          averageCalories: 2000,
          averageProtein: 150,
          averageCarbs: 200,
          averageFat: 67
        };
      }

      // Calcular promedios
      const totals = nutritionLogs.reduce((acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const count = nutritionLogs.length;

      return {
        averageCalories: Math.round(totals.calories / count),
        averageProtein: Math.round(totals.protein / count),
        averageCarbs: Math.round(totals.carbs / count),
        averageFat: Math.round(totals.fat / count),
        recentLogs: nutritionLogs.slice(0, 7) // Últimos 7 días
      };
    } catch (error) {
      LoggerService.error('Error getting user nutrition data', error);
      return {
        averageCalories: 2000,
        averageProtein: 150,
        averageCarbs: 200,
        averageFat: 67
      };
    }
  }

  /**
   * Obtiene el historial nutricional del usuario
   * @param {string} userId - ID del usuario
   * @returns {Array} Historial nutricional
   */
  static async getUserNutritionHistory(userId) {
    try {
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: userId });
      
      // Ordenar por fecha (más reciente primero)
      return nutritionLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      LoggerService.error('Error getting user nutrition history', error);
      return [];
    }
  }

  /**
   * Obtiene los datos de progreso del usuario
   * @param {string} userId - ID del usuario
   * @param {string} timeRange - Rango de tiempo (opcional)
   * @returns {Object} Datos de progreso
   */
  static async getUserProgressData(userId, timeRange = '30_days') {
    try {
      const now = new Date();
      let startDate;

      // Calcular fecha de inicio según el rango
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
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Obtener datos de peso
      const weightLogs = DatabaseService.find('DailyLog', { userId: userId });
      const weightHistory = weightLogs
        .filter(log => new Date(log.timestamp) >= startDate)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Obtener entrenamientos
      const workoutLogs = DatabaseService.find('Workouts', { userId: userId });
      const workoutHistory = workoutLogs
        .filter(log => new Date(log.timestamp) >= startDate)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Obtener datos nutricionales
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: userId });
      const nutritionHistory = nutritionLogs
        .filter(log => new Date(log.timestamp) >= startDate)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        weightHistory: weightHistory,
        workoutHistory: workoutHistory,
        nutritionHistory: nutritionHistory,
        timeRange: timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      };
    } catch (error) {
      LoggerService.error('Error getting user progress data', error);
      return {
        weightHistory: [],
        workoutHistory: [],
        nutritionHistory: [],
        timeRange: timeRange
      };
    }
  }

  /**
   * Obtiene estadísticas de uso de IA
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Estadísticas de IA
   */
  static async getAIStats(req, res) {
    try {
      const user = req.user;
      
      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      const aiSuggestions = DatabaseService.find('AISuggestions', { userId: user.id });
      
      const stats = {
        totalSuggestions: aiSuggestions.length,
        byType: {},
        recentSuggestions: aiSuggestions.slice(-10) // Últimas 10 sugerencias
      };

      // Agrupar por tipo
      aiSuggestions.forEach(suggestion => {
        const context = JSON.parse(suggestion.context || '{}');
        const type = context.type || 'general';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      LoggerService.info('AI stats retrieved', { userId: user.id });

      return stats;
    } catch (error) {
      LoggerService.error('Error getting AI stats', error);
      throw error;
    }
  }
}

module.exports = AIController; 