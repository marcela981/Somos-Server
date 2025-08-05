const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/progressController');

// Rutas de progreso
router.get('/', ProgressController.getProgress);
router.post('/', ProgressController.createProgress);
router.get('/:id', ProgressController.getProgressById);
router.put('/:id', ProgressController.updateProgress);
router.delete('/:id', ProgressController.deleteProgress);
router.get('/analytics', ProgressController.getAnalytics);
router.get('/goals', ProgressController.getGoals);
router.post('/goals', ProgressController.createGoal);

module.exports = router; 