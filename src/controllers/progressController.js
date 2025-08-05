/**
 * @fileoverview Controlador de progreso
 * @author Marcela
 */

const { DatabaseService } = require('../services/databaseService');
const { ValidationMiddleware } = require('../middleware/validation');
const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class ProgressController {
  /**
   * Obtiene el progreso del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Progreso del usuario
   */
  static async getProgress(req, res) {
    try {
      const user = req.user;
      const { timeRange } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos de progreso
      const weightLogs = DatabaseService.find('DailyLog', { userId: user.id });
      const workoutLogs = DatabaseService.find('Workouts', { userId: user.id });
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: user.id });

      // Filtrar por rango de tiempo si se especifica
      let filteredWeightLogs = weightLogs;
      let filteredWorkoutLogs = workoutLogs;
      let filteredNutritionLogs = nutritionLogs;

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

        filteredWeightLogs = weightLogs.filter(log => new Date(log.timestamp) >= startDate);
        filteredWorkoutLogs = workoutLogs.filter(log => new Date(log.timestamp) >= startDate);
        filteredNutritionLogs = nutritionLogs.filter(log => new Date(log.timestamp) >= startDate);
      }

      // Ordenar por fecha
      filteredWeightLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      filteredWorkoutLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      filteredNutritionLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Calcular estadísticas
      const stats = this.calculateProgressStats(filteredWeightLogs, filteredWorkoutLogs, filteredNutritionLogs);

      LoggerService.info('Progress retrieved', { 
        userId: user.id,
        timeRange: timeRange 
      });

      return {
        weightHistory: filteredWeightLogs,
        workoutHistory: filteredWorkoutLogs,
        nutritionHistory: filteredNutritionLogs,
        stats: stats,
        timeRange: timeRange || 'all'
      };
    } catch (error) {
      LoggerService.error('Error getting progress', error);
      throw error;
    }
  }

  /**
   * Registra el peso del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Registro de peso creado
   */
  static async logWeight(req, res) {
    try {
      const user = req.user;
      const weightData = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Validar datos del peso
      const validatedData = ValidationMiddleware.validateWeightLog(weightData);

      // Crear registro de peso
      const newWeightLog = DatabaseService.insert('DailyLog', {
        ...validatedData,
        userId: user.id
      });

      LoggerService.info('Weight logged', { 
        userId: user.id,
        weight: validatedData.weight 
      });

      return newWeightLog;
    } catch (error) {
      LoggerService.error('Error logging weight', error);
      throw error;
    }
  }

  /**
   * Registra medidas corporales
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Registro de medidas creado
   */
  static async logMeasurements(req, res) {
    try {
      const user = req.user;
      const measurementsData = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Validar medidas corporales
      const validatedData = ValidationMiddleware.validateOnboardingData(measurementsData);

      // Crear registro de medidas
      const newMeasurementsLog = DatabaseService.insert('DailyLog', {
        measurements: validatedData.measurements,
        userId: user.id,
        notes: measurementsData.notes || ''
      });

      LoggerService.info('Measurements logged', { 
        userId: user.id 
      });

      return newMeasurementsLog;
    } catch (error) {
      LoggerService.error('Error logging measurements', error);
      throw error;
    }
  }

  /**
   * Obtiene análisis de progreso
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Análisis de progreso
   */
  static async getAnalytics(req, res) {
    try {
      const user = req.user;
      const { timeRange } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos de progreso
      const weightLogs = DatabaseService.find('DailyLog', { userId: user.id });
      const workoutLogs = DatabaseService.find('Workouts', { userId: user.id });
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: user.id });

      // Filtrar por rango de tiempo
      let filteredWeightLogs = weightLogs;
      let filteredWorkoutLogs = workoutLogs;
      let filteredNutritionLogs = nutritionLogs;

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

        filteredWeightLogs = weightLogs.filter(log => new Date(log.timestamp) >= startDate);
        filteredWorkoutLogs = workoutLogs.filter(log => new Date(log.timestamp) >= startDate);
        filteredNutritionLogs = nutritionLogs.filter(log => new Date(log.timestamp) >= startDate);
      }

      // Calcular análisis detallado
      const analytics = this.calculateDetailedAnalytics(filteredWeightLogs, filteredWorkoutLogs, filteredNutritionLogs);

      LoggerService.info('Analytics retrieved', { 
        userId: user.id,
        timeRange: timeRange 
      });

      return {
        analytics: analytics,
        timeRange: timeRange || 'all',
        dataPoints: {
          weight: filteredWeightLogs.length,
          workouts: filteredWorkoutLogs.length,
          nutrition: filteredNutritionLogs.length
        }
      };
    } catch (error) {
      LoggerService.error('Error getting analytics', error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas de progreso
   * @param {Array} weightLogs - Registros de peso
   * @param {Array} workoutLogs - Registros de entrenamientos
   * @param {Array} nutritionLogs - Registros nutricionales
   * @returns {Object} Estadísticas calculadas
   */
  static calculateProgressStats(weightLogs, workoutLogs, nutritionLogs) {
    const stats = {
      weight: {
        total: weightLogs.length,
        average: 0,
        trend: 'stable',
        change: 0
      },
      workouts: {
        total: workoutLogs.length,
        totalDuration: 0,
        averageDuration: 0,
        mostFrequentExercise: null
      },
      nutrition: {
        total: nutritionLogs.length,
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0
      }
    };

    // Calcular estadísticas de peso
    if (weightLogs.length > 0) {
      const weights = weightLogs.map(log => log.weight).filter(w => w);
      if (weights.length > 0) {
        stats.weight.average = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        
        if (weights.length > 1) {
          const firstWeight = weights[0];
          const lastWeight = weights[weights.length - 1];
          stats.weight.change = lastWeight - firstWeight;
          stats.weight.trend = stats.weight.change > 0 ? 'increasing' : 
                              stats.weight.change < 0 ? 'decreasing' : 'stable';
        }
      }
    }

    // Calcular estadísticas de entrenamientos
    if (workoutLogs.length > 0) {
      const durations = workoutLogs.map(log => log.duration).filter(d => d);
      if (durations.length > 0) {
        stats.workouts.totalDuration = durations.reduce((sum, d) => sum + d, 0);
        stats.workouts.averageDuration = stats.workouts.totalDuration / durations.length;
      }

      // Encontrar ejercicio más frecuente
      const exerciseCounts = {};
      workoutLogs.forEach(log => {
        if (log.exerciseName) {
          exerciseCounts[log.exerciseName] = (exerciseCounts[log.exerciseName] || 0) + 1;
        }
      });

      if (Object.keys(exerciseCounts).length > 0) {
        stats.workouts.mostFrequentExercise = Object.entries(exerciseCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
      }
    }

    // Calcular estadísticas nutricionales
    if (nutritionLogs.length > 0) {
      const calories = nutritionLogs.map(log => log.calories).filter(c => c);
      const protein = nutritionLogs.map(log => log.protein).filter(p => p);
      const carbs = nutritionLogs.map(log => log.carbs).filter(c => c);
      const fat = nutritionLogs.map(log => log.fat).filter(f => f);

      if (calories.length > 0) {
        stats.nutrition.averageCalories = calories.reduce((sum, c) => sum + c, 0) / calories.length;
      }
      if (protein.length > 0) {
        stats.nutrition.averageProtein = protein.reduce((sum, p) => sum + p, 0) / protein.length;
      }
      if (carbs.length > 0) {
        stats.nutrition.averageCarbs = carbs.reduce((sum, c) => sum + c, 0) / carbs.length;
      }
      if (fat.length > 0) {
        stats.nutrition.averageFat = fat.reduce((sum, f) => sum + f, 0) / fat.length;
      }
    }

    return stats;
  }

  /**
   * Calcula análisis detallado de progreso
   * @param {Array} weightLogs - Registros de peso
   * @param {Array} workoutLogs - Registros de entrenamientos
   * @param {Array} nutritionLogs - Registros nutricionales
   * @returns {Object} Análisis detallado
   */
  static calculateDetailedAnalytics(weightLogs, workoutLogs, nutritionLogs) {
    const analytics = {
      trends: {
        weight: this.calculateWeightTrend(weightLogs),
        workouts: this.calculateWorkoutTrend(workoutLogs),
        nutrition: this.calculateNutritionTrend(nutritionLogs)
      },
      insights: [],
      recommendations: []
    };

    // Generar insights
    if (weightLogs.length > 0) {
      const recentWeight = weightLogs[weightLogs.length - 1];
      const firstWeight = weightLogs[0];
      const weightChange = recentWeight.weight - firstWeight.weight;
      
      if (Math.abs(weightChange) > 2) {
        analytics.insights.push({
          type: 'weight_change',
          message: `Has ${weightChange > 0 ? 'ganado' : 'perdido'} ${Math.abs(weightChange).toFixed(1)}kg en este período`,
          value: weightChange
        });
      }
    }

    if (workoutLogs.length > 0) {
      const workoutFrequency = workoutLogs.length / 7; // entrenamientos por semana
      if (workoutFrequency < 3) {
        analytics.insights.push({
          type: 'workout_frequency',
          message: 'Tu frecuencia de entrenamiento es menor a 3 veces por semana',
          value: workoutFrequency
        });
      }
    }

    if (nutritionLogs.length > 0) {
      const avgCalories = nutritionLogs.reduce((sum, log) => sum + (log.calories || 0), 0) / nutritionLogs.length;
      if (avgCalories < 1500) {
        analytics.insights.push({
          type: 'low_calories',
          message: 'Tu consumo promedio de calorías es bajo',
          value: avgCalories
        });
      }
    }

    // Generar recomendaciones
    if (analytics.insights.length > 0) {
      analytics.insights.forEach(insight => {
        switch (insight.type) {
          case 'workout_frequency':
            analytics.recommendations.push('Considera aumentar la frecuencia de entrenamiento a 3-4 veces por semana');
            break;
          case 'low_calories':
            analytics.recommendations.push('Asegúrate de consumir suficientes calorías para mantener tu energía');
            break;
          case 'weight_change':
            if (insight.value > 0) {
              analytics.recommendations.push('Si tu objetivo es perder peso, revisa tu dieta y entrenamiento');
            } else {
              analytics.recommendations.push('¡Excelente progreso! Mantén la consistencia');
            }
            break;
        }
      });
    }

    return analytics;
  }

  /**
   * Calcula tendencia de peso
   * @param {Array} weightLogs - Registros de peso
   * @returns {Object} Tendencia de peso
   */
  static calculateWeightTrend(weightLogs) {
    if (weightLogs.length < 2) {
      return { trend: 'insufficient_data', slope: 0 };
    }

    const weights = weightLogs.map(log => log.weight).filter(w => w);
    if (weights.length < 2) {
      return { trend: 'insufficient_data', slope: 0 };
    }

    // Calcular pendiente usando regresión lineal simple
    const n = weights.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = weights;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    return {
      trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      slope: slope
    };
  }

  /**
   * Calcula tendencia de entrenamientos
   * @param {Array} workoutLogs - Registros de entrenamientos
   * @returns {Object} Tendencia de entrenamientos
   */
  static calculateWorkoutTrend(workoutLogs) {
    if (workoutLogs.length === 0) {
      return { trend: 'no_workouts', frequency: 0 };
    }

    // Agrupar por semana
    const weeklyWorkouts = {};
    workoutLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyWorkouts[weekKey] = (weeklyWorkouts[weekKey] || 0) + 1;
    });

    const frequencies = Object.values(weeklyWorkouts);
    const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;

    return {
      trend: avgFrequency >= 3 ? 'consistent' : 'inconsistent',
      frequency: avgFrequency
    };
  }

  /**
   * Calcula tendencia nutricional
   * @param {Array} nutritionLogs - Registros nutricionales
   * @returns {Object} Tendencia nutricional
   */
  static calculateNutritionTrend(nutritionLogs) {
    if (nutritionLogs.length === 0) {
      return { trend: 'no_data', averageCalories: 0 };
    }

    const calories = nutritionLogs.map(log => log.calories).filter(c => c);
    if (calories.length === 0) {
      return { trend: 'no_calorie_data', averageCalories: 0 };
    }

    const avgCalories = calories.reduce((sum, cal) => sum + cal, 0) / calories.length;

    return {
      trend: avgCalories >= 1500 ? 'adequate' : 'low',
      averageCalories: avgCalories
    };
  }
}

module.exports = ProgressController; 