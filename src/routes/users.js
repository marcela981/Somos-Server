const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Rutas de usuarios
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.delete('/profile', UserController.deleteProfile);
router.get('/onboarding', UserController.getOnboardingData);
router.post('/onboarding', UserController.setOnboardingData);

module.exports = router; 