// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.mostrarLogin);
router.post('/login', authController.processarLogin);
router.get('/logout', authController.logout);

module.exports = router;
