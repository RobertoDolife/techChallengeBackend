const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const StatsController = require('../controllers/stats.controller');

// POST /auth/login
router.post('/login', AuthController.login);

// GET /auth/stats
router.get('/stats', StatsController.getUserStats);

module.exports = router;
