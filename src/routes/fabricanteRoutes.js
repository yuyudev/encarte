// src/routes/fabricantesRoutes.js
const express = require('express');
const router = express.Router();
const fabricanteController = require('../controllers/fabricanteController');

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

router.post('/atualizar', fabricanteController.atualizarFabricantes);

router.get('/tabela', fabricanteController.exibirTabelaFabricantes);


const multer = require('multer');
const path = require('path');

const storageLogos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'img', 'logos'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const uploadLogoFabricante = multer({ storage: storageLogos });

router.get('/upload/:codigo', isAuthenticated, fabricanteController.exibirFormularioUpload);

router.post('/upload/:codigo', isAuthenticated,
  uploadLogoFabricante.single('logo'),
  fabricanteController.processarUpload
);


module.exports = router;
