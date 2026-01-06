const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const StatsController = require('../controllers/stats.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// POST /auth/login
router.post('/login', AuthController.login);

// POST /auth/logout (protegida por autenticação)
router.post('/logout', verificarToken, AuthController.logout);

// GET /auth/stats
router.get('/stats', StatsController.getUserStats);

//GET /auth/userInfo
router.get('/userInfo', verificarToken, AuthController.getUserInfo);

module.exports = router;
