const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// POST /auth -> login
router.post('/', AuthController.login);

module.exports = router;
