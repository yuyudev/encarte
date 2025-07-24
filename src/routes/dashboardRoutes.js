const express = require('express');
const router = express.Router();

const fabricanteController = require('../controllers/fabricanteController');
const syncProdutosController = require('../controllers/syncProdutosController');

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/auth/login');
}

router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

router.get('/sync-fabricantes', isAuthenticated, fabricanteController.atualizarFabricantes);

router.get('/sync-products', isAuthenticated, syncProdutosController.syncProducts);

module.exports = router;
