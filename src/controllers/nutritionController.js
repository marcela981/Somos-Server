/**
 * @fileoverview Controlador de nutrición
 * @author Marcela
 */

const { DatabaseService } = require('../services/databaseService');
const { ValidationMiddleware } = require('../middleware/validation');
const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class NutritionController {
  /**
   * Obtiene los objetivos nutricionales del usuario
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Objetivos nutricionales
   */
  static async getNutritionGoals(req, res) {
    try {
      const user = req.user;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Calcular objetivos nutricionales basados en el objetivo del usuario
      const goals = this.calculateNutritionGoals(userData);

      LoggerService.info('Nutrition goals retrieved', { userId: user.id });

      return {
        user: {
          name: userData.name,
          goal: userData.goal,
          currentWeight: userData.weight,
          height: userData.height,
          age: userData.age
        },
        goals: goals
      };
    } catch (error) {
      LoggerService.error('Error getting nutrition goals', error);
      throw error;
    }
  }

  /**
   * Registra datos nutricionales
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Registro nutricional creado
   */
  static async logNutrition(req, res) {
    try {
      const user = req.user;
      const nutritionData = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Validar datos nutricionales
      const validatedData = ValidationMiddleware.validateNutritionLog(nutritionData);

      // Crear registro nutricional
      const newNutritionLog = DatabaseService.insert('Nutrition', {
        ...validatedData,
        userId: user.id
      });

      LoggerService.info('Nutrition logged', { 
        userId: user.id,
        calories: validatedData.calories 
      });

      return newNutritionLog;
    } catch (error) {
      LoggerService.error('Error logging nutrition', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial nutricional
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Historial nutricional
   */
  static async getNutritionHistory(req, res) {
    try {
      const user = req.user;
      const { limit, offset, startDate, endDate } = req.params;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      let nutritionLogs = DatabaseService.find('Nutrition', { userId: user.id });

      // Filtrar por fechas si se especifican
      if (startDate || endDate) {
        nutritionLogs = nutritionLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return logDate >= start && logDate <= end;
        });
      }

      // Ordenar por fecha (más reciente primero)
      nutritionLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Aplicar paginación
      const start = offset ? parseInt(offset) : 0;
      const limitNum = limit ? parseInt(limit) : 50;
      const paginatedLogs = nutritionLogs.slice(start, start + limitNum);

      // Calcular estadísticas
      const stats = this.calculateNutritionStats(nutritionLogs);

      LoggerService.info('Nutrition history retrieved', { 
        userId: user.id, 
        count: paginatedLogs.length 
      });

      return {
        logs: paginatedLogs,
        stats: stats,
        pagination: {
          total: nutritionLogs.length,
          limit: limitNum,
          offset: start,
          hasMore: start + limitNum < nutritionLogs.length
        }
      };
    } catch (error) {
      LoggerService.error('Error getting nutrition history', error);
      throw error;
    }
  }

  /**
   * Calcula objetivos nutricionales basados en el usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Objetivos nutricionales
   */
  static calculateNutritionGoals(userData) {
    const goals = {
      dailyCalories: 2000,
      macros: {
        protein: { grams: 150, percentage: 30 },
        carbs: { grams: 200, percentage: 40 },
        fat: { grams: 67, percentage: 30 }
      },
      hydration: {
        dailyWater: 2.5, // litros
        recommendation: 'Bebe al menos 8 vasos de agua al día'
      },
      mealTiming: {
        breakfast: { calories: 500, time: '7:00-9:00' },
        snack1: { calories: 200, time: '10:00-11:00' },
        lunch: { calories: 600, time: '13:00-14:00' },
        snack2: { calories: 200, time: '16:00-17:00' },
        dinner: { calories: 500, time: '19:00-20:00' }
      }
    };

    // Ajustar según el objetivo del usuario
    switch (userData.goal) {
      case 'weight_loss':
        goals.dailyCalories = 1800;
        goals.macros.protein.grams = 180;
        goals.macros.protein.percentage = 40;
        goals.macros.carbs.grams = 135;
        goals.macros.carbs.percentage = 30;
        goals.macros.fat.grams = 60;
        goals.macros.fat.percentage = 30;
        break;
      case 'muscle_gain':
        goals.dailyCalories = 2500;
        goals.macros.protein.grams = 200;
        goals.macros.protein.percentage = 32;
        goals.macros.carbs.grams = 250;
        goals.macros.carbs.percentage = 40;
        goals.macros.fat.grams = 83;
        goals.macros.fat.percentage = 30;
        break;
      case 'strength':
        goals.dailyCalories = 2200;
        goals.macros.protein.grams = 165;
        goals.macros.protein.percentage = 30;
        goals.macros.carbs.grams = 220;
        goals.macros.carbs.percentage = 40;
        goals.macros.fat.grams = 73;
        goals.macros.fat.percentage = 30;
        break;
      case 'tone':
        goals.dailyCalories = 2000;
        goals.macros.protein.grams = 150;
        goals.macros.protein.percentage = 30;
        goals.macros.carbs.grams = 200;
        goals.macros.carbs.percentage = 40;
        goals.macros.fat.grams = 67;
        goals.macros.fat.percentage = 30;
        break;
      case 'recomposition':
        goals.dailyCalories = 2100;
        goals.macros.protein.grams = 175;
        goals.macros.protein.percentage = 33;
        goals.macros.carbs.grams = 210;
        goals.macros.carbs.percentage = 40;
        goals.macros.fat.grams = 70;
        goals.macros.fat.percentage = 30;
        break;
    }

    // Ajustar según peso y altura si están disponibles
    if (userData.weight && userData.height) {
      const bmr = this.calculateBMR(userData.weight, userData.height, userData.age);
      const tdee = bmr * 1.55; // Factor de actividad moderada
      
      // Ajustar calorías según el objetivo
      switch (userData.goal) {
        case 'weight_loss':
          goals.dailyCalories = Math.round(tdee - 500);
          break;
        case 'muscle_gain':
          goals.dailyCalories = Math.round(tdee + 300);
          break;
        default:
          goals.dailyCalories = Math.round(tdee);
      }

      // Recalcular macros basados en las nuevas calorías
      goals.macros.protein.grams = Math.round(goals.dailyCalories * goals.macros.protein.percentage / 100 / 4);
      goals.macros.carbs.grams = Math.round(goals.dailyCalories * goals.macros.carbs.percentage / 100 / 4);
      goals.macros.fat.grams = Math.round(goals.dailyCalories * goals.macros.fat.percentage / 100 / 9);
    }

    return goals;
  }

  /**
   * Calcula el metabolismo basal (BMR)
   * @param {number} weight - Peso en kg
   * @param {number} height - Altura en cm
   * @param {number} age - Edad en años
   * @returns {number} BMR en calorías
   */
  static calculateBMR(weight, height, age) {
    // Fórmula de Mifflin-St Jeor
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }

  /**
   * Calcula estadísticas nutricionales
   * @param {Array} nutritionLogs - Registros nutricionales
   * @returns {Object} Estadísticas nutricionales
   */
  static calculateNutritionStats(nutritionLogs) {
    const stats = {
      total: nutritionLogs.length,
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      averageWater: 0,
      consistency: 0,
      goalAchievement: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    };

    if (nutritionLogs.length === 0) {
      return stats;
    }

    // Calcular promedios
    const calories = nutritionLogs.map(log => log.calories).filter(c => c);
    const protein = nutritionLogs.map(log => log.protein).filter(p => p);
    const carbs = nutritionLogs.map(log => log.carbs).filter(c => c);
    const fat = nutritionLogs.map(log => log.fat).filter(f => f);
    const water = nutritionLogs.map(log => log.water).filter(w => w);

    if (calories.length > 0) {
      stats.averageCalories = Math.round(calories.reduce((sum, c) => sum + c, 0) / calories.length);
    }
    if (protein.length > 0) {
      stats.averageProtein = Math.round(protein.reduce((sum, p) => sum + p, 0) / protein.length);
    }
    if (carbs.length > 0) {
      stats.averageCarbs = Math.round(carbs.reduce((sum, c) => sum + c, 0) / carbs.length);
    }
    if (fat.length > 0) {
      stats.averageFat = Math.round(fat.reduce((sum, f) => sum + f, 0) / fat.length);
    }
    if (water.length > 0) {
      stats.averageWater = Math.round(water.reduce((sum, w) => sum + w, 0) / water.length * 10) / 10;
    }

    // Calcular consistencia (días consecutivos con registro)
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let lastDate = null;

    nutritionLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    nutritionLogs.forEach(log => {
      const logDate = new Date(log.timestamp).toDateString();
      
      if (lastDate === null) {
        currentConsecutive = 1;
      } else {
        const daysDiff = Math.floor((new Date(logDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentConsecutive++;
        } else {
          currentConsecutive = 1;
        }
      }
      
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      lastDate = logDate;
    });

    stats.consistency = maxConsecutive;

    return stats;
  }

  /**
   * Obtiene recomendaciones nutricionales
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   * @returns {Object} Recomendaciones nutricionales
   */
  static async getNutritionRecommendations(req, res) {
    try {
      const user = req.user;
      const { currentWeight, targetWeight } = req.body;

      if (!user) {
        throw ErrorHandler.authenticationError('Usuario no autenticado');
      }

      // Obtener datos del usuario
      const userData = DatabaseService.findById('Users', user.id);
      if (!userData) {
        throw ErrorHandler.notFoundError('Usuario no encontrado');
      }

      // Obtener historial nutricional reciente
      const nutritionLogs = DatabaseService.find('Nutrition', { userId: user.id });
      const recentLogs = nutritionLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 7); // Últimos 7 días

      // Calcular recomendaciones
      const recommendations = this.generateNutritionRecommendations(userData, recentLogs, currentWeight, targetWeight);

      LoggerService.info('Nutrition recommendations generated', { userId: user.id });

      return {
        user: {
          name: userData.name,
          goal: userData.goal,
          currentWeight: currentWeight || userData.weight,
          targetWeight: targetWeight
        },
        recommendations: recommendations,
        recentStats: this.calculateNutritionStats(recentLogs)
      };
    } catch (error) {
      LoggerService.error('Error getting nutrition recommendations', error);
      throw error;
    }
  }

  /**
   * Genera recomendaciones nutricionales
   * @param {Object} userData - Datos del usuario
   * @param {Array} recentLogs - Registros recientes
   * @param {number} currentWeight - Peso actual
   * @param {number} targetWeight - Peso objetivo
   * @returns {Object} Recomendaciones
   */
  static generateNutritionRecommendations(userData, recentLogs, currentWeight, targetWeight) {
    const recommendations = {
      general: [],
      specific: [],
      mealSuggestions: []
    };

    // Análisis de calorías
    const avgCalories = recentLogs.length > 0 ? 
      recentLogs.reduce((sum, log) => sum + (log.calories || 0), 0) / recentLogs.length : 0;

    if (avgCalories < 1500) {
      recommendations.general.push('Tu consumo de calorías es bajo. Considera aumentar la ingesta para mantener tu energía.');
    } else if (avgCalories > 3000) {
      recommendations.general.push('Tu consumo de calorías es alto. Considera reducir la ingesta si tu objetivo es perder peso.');
    }

    // Análisis de proteína
    const avgProtein = recentLogs.length > 0 ? 
      recentLogs.reduce((sum, log) => sum + (log.protein || 0), 0) / recentLogs.length : 0;

    if (avgProtein < 100) {
      recommendations.specific.push('Aumenta tu consumo de proteína. Incluye más carne, pescado, huevos y legumbres.');
    }

    // Análisis de hidratación
    const avgWater = recentLogs.length > 0 ? 
      recentLogs.reduce((sum, log) => sum + (log.water || 0), 0) / recentLogs.length : 0;

    if (avgWater < 2) {
      recommendations.specific.push('Aumenta tu consumo de agua. Intenta beber al menos 2.5L por día.');
    }

    // Sugerencias de comidas según el objetivo
    switch (userData.goal) {
      case 'weight_loss':
        recommendations.mealSuggestions = [
          'Desayuno: Avena con frutas y nueces',
          'Almuerzo: Ensalada con proteína magra',
          'Cena: Pescado con verduras al vapor'
        ];
        break;
      case 'muscle_gain':
        recommendations.mealSuggestions = [
          'Desayuno: Batido de proteína con avena',
          'Almuerzo: Arroz con pollo y verduras',
          'Cena: Salmón con quinoa y brócoli'
        ];
        break;
      default:
        recommendations.mealSuggestions = [
          'Desayuno: Yogur griego con granola',
          'Almuerzo: Sándwich integral con pavo',
          'Cena: Pasta integral con salsa de tomate'
        ];
    }

    return recommendations;
  }
}

module.exports = NutritionController; 