const express = require('express');
const router = express.Router();
const NutritionController = require('../controllers/nutritionController');

// Rutas de nutrición
router.get('/meals', NutritionController.getMeals);
router.post('/meals', NutritionController.createMeal);
router.get('/meals/:id', NutritionController.getMealById);
router.put('/meals/:id', NutritionController.updateMeal);
router.delete('/meals/:id', NutritionController.deleteMeal);
router.get('/recommendations', NutritionController.getRecommendations);
router.get('/tracking', NutritionController.getTracking);
router.post('/tracking', NutritionController.trackNutrition);

module.exports = router; 