const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');

// Rutas de IA
router.post('/chat', AIController.chat);
router.post('/workout-plan', AIController.generateWorkoutPlan);
router.post('/nutrition-plan', AIController.generateNutritionPlan);
router.post('/motivation', AIController.getMotivation);
router.post('/analysis', AIController.analyzeProgress);

module.exports = router; 