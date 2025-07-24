const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Middleware de autenticação
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/auth/login');
}

// Configuração do Multer para imagens de produtos
const storageProdutos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'img', 'produtos'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const uploadProdutos = multer({ storage: storageProdutos });

// Configuração do Multer para logos de fabricantes
const storageLogos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'img', 'logos'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const uploadLogos = multer({ storage: storageLogos });

// Rotas para upload de imagens de produtos
router.get('/upload/produtos', isAuthenticated, (req, res) => {
  res.render('upload-produtos');
});

router.post('/upload/produtos', isAuthenticated, uploadProdutos.array('images', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    res.render('upload-sucesso', {
      message: 'Imagens de produtos enviadas com sucesso!',
      redirect: '/dashboard'
    });
  } else {
    res.render('upload-erro', {
      message: 'Erro no upload das imagens de produtos.'
    });
  }
});

// Rotas para upload de logos de fabricantes
router.get('/upload/logos', isAuthenticated, (req, res) => {
  res.render('upload-logos');
});

router.post('/upload/logos', isAuthenticated, uploadLogos.array('images', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    res.render('upload-sucesso', {
      message: 'Logos enviadas com sucesso!',
      redirect: '/dashboard'
    });
  } else {
    res.render('upload-erro', {
      message: 'Erro no upload das logos.'
    });
  }
});

module.exports = router;
