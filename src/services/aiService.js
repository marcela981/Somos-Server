/**
 * @fileoverview Servicio de IA usando Google Cloud AI Platform
 * @author Marcela
 */

const { VertexAI } = require('@google-cloud/ai');
const { logger } = require('./loggerService');
const { DatabaseService } = require('./databaseService');
const { configureGoogleCloud } = require('../config/vercel');

class AIService {
  constructor() {
    // Configurar credenciales según el entorno
    let credentials;
    if (process.env.NODE_ENV === 'production') {
      credentials = configureGoogleCloud();
    } else {
      credentials = {
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      };
    }

    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.AI_LOCATION || 'us-central1',
      credentials: credentials
    });
    
    this.modelName = process.env.AI_MODEL_NAME || 'gemini-pro';
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.AI_LOCATION || 'us-central1';
  }

  /**
   * Genera recomendaciones de entrenamiento personalizadas
   * @param {Object} userData - Datos del usuario
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} Recomendaciones de entrenamiento
   */
  async generateWorkoutRecommendation(userData, context = {}) {
    try {
      const prompt = this.buildWorkoutPrompt(userData, context);
      const response = await this.callAIAPI(prompt);
      
      // Guardar sugerencia en la base de datos
      await this.saveAISuggestion(userData.id, prompt, response, context);
      
      return {
        recommendation: response,
        context: {
          userGoal: userData.goal,
          experienceLevel: userData.experienceLevel,
          equipment: userData.equipment
        }
      };
    } catch (error) {
      logger.error('Error generating workout recommendation', error);
      throw error;
    }
  }

  /**
   * Genera consejos nutricionales personalizados
   * @param {Object} userData - Datos del usuario
   * @param {Object} nutritionData - Datos nutricionales actuales
   * @returns {Promise<Object>} Consejos nutricionales
   */
  async generateNutritionAdvice(userData, nutritionData = {}) {
    try {
      const prompt = this.buildNutritionPrompt(userData, nutritionData);
      const response = await this.callAIAPI(prompt);
      
      await this.saveAISuggestion(userData.id, prompt, response, { type: 'nutrition' });
      
      return {
        advice: response,
        userStats: {
          currentWeight: userData.currentWeight,
          goal: userData.goal,
          activityLevel: userData.activityLevel
        }
      };
    } catch (error) {
      logger.error('Error generating nutrition advice', error);
      throw error;
    }
  }

  /**
   * Analiza el progreso del usuario
   * @param {Object} userData - Datos del usuario
   * @param {Array} progressData - Datos de progreso
   * @returns {Promise<Object>} Análisis de progreso
   */
  async analyzeProgress(userData, progressData) {
    try {
      const prompt = this.buildProgressAnalysisPrompt(userData, progressData);
      const response = await this.callAIAPI(prompt);
      
      await this.saveAISuggestion(userData.id, prompt, response, { type: 'progress_analysis' });
      
      return {
        analysis: response,
        trends: this.calculateTrends(progressData),
        recommendations: this.extractRecommendations(response)
      };
    } catch (error) {
      logger.error('Error analyzing progress', error);
      throw error;
    }
  }

  /**
   * Genera motivación personalizada
   * @param {Object} userData - Datos del usuario
   * @param {Object} context - Contexto actual
   * @returns {Promise<Object>} Mensaje motivacional
   */
  async generateMotivation(userData, context = {}) {
    try {
      const prompt = this.buildMotivationPrompt(userData, context);
      const response = await this.callAIAPI(prompt);
      
      await this.saveAISuggestion(userData.id, prompt, response, { type: 'motivation' });
      
      return {
        message: response,
        type: context.type || 'general',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating motivation', error);
      throw error;
    }
  }

  /**
   * Construye el prompt para recomendaciones de entrenamiento
   * @param {Object} userData - Datos del usuario
   * @param {Object} context - Contexto adicional
   * @returns {string} Prompt formateado
   */
  buildWorkoutPrompt(userData, context) {
    return `
    Eres un entrenador personal experto en fitness. Necesito que generes una recomendación de entrenamiento personalizada.

    DATOS DEL USUARIO:
    - Objetivo: ${userData.goal}
    - Nivel de experiencia: ${userData.experienceLevel}
    - Equipamiento disponible: ${JSON.stringify(userData.equipment)}
    - Edad: ${userData.age || 'No especificada'}
    - Peso actual: ${userData.currentWeight || 'No especificado'} kg
    - Altura: ${userData.height || 'No especificada'} cm

    CONTEXTO ADICIONAL:
    ${JSON.stringify(context)}

    INSTRUCCIONES:
    1. Genera un plan de entrenamiento de 1 semana
    2. Incluye ejercicios específicos con series, repeticiones y descanso
    3. Adapta los ejercicios al equipamiento disponible
    4. Considera el nivel de experiencia del usuario
    5. Proporciona alternativas para ejercicios que requieran equipamiento no disponible
    6. Incluye consejos de técnica y seguridad

    Responde en formato JSON con la siguiente estructura:
    {
      "weekPlan": [
        {
          "day": "Lunes",
          "focus": "Tren superior",
          "exercises": [
            {
              "name": "Nombre del ejercicio",
              "sets": 3,
              "reps": "10-12",
              "rest": "60s",
              "equipment": "mancuernas",
              "alternative": "Alternativa sin equipamiento"
            }
          ]
        }
      ],
      "tips": ["Consejo 1", "Consejo 2"],
      "progression": "Cómo progresar en las próximas semanas"
    }
    `;
  }

  /**
   * Construye el prompt para consejos nutricionales
   * @param {Object} userData - Datos del usuario
   * @param {Object} nutritionData - Datos nutricionales
   * @returns {string} Prompt formateado
   */
  buildNutritionPrompt(userData, nutritionData) {
    return `
    Eres un nutricionista deportivo experto. Necesito que generes consejos nutricionales personalizados.

    DATOS DEL USUARIO:
    - Objetivo: ${userData.goal}
    - Peso actual: ${userData.currentWeight || 'No especificado'} kg
    - Altura: ${userData.height || 'No especificada'} cm
    - Edad: ${userData.age || 'No especificada'}
    - Nivel de actividad: ${userData.activityLevel || 'Moderado'}

    DATOS NUTRICIONALES ACTUALES:
    ${JSON.stringify(nutritionData)}

    INSTRUCCIONES:
    1. Calcula las necesidades calóricas diarias
    2. Distribuye los macronutrientes (proteínas, carbohidratos, grasas)
    3. Sugiere alimentos específicos
    4. Proporciona consejos para el timing de las comidas
    5. Considera el objetivo del usuario

    Responde en formato JSON:
    {
      "dailyCalories": 2000,
      "macros": {
        "protein": "150g (30%)",
        "carbs": "200g (40%)",
        "fat": "67g (30%)"
      },
      "mealSuggestions": [
        {
          "meal": "Desayuno",
          "foods": ["Avena", "Plátano", "Huevos"],
          "calories": 400
        }
      ],
      "tips": ["Consejo 1", "Consejo 2"],
      "hydration": "Recomendaciones de hidratación"
    }
    `;
  }

  /**
   * Construye el prompt para análisis de progreso
   * @param {Object} userData - Datos del usuario
   * @param {Array} progressData - Datos de progreso
   * @returns {string} Prompt formateado
   */
  buildProgressAnalysisPrompt(userData, progressData) {
    return `
    Eres un analista de datos de fitness. Analiza el progreso del usuario y proporciona insights.

    DATOS DEL USUARIO:
    - Objetivo: ${userData.goal}
    - Peso inicial: ${userData.initialWeight || 'No especificado'} kg
    - Peso actual: ${userData.currentWeight || 'No especificado'} kg

    DATOS DE PROGRESO (últimas 4 semanas):
    ${JSON.stringify(progressData)}

    INSTRUCCIONES:
    1. Analiza las tendencias de peso, medidas y rendimiento
    2. Identifica patrones positivos y áreas de mejora
    3. Detecta posibles estancamientos
    4. Sugiere ajustes al plan de entrenamiento
    5. Proporciona motivación basada en el progreso

    Responde en formato JSON:
    {
      "trends": {
        "weight": "Descripción de la tendencia del peso",
        "strength": "Descripción de la tendencia de fuerza",
        "consistency": "Descripción de la consistencia"
      },
      "insights": ["Insight 1", "Insight 2"],
      "recommendations": ["Recomendación 1", "Recomendación 2"],
      "motivation": "Mensaje motivacional personalizado"
    }
    `;
  }

  /**
   * Construye el prompt para motivación
   * @param {Object} userData - Datos del usuario
   * @param {Object} context - Contexto actual
   * @returns {string} Prompt formateado
   */
  buildMotivationPrompt(userData, context) {
    return `
    Eres un coach motivacional experto en fitness. Genera un mensaje motivacional personalizado.

    DATOS DEL USUARIO:
    - Nombre: ${userData.name || 'Usuario'}
    - Objetivo: ${userData.goal}
    - Días consecutivos entrenando: ${context.consecutiveDays || 0}
    - Último entrenamiento: ${context.lastWorkout || 'No especificado'}

    CONTEXTO:
    ${JSON.stringify(context)}

    INSTRUCCIONES:
    1. Crea un mensaje motivacional personalizado
    2. Celebra los logros recientes
    3. Proporciona perspectiva sobre el objetivo
    4. Incluye un recordatorio del "por qué"
    5. Mantén un tono positivo y alentador

    Responde con un mensaje directo y motivacional (máximo 200 palabras).
    `;
  }

  /**
   * Llama a la API de IA de Google Cloud
   * @param {string} prompt - Prompt a enviar
   * @returns {Promise<string>} Respuesta de la IA
   */
  async callAIAPI(prompt) {
    try {
      // Para esta implementación, usaremos una llamada HTTP directa a la API de Gemini
      // En producción, podrías usar el SDK oficial de Google AI
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_AI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      logger.error('Error calling AI API', error);
      
      // Fallback: respuesta básica si la API falla
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Proporciona una respuesta de fallback cuando la API falla
   * @param {string} prompt - Prompt original
   * @returns {string} Respuesta de fallback
   */
  getFallbackResponse(prompt) {
    if (prompt.includes('entrenamiento')) {
      return JSON.stringify({
        weekPlan: [{
          day: "Lunes",
          focus: "Tren superior",
          exercises: [{
            name: "Flexiones",
            sets: 3,
            reps: "10-12",
            rest: "60s",
            equipment: "cuerpo",
            alternative: "Flexiones con rodillas"
          }]
        }],
        tips: ["Mantén la forma correcta", "Respira de manera controlada"],
        progression: "Aumenta las repeticiones gradualmente"
      });
    }
    
    if (prompt.includes('nutrición')) {
      return JSON.stringify({
        dailyCalories: 2000,
        macros: {
          protein: "150g (30%)",
          carbs: "200g (40%)",
          fat: "67g (30%)"
        },
        mealSuggestions: [{
          meal: "Desayuno",
          foods: ["Avena", "Plátano", "Huevos"],
          calories: 400
        }],
        tips: ["Come proteína en cada comida", "Hidrátate bien"],
        hydration: "Bebe al menos 2L de agua al día"
      });
    }
    
    return "Mantén la consistencia en tu rutina. Cada pequeño paso cuenta hacia tu objetivo.";
  }

  /**
   * Guarda una sugerencia de IA en la base de datos
   * @param {string} userId - ID del usuario
   * @param {string} prompt - Prompt enviado
   * @param {string} response - Respuesta de la IA
   * @param {Object} context - Contexto adicional
   * @returns {Promise<void>}
   */
  async saveAISuggestion(userId, prompt, response, context = {}) {
    try {
      await DatabaseService.insert('aiSuggestions', {
        userId,
        prompt,
        response,
        context,
        timestamp: new Date().toISOString()
      });
      
      logger.info('AI suggestion saved', { userId, type: context.type });
    } catch (error) {
      logger.error('Error saving AI suggestion', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Calcula tendencias básicas de los datos de progreso
   * @param {Array} progressData - Datos de progreso
   * @returns {Object} Tendencias calculadas
   */
  calculateTrends(progressData) {
    if (!progressData || progressData.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const weights = progressData.map(p => p.weight).filter(w => w);
    if (weights.length < 2) {
      return { trend: 'insufficient_weight_data' };
    }

    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const change = lastWeight - firstWeight;
    const weeklyChange = change / (weights.length - 1);

    return {
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      totalChange: change,
      weeklyChange: weeklyChange,
      consistency: this.calculateConsistency(progressData)
    };
  }

  /**
   * Calcula la consistencia del usuario
   * @param {Array} progressData - Datos de progreso
   * @returns {number} Porcentaje de consistencia
   */
  calculateConsistency(progressData) {
    const totalDays = progressData.length;
    const daysWithWorkouts = progressData.filter(p => p.workoutCompleted).length;
    return Math.round((daysWithWorkouts / totalDays) * 100);
  }

  /**
   * Extrae recomendaciones de la respuesta de la IA
   * @param {string} aiResponse - Respuesta de la IA
   * @returns {Array} Array de recomendaciones
   */
  extractRecommendations(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.recommendations || parsed.tips || [];
    } catch (error) {
      // Si no es JSON válido, extraer frases que parezcan recomendaciones
      const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 3); // Retornar las primeras 3 frases
    }
  }
}

module.exports = { AIService: new AIService() }; 