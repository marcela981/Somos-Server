/**
 * @fileoverview Middleware de validación
 * @author Marcela
 */

const { ErrorHandler } = require('../core/errorHandler');
const { LoggerService } = require('../services/loggerService');

class ValidationMiddleware {
  /**
   * Middleware de validación general
   * @param {Object} req - Objeto request
   * @param {Object} res - Objeto response
   */
  static validateRequest(req, res) {
    try {
      // Validar que el body sea JSON válido para peticiones POST/PUT
      if (['POST', 'PUT'].includes(req.method) && req.body) {
        this.validateJSONBody(req.body);
      }

      // Validar parámetros de URL
      this.validateURLParams(req.params);

      LoggerService.debug('Request validation passed', { 
        path: req.path, 
        method: req.method 
      });

    } catch (error) {
      LoggerService.error('Request validation failed', error);
      throw error;
    }
  }

  /**
   * Valida el registro de usuario
   * @param {Object} data - Datos del usuario
   * @returns {Object} Datos validados
   */
  static validateUserRegistration(data) {
    const errors = [];

    // Validar campos requeridos
    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('El email debe ser válido');
    }

    if (!data.goal || !this.isValidGoal(data.goal)) {
      errors.push('El objetivo debe ser válido');
    }

    if (!data.experienceLevel || !this.isValidExperienceLevel(data.experienceLevel)) {
      errors.push('El nivel de experiencia debe ser válido');
    }

    if (errors.length > 0) {
      throw ErrorHandler.validationError(errors.join(', '));
    }

