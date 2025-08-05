const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Rutas de autenticación
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/refresh-token', UserController.refreshToken);

module.exports = router; 