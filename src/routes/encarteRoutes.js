// src/routes/encarteRoutes.js
const express = require('express');
const router = express.Router();

const criar = require('../controllers/encarteControllers/criar');
const detalhar = require('../controllers/encarteControllers/detalhar');
const editarEncarte = require('../controllers/encarteControllers/editarEncarte');
const listarEncartes = require('../controllers/encarteControllers/listarEncartes');
const mostrarFormulario = require('../controllers/encarteControllers/mostrarFormulario');
const previewHtml = require('../controllers/encarteControllers/previewHtml');
const pdf = require('../controllers/encarteControllers/pdf');

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// Rotas protegidas
router.get('/new', isAuthenticated, mostrarFormulario.mostrarFormulario);
router.post('/', isAuthenticated, criar.criar);
router.get('/', isAuthenticated, listarEncartes.listarEncartes);
router.get('/:id', isAuthenticated, detalhar.detalhar);
router.get('/editar/:id', isAuthenticated, editarEncarte.mostrarFormularioEdicao);
router.post('/editar/:id', isAuthenticated, editarEncarte.editarEncarte);
router.get('/:id/preview', isAuthenticated, previewHtml.previewHtml);
router.post('/excluir/:id', isAuthenticated, listarEncartes.excluirEncarte);


module.exports = router;
