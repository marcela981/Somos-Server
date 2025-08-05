/**
 * @fileoverview Punto de entrada principal para la API de Somos Fitness
 * @author Marcela
 */

// Importar módulos
const { Router } = require('./core/router');
const { AuthMiddleware } = require('./middleware/auth');
const { ValidationMiddleware } = require('./middleware/validation');
const { ErrorHandler } = require('./core/errorHandler');

// Importar controladores
const UserController = require('./controllers/userController');
const WorkoutController = require('./controllers/workoutController');
const ProgressController = require('./controllers/progressController');
const AIController = require('./controllers/aiController');
const NutritionController = require('./controllers/nutritionController');

// Importar servicios
const { DatabaseService } = require('./services/databaseService');
const { AIService } = require('./services/aiService');
const { LoggerService } = require('./services/loggerService');

/**
 * Función principal para manejar peticiones GET
 * @param {Object} e - Evento de Google Apps Script
 * @returns {ContentService} Respuesta HTTP
 */
function doGet(e) {
  try {
    LoggerService.info('Incoming GET request', { path: e.parameter.path });
    
    const router = new Router();
    setupRoutes(router);
    
    const response = router.handle(e, 'GET');
    return createResponse(response);
    
  } catch (error) {
    LoggerService.error('Error in doGet', error);
    return ErrorHandler.handle(error);
  }
}

/**
 * Función principal para manejar peticiones POST
 * @param {Object} e - Evento de Google Apps Script
 * @returns {ContentService} Respuesta HTTP
 */
function doPost(e) {
  try {
    LoggerService.info('Incoming POST request', { path: e.parameter.path });
    
    const router = new Router();
    setupRoutes(router);
    
    const response = router.handle(e, 'POST');
    return createResponse(response);
    
  } catch (error) {
    LoggerService.error('Error in doPost', error);
    return ErrorHandler.handle(error);
  }
}

/**
 * Configura todas las rutas de la aplicación
 * @param {Router} router - Instancia del router
 */
function setupRoutes(router) {
  // Middleware global
  router.use(AuthMiddleware.authenticate);
  router.use(ValidationMiddleware.validateRequest);
  
  // Rutas de autenticación
  router.get('/auth/profile', UserController.getProfile);
  router.post('/auth/login', UserController.login);
  router.post('/auth/register', UserController.register);
  
  // Rutas de usuarios
  router.get('/users/:id', UserController.getUser);
  router.put('/users/:id', UserController.updateUser);
  router.post('/users/:id/onboarding', UserController.completeOnboarding);
  
  // Rutas de entrenamientos
  router.get('/workouts', WorkoutController.getWorkouts);
  router.get('/workouts/:id', WorkoutController.getWorkout);
  router.post('/workouts', WorkoutController.createWorkout);
  router.put('/workouts/:id', WorkoutController.updateWorkout);
  router.delete('/workouts/:id', WorkoutController.deleteWorkout);
  router.post('/workouts/:id/feedback', WorkoutController.addFeedback);
  
  // Rutas de progreso
  router.get('/progress', ProgressController.getProgress);
  router.post('/progress/weight', ProgressController.logWeight);
  router.post('/progress/measurements', ProgressController.logMeasurements);
  router.get('/progress/analytics', ProgressController.getAnalytics);
  
  // Rutas de IA
  router.post('/ai/recommendations', AIController.getRecommendations);
  router.post('/ai/workout-plan', AIController.generateWorkoutPlan);
  router.post('/ai/nutrition-advice', AIController.getNutritionAdvice);
  
  // Rutas de nutrición
  router.get('/nutrition/goals', NutritionController.getNutritionGoals);
  router.post('/nutrition/log', NutritionController.logNutrition);
  router.get('/nutrition/history', NutritionController.getNutritionHistory);
  
  // Ruta de health check
  router.get('/health', (req, res) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

/**
 * Crea una respuesta HTTP estándar
 * @param {Object} data - Datos de la respuesta
 * @returns {ContentService} Respuesta HTTP
 */
function createResponse(data) {
  const response = {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Exportar funciones para Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { doGet, doPost };
} 