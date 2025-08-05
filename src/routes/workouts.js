const express = require('express');
const router = express.Router();
const WorkoutController = require('../controllers/workoutController');

// Rutas de entrenamientos
router.get('/', WorkoutController.getWorkouts);
router.post('/', WorkoutController.createWorkout);
router.get('/:id', WorkoutController.getWorkoutById);
router.put('/:id', WorkoutController.updateWorkout);
router.delete('/:id', WorkoutController.deleteWorkout);
router.post('/:id/complete', WorkoutController.completeWorkout);
router.get('/recommendations', WorkoutController.getRecommendations);

module.exports = router; 