    return {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      goal: data.goal,
      experienceLevel: data.experienceLevel,
      equipment: data.equipment || [],
      onboardingCompleted: false
    };
  }

  /**
   * Valida los datos del onboarding
   * @param {Object} data - Datos del onboarding
   * @returns {Object} Datos validados
   */
  static validateOnboardingData(data) {
    const errors = [];

    // Validar datos antropométricos
    if (data.age && (data.age < 13 || data.age > 100)) {
      errors.push('La edad debe estar entre 13 y 100 años');
    }

    if (data.weight && (data.weight < 30 || data.weight > 300)) {
      errors.push('El peso debe estar entre 30 y 300 kg');
    }

    if (data.height && (data.height < 100 || data.height > 250)) {
      errors.push('La altura debe estar entre 100 y 250 cm');
    }

    // Validar medidas corporales
    if (data.measurements) {
      const measurements = data.measurements;
      const validMeasurements = ['neck', 'chest', 'waist', 'hips', 'biceps', 'thighs'];
      
      for (const [key, value] of Object.entries(measurements)) {
        if (validMeasurements.includes(key) && (value < 20 || value > 200)) {
          errors.push(`La medida ${key} debe estar entre 20 y 200 cm`);
        }
      }
    }

    if (errors.length > 0) {
      throw ErrorHandler.validationError(errors.join(', '));
    }

    return data;
  }

  /**
   * Valida el registro de peso
   * @param {Object} data - Datos del peso
   * @returns {Object} Datos validados
   */
  static validateWeightLog(data) {
    const errors = [];

    if (!data.weight || data.weight < 30 || data.weight > 300) {
      errors.push('El peso debe estar entre 30 y 300 kg');
    }

    if (data.bodyFat && (data.bodyFat < 2 || data.bodyFat > 50)) {
      errors.push('El porcentaje de grasa corporal debe estar entre 2% y 50%');
    }

    if (errors.length > 0) {
      throw ErrorHandler.validationError(errors.join(', '));
    }

    return {
      weight: parseFloat(data.weight),
      bodyFat: data.bodyFat ? parseFloat(data.bodyFat) : null,
      notes: data.notes || ''
    };
  }

  /**
   * Valida el registro de entrenamiento
   * @param {Object} data - Datos del entrenamiento
   * @returns {Object} Datos validados
   */
  static validateWorkoutLog(data) {
    const errors = [];

    if (!data.exerciseName || data.exerciseName.trim().length < 3) {
      errors.push('El nombre del ejercicio debe tener al menos 3 caracteres');
    }

    if (data.sets && (data.sets < 1 || data.sets > 20)) {
      errors.push('El número de series debe estar entre 1 y 20');
    }

    if (data.reps && (data.reps < 1 || data.reps > 100)) {
      errors.push('El número de repeticiones debe estar entre 1 y 100');
    }

    if (data.weightLifted && (data.weightLifted < 0 || data.weightLifted > 1000)) {
      errors.push('El peso levantado debe estar entre 0 y 1000 kg');
    }

    if (data.duration && (data.duration < 1 || data.duration > 300)) {
      errors.push('La duración debe estar entre 1 y 300 minutos');
    }

    if (errors.length > 0) {
      throw ErrorHandler.validationError(errors.join(', '));
    }

    return {
      exerciseName: data.exerciseName.trim(),
      sets: data.sets ? parseInt(data.sets) : null,
      reps: data.reps ? parseInt(data.reps) : null,
      weightLifted: data.weightLifted ? parseFloat(data.weightLifted) : null,
      duration: data.duration ? parseInt(data.duration) : null,
      feedback: data.feedback || ''
    };
  }

  /**
   * Valida el registro nutricional
   * @param {Object} data - Datos nutricionales
   * @returns {Object} Datos validados
   */
  static validateNutritionLog(data) {
    const errors = [];

    if (data.calories && (data.calories < 0 || data.calories > 10000)) {
      errors.push('Las calorías deben estar entre 0 y 10000');
    }

    if (data.protein && (data.protein < 0 || data.protein > 1000)) {
      errors.push('La proteína debe estar entre 0 y 1000g');
    }

    if (data.carbs && (data.carbs < 0 || data.carbs > 2000)) {
      errors.push('Los carbohidratos deben estar entre 0 y 2000g');
    }

    if (data.fat && (data.fat < 0 || data.fat > 500)) {
      errors.push('La grasa debe estar entre 0 y 500g');
    }

    if (data.water && (data.water < 0 || data.water > 10)) {
      errors.push('El agua debe estar entre 0 y 10L');
    }

    if (errors.length > 0) {
      throw ErrorHandler.validationError(errors.join(', '));
    }

    return {
      calories: data.calories ? parseInt(data.calories) : null,
      protein: data.protein ? parseFloat(data.protein) : null,
      carbs: data.carbs ? parseFloat(data.carbs) : null,
      fat: data.fat ? parseFloat(data.fat) : null,
      water: data.water ? parseFloat(data.water) : null,
      notes: data.notes || ''
    };
  }

  /**
   * Valida los parámetros de consulta
   * @param {Object} params - Parámetros de consulta
   * @returns {Object} Parámetros validados
   */
  static validateQueryParams(params) {
    const validated = {};

    // Validar límite
    if (params.limit) {
      const limit = parseInt(params.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw ErrorHandler.validationError('El límite debe estar entre 1 y 100');
      }
      validated.limit = limit;
    }

    // Validar offset
    if (params.offset) {
      const offset = parseInt(params.offset);
      if (isNaN(offset) || offset < 0) {
        throw ErrorHandler.validationError('El offset debe ser mayor o igual a 0');
      }
      validated.offset = offset;
    }

    // Validar fechas
    if (params.startDate) {
      if (!this.isValidDate(params.startDate)) {
        throw ErrorHandler.validationError('La fecha de inicio debe ser válida');
      }
      validated.startDate = params.startDate;
    }

    if (params.endDate) {
      if (!this.isValidDate(params.endDate)) {
        throw ErrorHandler.validationError('La fecha de fin debe ser válida');
      }
      validated.endDate = params.endDate;
    }

    return validated;
  }

  /**
   * Valida que el body sea JSON válido
   * @param {Object} body - Body de la petición
   */
  static validateJSONBody(body) {
    if (typeof body !== 'object' || body === null) {
      throw ErrorHandler.validationError('El body debe ser un objeto JSON válido');
    }
  }

  /**
   * Valida los parámetros de URL
   * @param {Object} params - Parámetros de URL
   */
  static validateURLParams(params) {
    // Validar que los IDs sean strings válidos
    for (const [key, value] of Object.entries(params)) {
      if (key.includes('id') && (!value || typeof value !== 'string')) {
        throw ErrorHandler.validationError(`El parámetro ${key} debe ser un ID válido`);
      }
    }
  }

  /**
   * Valida un email
   * @param {string} email - Email a validar
   * @returns {boolean} True si el email es válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida un objetivo de fitness
   * @param {string} goal - Objetivo a validar
   * @returns {boolean} True si el objetivo es válido
   */
  static isValidGoal(goal) {
    const validGoals = [
      'weight_loss',
      'muscle_gain',
      'strength',
      'tone',
      'recomposition',
      'endurance',
      'general_fitness'
    ];
    return validGoals.includes(goal);
  }

  /**
   * Valida un nivel de experiencia
   * @param {string} level - Nivel a validar
   * @returns {boolean} True si el nivel es válido
   */
  static isValidExperienceLevel(level) {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    return validLevels.includes(level);
  }

  /**
   * Valida una fecha
   * @param {string} date - Fecha a validar
   * @returns {boolean} True si la fecha es válida
   */
  static isValidDate(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  }

  /**
   * Sanitiza un string para prevenir inyección
   * @param {string} str - String a sanitizar
   * @returns {string} String sanitizado
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remover tags HTML básicos
      .substring(0, 1000); // Limitar longitud
  }

  /**
   * Valida y sanitiza un objeto completo
   * @param {Object} obj - Objeto a validar y sanitizar
   * @returns {Object} Objeto validado y sanitizado
   */
  static validateAndSanitizeObject(obj) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = isNaN(value) ? 0 : value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.validateAndSanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

module.exports = { ValidationMiddleware }; 